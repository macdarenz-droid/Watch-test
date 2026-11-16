// One-off extraction of data assets from the legacy single-file app.
// Run: node scripts/extract-legacy-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('legacy/v36/index.html', 'utf8');
mkdirSync('src/data', { recursive: true });

function grabArray(label, marker) {
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${label}`);
  let i = src.indexOf('[', at);
  let depth = 0, inStr = false, esc = false, quote = '';
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`unterminated array: ${label}`);
}

// 1. Exercise library
const libText = grabArray('exercise library', 'const DT_EXERCISE_LIBRARY = [');
const library = JSON.parse(libText);
const exercises = library.map(e => ({
  id: e.id,
  name: e.name,
  equipment: e.equipment,
  primary: e.primaryMuscles || [],
  secondary: e.secondaryMuscles || [],
  stabilizers: e.stabilizerMuscles || [],
  aliases: e.aliases || [],
  pattern: e.movementPattern || 'other',
  defaultSets: e.defaultSets || 3,
}));
writeFileSync('src/data/exercises.json', JSON.stringify(exercises, null, 1) + '\n');
console.log('exercises:', exercises.length);

// 2. Coach cue library
const cueText = grabArray('coach cues', 'const LIB=[{"id":"move-elbow_flexion-01"');
const cues = JSON.parse(cueText);
const slim = cues.map(c => {
  const out = { id: c.id, kind: c.kind, title: c.title, text: c.text };
  if (c.exerciseIds) out.exerciseIds = c.exerciseIds;
  if (c.movementPatterns) out.patterns = c.movementPatterns;
  if (c.muscles) out.muscles = c.muscles;
  if (c.equipmentGroups) out.equipment = c.equipmentGroups;
  if (c.semanticReasons) out.reasons = c.semanticReasons;
  return out;
});
writeFileSync('src/data/coachCues.json', JSON.stringify(slim) + '\n');
console.log('cues:', slim.length);

// 3. Daily spark quotes
const sparkAt = src.indexOf('const sparks=');
if (sparkAt > 0) {
  const arr = grabArray('sparks', 'const sparks=');
  writeFileSync('src/data/sparks.raw.txt', arr);
  console.log('sparks raw bytes:', arr.length);
}
