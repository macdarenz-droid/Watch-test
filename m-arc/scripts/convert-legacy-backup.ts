/**
 * Convert a backup from the previous M/ARC (any shape that holds the old
 * storage root) into the current app's backup format.
 *
 *   npm run convert-backup -- <old-backup.json> [output.json]
 *
 * The output can be restored from Settings → Your data → Restore backup.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { asLegacyRoot, convertLegacy } from '@/core/migrate';
import { findExercise } from '@/core/exercises';
import { APP_VERSION } from '@/core/version';

const [input, output] = process.argv.slice(2);
if (!input) { console.error('usage: convert-backup <old-backup.json> [output.json]'); process.exit(2); }
const legacy = asLegacyRoot(JSON.parse(readFileSync(input, 'utf8')));
if (!legacy) { console.error('That file does not contain the previous app\'s data.'); process.exit(1); }
const state = convertLegacy(legacy);
const out = output ?? `marc-backup-converted-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(out, JSON.stringify({ app: 'M/ARC', version: APP_VERSION, exportedAt: new Date().toISOString(), convertedFrom: 'legacy-full-backup', state }, null, 1) + '\n');

const sets = state.sessions.reduce((a, s) => a + s.exercises.reduce((x, e) => x + e.sets.length, 0), 0);
console.log(`Wrote ${out}`);
console.log(`Sessions: ${state.sessions.length} (${state.sessions[0]?.day} → ${state.sessions[state.sessions.length - 1]?.day}), sets: ${sets}`);
console.log(`Splits: ${state.splits.map(s => `${s.name} [${s.exercises.map(e => findExercise(e.exerciseId, state.customExercises)?.name ?? e.exerciseId).join(', ')}]`).join(' | ')}`);
console.log(`Custom exercises created: ${state.customExercises.map(c => c.name).join(', ') || 'none'}`);
console.log(`Schedule: ${Object.entries(state.schedule).map(([d, id]) => `${d}=${state.splits.find(s => s.id === id)?.name ?? 'rest'}`).join(' ')}`);
console.log(`Goal: ${state.goal}, unit: ${state.preferences.weightUnit}, rest: ${state.preferences.restDefaultSec}s, reminders: ${state.preferences.reminders.enabled ? state.preferences.reminders.time : 'off'}`);
