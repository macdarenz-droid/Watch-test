import { describe, expect, it } from 'vitest';
import { replaceState, state } from '@/core/store';
import { freshState } from '@/core/models';
import { moveEntry } from '@/slices/workout/session';

describe('live session reorder', () => {
  it('moves an exercise up or down and keeps its sets', () => {
    const e = (id: string) => ({ exerciseId: id, name: id, sets: [{ kg: 20, reps: 5 }], done: false, skipped: false });
    replaceState({ ...freshState(), active: { splitId: 's', startedAt: new Date().toISOString(), entries: [e('a'), e('b'), e('c')] } as never });
    // R2.8: a loaded live session gets entry and set ids; reordering keeps them.
    const ids = state.value.active!.entries.map(x => [x.id, x.sets[0]!.id]);
    expect(ids.flat().every(Boolean)).toBe(true);
    moveEntry(0, 2);
    expect(state.value.active!.entries.map(x => x.exerciseId)).toEqual(['b', 'c', 'a']);
    moveEntry(2, 0);
    expect(state.value.active!.entries.map(x => x.exerciseId)).toEqual(['a', 'b', 'c']);
    expect(state.value.active!.entries[0]!.sets).toEqual([{ id: ids[0]![1], kg: 20, reps: 5 }]);
    expect(state.value.active!.entries.map(x => [x.id, x.sets[0]!.id])).toEqual(ids);
    moveEntry(1, 7);
    expect(state.value.active!.entries.map(x => x.exerciseId)).toEqual(['a', 'b', 'c']);
  });
});
