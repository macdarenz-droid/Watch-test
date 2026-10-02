/**
 * Plate Sense mutations (§25): gyms and the unit each piece of equipment speaks.
 * Loads already logged keep their canonical kg; these only change how new loads
 * are typed and which targets are loadable.
 */
import { newId, MAX_GYMS, type EquipmentProfile, type LoadUnit, type UnitsState } from '@/core/models';
import { state, update } from '@/core/store';
import { findExercise } from '@/core/exercises';
import { equipmentGroup } from '@/brain/coach/cues';
import { defaultProfile, resolveProfile } from '@/brain/units';

function patchUnits(fn: (u: UnitsState) => UnitsState): void {
  update(s => ({ ...s, units: fn(s.units) }));
}

export function activeGymId(): string { return state.value.units.activeGymId; }

/** The profile Train should use for this exercise right now. */
export function profileFor(exerciseId: string, gymId = activeGymId()): EquipmentProfile {
  const s = state.value;
  return resolveProfile(exerciseId, gymId, s.units, findExercise(exerciseId, s.customExercises));
}

/**
 * Flips the entry unit for one exercise at one gym and remembers it. A ladder, plate set
 * or bar in the old unit no longer describes the equipment, so they are replaced by the
 * built-in ones for the new unit (a 45 lb bar with lb plates).
 */
export function setExerciseUnit(exerciseId: string, unit: LoadUnit, source: EquipmentProfile['source'] = 'user', gymId = activeGymId()): void {
  const ex = findExercise(exerciseId, state.value.customExercises);
  const current = profileFor(exerciseId, gymId);
  const next: EquipmentProfile = current.unit === unit
    ? { ...current, source, updatedAt: new Date().toISOString() }
    : { ...defaultProfile(ex?.equipment ?? '', unit), source, updatedAt: new Date().toISOString() };
  patchUnits(u => ({ ...u, byExercise: { ...u.byExercise, [gymId]: { ...(u.byExercise[gymId] ?? {}), [exerciseId]: next } } }));
}

/** "Use lb for all Dumbbells here." */
export function setEquipmentUnit(group: string, unit: LoadUnit, gymId = activeGymId()): void {
  const next: EquipmentProfile = { ...defaultProfile(group, unit), source: 'user', updatedAt: new Date().toISOString() };
  patchUnits(u => {
    // Exercises of this group at this gym that were only flipped (not hand-tuned) follow the group.
    const exMap = { ...(u.byExercise[gymId] ?? {}) };
    for (const [id, p] of Object.entries(exMap)) {
      const ex = findExercise(id, state.value.customExercises);
      if (ex && equipmentGroup(ex.equipment) === group && p.source !== 'escobar_scan') delete exMap[id];
    }
    return { ...u, byExercise: { ...u.byExercise, [gymId]: exMap }, byEquipment: { ...u.byEquipment, [gymId]: { ...(u.byEquipment[gymId] ?? {}), [group]: next } } };
  });
}

const ASK_EPS = 0.005;

/** LT-4 (§2): drops the rungs strictly between `current` and `answer`, adds `answer`, keeps the rest.
 * Never returns a two-rung ladder: when dropping would leave fewer than three rungs, nothing is dropped. */
function mergeLadder(ladder: number[], current: number, answer: number): number[] {
  const dropped = ladder.filter(v => v <= current + ASK_EPS || v >= answer - ASK_EPS);
  const withAnswer = [...new Set([...dropped, answer])].sort((a, b) => a - b);
  return withAnswer.length >= 3 ? withAnswer : [...new Set([...ladder, answer])].sort((a, b) => a - b);
}

/**
 * LT-4 (§2): the answer to the Train card's one-time ask ("which weight comes after X here?"), merged
 * into `profile`, in the profile's own unit. A ladder profile merges per `mergeLadder`; any other
 * profile (a stack: step, add-ons or the plain default step) becomes `step = answer − current`.
 * An answer at or below `current` is not "after" it, so it is rejected: the profile comes back
 * unchanged (review r1: a bad "Other" value must never reach a stored `step`, even from a caller
 * that skips `AskWeightChip`'s own Save guard).
 */
export function mergeAskAnswer(profile: EquipmentProfile, current: number, answer: number): EquipmentProfile {
  if (!(answer > current)) return profile;
  const updatedAt = new Date().toISOString();
  if (profile.ladder?.length) return { ...profile, ladder: mergeLadder(profile.ladder, current, answer), source: 'user', updatedAt };
  return { ...profile, step: Math.max(0.01, Math.round((answer - current) * 1000) / 1000), source: 'user', updatedAt };
}

export function saveProfile(scope: 'exercise' | 'equipment', key: string, profile: EquipmentProfile, gymId = activeGymId()): void {
  patchUnits(u => scope === 'exercise'
    ? { ...u, byExercise: { ...u.byExercise, [gymId]: { ...(u.byExercise[gymId] ?? {}), [key]: profile } } }
    : { ...u, byEquipment: { ...u.byEquipment, [gymId]: { ...(u.byEquipment[gymId] ?? {}), [key]: profile } } });
}

export function resetProfile(scope: 'exercise' | 'equipment', key: string, gymId: string): void {
  patchUnits(u => {
    const map = { ...((scope === 'exercise' ? u.byExercise : u.byEquipment)[gymId] ?? {}) };
    delete map[key];
    return scope === 'exercise' ? { ...u, byExercise: { ...u.byExercise, [gymId]: map as Record<string, EquipmentProfile> } } : { ...u, byEquipment: { ...u.byEquipment, [gymId]: map } };
  });
}

export function setActiveGym(gymId: string): void {
  if (!state.value.units.gyms.some(g => g.id === gymId)) return;
  patchUnits(u => ({ ...u, activeGymId: gymId }));
}

/** Adds a gym and makes it active. Null at the cap. */
export function addGym(name: string, defaultUnit: LoadUnit): string | null {
  if (state.value.units.gyms.length >= MAX_GYMS) return null;
  const id = newId('gym');
  patchUnits(u => ({ ...u, gyms: [...u.gyms, { id, name: name.trim().slice(0, 28) || 'Gym', defaultUnit, createdAt: new Date().toISOString() }], activeGymId: id }));
  return id;
}

export function renameGym(gymId: string, name: string): void {
  const n = name.trim().slice(0, 28);
  if (!n) return;
  patchUnits(u => ({ ...u, gyms: u.gyms.map(g => (g.id === gymId ? { ...g, name: n } : g)) }));
}

export function setGymDefaultUnit(gymId: string, unit: LoadUnit): void {
  patchUnits(u => ({ ...u, gyms: u.gyms.map(g => (g.id === gymId ? { ...g, defaultUnit: unit } : g)) }));
}

/** Removes a gym and its profiles. The last gym stays. */
export function deleteGym(gymId: string): void {
  patchUnits(u => {
    if (u.gyms.length <= 1) return u;
    const gyms = u.gyms.filter(g => g.id !== gymId);
    const { [gymId]: _a, ...byExercise } = u.byExercise;
    const { [gymId]: _b, ...byEquipment } = u.byEquipment;
    return { gyms, activeGymId: u.activeGymId === gymId ? gyms[0]!.id : u.activeGymId, byExercise, byEquipment };
  });
}
