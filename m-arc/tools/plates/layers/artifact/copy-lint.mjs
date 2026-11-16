// Copy lint for the How-to layers (architecture 6.1 C7 and 6.2, with the owner's "shorter, concept first" limits of
// 2026-09-30, which replace the 6.2 lengths). Pure: no I/O, no rendering. howto-layers.mjs calls lintAll() before it
// builds anything and throws with the full list, so a clean run changes no output byte.
//
// lintHowto(M, shared)  M = one exercises/<id>.howto.mjs module namespace (default = the HowTo; SOURCES,
//                       EVIDENCE_LABELS and THUMB_PAGE are read from it when present); shared = howto/shared.mjs.
//                       Returns { ex, words, violations, review, fields }.
// lintShared(shared)    the shared red-flag boxes and the owner's disclaimer.
//
// Which fields the page shows (the field map, checked against the built page on 2026-09-30):
//   Grip       handling.gripLine (also printed in the hand close-up), copy.gripLine (same text), handling.wrist.limitText,
//              handling.handleChoice.sore, mistakes[].title and .fix
//   Look closer zooms[].chip, chipCaption, heading, caption.*, captionPage2.*, callout(s).*.text, hand.notes.*, hand.note,
//              rightNote, camLabel, hand.cameraLabel, hand.inset.{label,cameraLabel,when,right.note,wrong.note},
//              feelPrompt, handling.faults[].label (= hand.wrong[].label), THUMB_PAGE[].title and .note;
//              alt texts: zooms[].alt.*, faults[].alt, THUMB_PAGE[].alt
//   Feel       feel.feelLine, feel.textOnly[].plain, feel.rows[].where, .means, .fix
//   Setup      setup[].text
//   Risks      risks[].text and the shared red-flag boxes named in riskFlags
//   Sources    not shown (owner 2026-09-30, LR-23). EVIDENCE_LABELS[key].text, or SOURCES[key].note when there is no
//              label, is linted as a research note (kind sourceNote, shown=false); the cites are not linted
//   Disclaimer shared.DISCLAIMER (verbatim)
// User copy the page does not show but the app will (6.2): copy.setupLine, copy.mistakeLine, copy.cueLine,
// handling.cue, handling.width.text, handling.thumb.options[].when, posture[].label and .detail. These get the same
// bans and limits, but do not count toward the visible total.
// Not linted: the golden-A plate strings (frozen), feel.primary/secondary/watch[].plain and feel.libraryDiff.why (not
// shown, evidence notes), the source cites, and the page's fixed headings and buttons.

/* ---------------------------------------------------------------- limits (owner 2026-09-30) ---------------------- */
export const MAX_SENTENCE_WORDS = 15;          // any sentence, any field
export const FEEL_LINE_MAX_WORDS = 20;
export const FEEL_LINE_MAX_SENTENCES = 2;
export const FEEL_LINE_START = 'You should feel this';
export const ROW_WHERE_MAX_WORDS = 6;
export const ROW_MEANS_MAX_WORDS = 12;
export const ROW_MEANS_MAX_SENTENCES = 1;
export const ROW_FIX_MAX_WORDS = 15;
export const ROW_FIX_MAX_SENTENCES = 2;
export const LEAD_LINE_MAX_WORDS = 22;         // gripLine, setupLine, mistakeLine and the other section lines
export const LEAD_LINE_MAX_SENTENCES = 2;
export const SETUP_STEP_MAX_WORDS = 12;
export const SETUP_MAX_STEPS = 5;
export const MISTAKES_MAX = 3;
export const MISTAKE_LABEL_MAX_WORDS = 5;
export const MISTAKE_FIX_MAX_WORDS = 12;
export const FEEL_ROWS_MAX = 4;
export const CAPTION_MAX_WORDS = 10;           // zoom captions, Right/Wrong lines, notes and prompts in a close-up
export const RISKS_MAX = 3;
export const RISK_MAX_WORDS = 14;
export const RED_FLAG_BOX_MAX_WORDS = 30;      // name + now + doctor
export const SOURCE_NOTE_MAX_WORDS = 12;
export const ALT_MAX_WORDS = 30;
export const LABEL_MIN_WORDS = 1;              // callout labels, chips, Right/Wrong notes
export const LABEL_MAX_WORDS = 3;
export const CUE_MAX_WORDS = 6;
export const VISIBLE_WORDS_MAX = 450;          // per exercise: every shown copy field once, plus the red-flag boxes and
                                               // the disclaimer; not the plate, the sources list or alt texts

/** The owner's safety line, exactly. */
export const OWNER_DISCLAIMER = 'General guidance, not medical advice. If something hurts, stop and get it checked.';

/** Rows that link a red flag today (2026-09-30 baseline). Each must stay, with the same key and the same flag. */
export const RED_FLAG_ROWS = {
  lib_dumbbell_lateral_raise: { pinch: 'shoulder', forearms: true },
  lib_barbell_back_squat: { wrist: true, knees: 'knee', 'wrist-sore': true },
  lib_pull_up: { pinch: 'shoulder', elbow: 'elbow', wrist: true },
  lib_hanging_leg_raise: { wrist: true },
  lib_lat_pulldown: { pinch: 'shoulder', wrist: true },
  lib_seated_cable_row: { pinch: 'shoulder', wrist: true },
  lib_leg_press: { knee: 'knee', wrists: true, 'wrist-sore': true },
  lib_machine_chest_press: { wrist: true, 'wrist-sore': true, elbows: 'elbow' },
};

/** Shared red-flag boxes: export name, joint-name opener, NHS source, and every trigger (each must still match). */
export const RED_FLAG_BLOCKS = {
  wrist: { exp: 'RED_FLAG', name: 'Wrist pain', source: 'nhs-wrist-pain',
    triggers: [/can'?t grip|cannot grip/i, /shape/i, /numb/i, /tingl/i, /coming back|comes back/i, /two weeks/i] },
  shoulder: { exp: 'RED_FLAG_SHOULDER', name: 'Shoulder pain', source: 'nhs-shoulder-pain',
    triggers: [/sudden/i, /very bad|severe/i, /\bfall(s|ing|en)?\b|\bfell\b/i, /(can'?t|cannot|won'?t) move/i, /worse/i, /hard to move/i, /two weeks/i] },
  knee: { exp: 'RED_FLAG_KNEE', name: 'Knee pain', source: 'nhs-knee-pain',
    triggers: [/very bad|severe/i, /weight/i, /swollen|swell/i, /shape/i, /\block/i, /gives? way|giving way/i, /few weeks/i] },
  elbow: { exp: 'RED_FLAG_ELBOW', name: 'Elbow pain', source: 'nhs-elbow-pain',
    triggers: [/very bad|severe/i, /hard to move/i, /snap/i, /shape/i, /tingl/i, /numb/i, /few weeks/i] },
};

/** Row fixes start with a verb (6.2). Imperative verbs seen in coaching copy; a fix starting with another word fails.
 *  If a new fix really starts with a verb, add the verb here. */
export const FIX_VERBS = new Set(`add adjust aim allow anchor angle avoid back bend brace breathe bring cap chalk check
choose clear come control count curl cut dip do don't draw drive drop ease end film finish get go grab grip hang hinge
hold keep land lay lean leave let lift line lock look loosen lower make match move narrow open pack pause pick pin
place plant point press pull push put raise reach relax remove reset rest return roll rotate set shift shorten sink sit
skip slide slow snug spread squat squeeze stand start stay step stop straighten stretch swap switch take think tilt
touch try tuck turn unlock use walk wrap widen work`.split(/\s+/));

/** Banned in user copy (6.2). [rule name, pattern]. */
export const BANNED = [
  ['em dash', /—/],
  ['en dash as punctuation', /(?<!\d)–|–(?!\d)/],
  ['exclamation mark', /!/],
  ['emoji', /\p{Extended_Pictographic}/u],
  ['percent', /%/],
  ['semicolon', /;/],
  ['study citation', /\([A-Z][A-Za-z-]+[^)]*\b(19|20)\d\d\)|\b[A-Z][a-z]+ et al\b|\b[A-Z][a-z]+ (19|20)\d\d\b/],
  ['EMG', /\bEMG\b/i],
  ['MVC/MVIC', /\bMVI?C\b/],
  ['mind-muscle', /\bmind[- ]muscle\b/i],
  ['engage', /\bengag(e|es|ed|ing)\b/i],
  ['activate', /\bactivat(e|es|ed|ing|ion|ions)\b/i],
  ['fire', /\bfir(e|es|ed|ing)\b/i],
  ['torch', /\btorch(es|ed|ing)?\b/i],
  ['blast', /\bblast(s|ed|ing)?\b/i],
  ['sculpt', /\bsculpt\w*/i],
  ['tone', /\btone[ds]?\b/i],
  ['"your core"', /\byour core\b/i],
  ['unlock your potential/gains', /\bunlock your (potential|gains)\b/i],
  ['maximise', /\bmaximi[sz]\w*/i],
  ['optimal', /\boptimal\w*/i],
  ['optimise', /\boptimi[sz]\w*/i],
  ['ultimate', /\bultimate\w*/i],
  ['crucial', /\bcrucial\w*/i],
  ['essential', /\bessential\w*/i],
  ['"key to"', /\bkey to\b/i],
  ['game changer', /\bgame[- ]?changer\b/i],
  ['powerhouse', /\bpowerhouse\b/i],
  ['effortless', /\beffortless\w*/i],
  ['seamless', /\bseamless\w*/i],
  ['elevate', /\belevat(e|es|ing)\b/i],
  ['journey', /\bjourney\w*/i],
  ['simply', /\bsimply\b/i],
  ['"make sure"', /\bmake sure\b/i],
  ['ensure', /\bensur(e|es|ed|ing)\b/i],
  ['"it\'s important"', /\b(it'?s|it is) important\b/i],
  ['"remember to"', /\bremember to\b/i],
  ['"focus on"', /\bfocus on\b/i],
  ['"throughout the movement"', /\bthroughout the movement\b/i],
  ['"controlled manner"', /\bcontrolled manner\b/i],
  ['"proper form"', /\bproper form\b/i],
  ['"not X but Y"', /\bnot\b[^.,]{1,40}\bbut\b/i],
  ['"it\'s not X, it\'s Y"', /\bit'?s not\b[^.]{1,40},\s*it'?s\b/i],
  ['"not just ... but"', /\bnot just\b[^.]*\bbut\b/i],
  ['clinical name', /\b(pectoralis|deltoids?|latissimus|trapezius|rectus|supraspinatus|scapholunate|TFCC|iliopsoas|erectors?)\b/i],
  ['"pinky" (say "little finger")', /\bpink(y|ie|ies)\b/i],
];
/** Own red-flag wording in copy that must link the shared box instead (C8). */
export const OWN_RED_FLAG = /get it checked|see a doctor|\bGP\b|physio|numb|tingl|swell/i;
/** No contacts and no sources in the UI (owner decision LR-23, 2026-09-30: "Dont put any emergency or whatever
 *  contacts. Even the source remove it in app ui. If its not required by pkaystore dont put."). These are the D-LR23-1
 *  literals; card ESC-NC creates tests/guards/no-contacts.ts (the single definition) and an HT-4b parity test pins the two. */
export const CONTACT_RE = /(?<![\d.,])(?:999|111|911|112|000|988)(?![\d.,]*\d)|(?<![\d.,])\d{5,6}(?![\d.,]*\d)|\b116 ?123\b|\+\d[\d ().-]{6,}\d|\b\d{3,5}[ .-]\d{3}[ .-]\d{3,4}\b|\b\d{2} \d{2} \d{2}\b|\b(?:nine|one|zero)(?:[ -](?:nine|one|zero)){2}\b|emergency (?:services?|numbers?|departments?|rooms?|lines?|contacts?)|ambulance|\bA&E\b|urgent (?:care|treatment)|hotline|helpline|crisis (?:line|text)|samaritans|\blifeline\b|\btext \w+ to\b|\btel:|mailto:|[\w.+-]+@[\w-]+\.[a-z]{2,}|https?:\/\/|\bwww\./i;
export const SOURCE_RE = /\bsources?\b|\bcitations?\b|\bcited\b|\bet al\b|\bstud(?:y|ies)\b|\bmeta-analys[ie]s\b|\bpubmed\b|\bdoi\b|\bNHS\b|\bACSM\b|\bCoaching consensus\b|\bWeak for this use\b|\([A-Za-z][^()]* (?:19|20)\d{2}[a-z]?\)|\[[^\]]*(?:19|20)\d{2}[^\]]*\]|\bresearch(?:ers?)?\b|\btrials?\b|\bevidence\b/i;
// Case-sensitive on purpose: under /i, WHO would match "who".
export const SOURCE_CS_RE = /\b[A-Z][a-z]+(?: et al\.?)?,? (?:19|20)\d{2}[a-z]?\b|\b(?:NSCA|ACE|ISSN|WHO)\b|Barbell Logic|Human Kinetics/;
export const SAFETY_LINE_RE = /\b(?:call|phone|dial|ring|GP|clinic|hospital)\b/i;
/** LR-23 checks on one shown string: [rule, pattern]. SOURCE_CS_RE goes wherever SOURCE_RE goes. */
const NO_CONTACT_SOURCE = [['no contact or emergency wording (LR-23)', CONTACT_RE], ['no source or evidence wording (LR-23)', SOURCE_RE],
  ['no source or evidence wording (LR-23)', SOURCE_CS_RE]];
/** The first-author surname or the organisation of a registry source cite (LR-23 data check: no shown field names
 *  one). "Youdas JW et al. (2010) ..." -> Youdas; "Catalyst Athletics, Pull-up" -> Catalyst Athletics; a Wikipedia
 *  article -> Wikipedia (its title is not a name). */
export function sourceName(cite) {
  const c = String(cite ?? '').trim();
  if (/,\s*Wikipedia$/.test(c)) return 'Wikipedia';
  const a = c.match(/^((?:(?:de|da|di|dos|van|von) )?[A-Z][\p{L}'’-]+(?: (?:[A-Z][\p{L}'’-]+|de|da|dos))*?) [A-Z]{1,4}(?![\p{L}])/u);
  return (a ? a[1] : c.split(/,| \(/)[0]).trim();
}
/** Every registry source name of these sheets, as case-sensitive whole-word patterns. */
export function sourceNamePatterns(modules) {
  const names = new Set();
  for (const M of modules) for (const s of Object.values(M.SOURCES ?? {})) { const n = sourceName(s.cite); if (n) names.add(n); }
  return [...names].map(n => [n, new RegExp(`(?<![\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'u')]);
}
/** Flagged for people, not failed (6.2): three one-word items joined by commas ("slow, steady, strong"). */
export const TRIPLET = /\b[A-Za-z]+, [A-Za-z]+,? (?:and|or) [A-Za-z]+(?=[.?]|$)|\b[A-Za-z]+, [A-Za-z]+, [A-Za-z]+(?=[.?]|$)/;

/* ---------------------------------------------------------------- text helpers ----------------------------------- */
const plain = s => String(s).replace(/<br\s*\/?>/gi, ' ').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
export const words = s => plain(s).split(' ').filter(w => /[\p{L}\p{N}]/u.test(w)).length;
export const sentences = s => plain(s).split(/(?<=[.?!])\s+(?=\S)/).filter(x => /[\p{L}\p{N}]/u.test(x));

/* ---------------------------------------------------------------- the field map ---------------------------------- */
// kind -> [max words, max sentences]; null = no own cap (the sentence cap and the bans still apply)
const KIND = {
  lead: [LEAD_LINE_MAX_WORDS, LEAD_LINE_MAX_SENTENCES], feelLine: [FEEL_LINE_MAX_WORDS, FEEL_LINE_MAX_SENTENCES],
  rowWhere: [ROW_WHERE_MAX_WORDS, null], rowMeans: [ROW_MEANS_MAX_WORDS, ROW_MEANS_MAX_SENTENCES],
  rowFix: [ROW_FIX_MAX_WORDS, ROW_FIX_MAX_SENTENCES], setup: [SETUP_STEP_MAX_WORDS, null],
  mistakeLabel: [MISTAKE_LABEL_MAX_WORDS, null], mistakeFix: [MISTAKE_FIX_MAX_WORDS, null], risk: [RISK_MAX_WORDS, null],
  caption: [CAPTION_MAX_WORDS, null], label: [LABEL_MAX_WORDS, null], cue: [CUE_MAX_WORDS, null],
  alt: [ALT_MAX_WORDS, null], sourceNote: [SOURCE_NOTE_MAX_WORDS, null], heading: [null, null], prose: [null, null],
};
const RED_FLAG_WORDING_KINDS = new Set(['rowMeans', 'rowFix', 'lead', 'caption', 'mistakeFix']);

/** Every copy field of one sheet: { path, text, kind, shown }. `shown` = printed on the page (counts toward the total
 *  unless it is an alt text). Source notes are research notes, never shown (LR-23). */
export function copyFields(M) {
  const H = M.default ?? M, out = [];
  const add = (path, text, kind, shown = true) => { if (typeof text === 'string' && text.trim()) out.push({ path, text, kind, shown }); };
  const h = H.handling ?? {};
  // Grip
  add('handling.gripLine', h.gripLine, 'lead');
  add('copy.gripLine', H.copy?.gripLine, 'lead');
  add('handling.wrist.limitText', h.wrist?.limitText, 'lead');
  add('handling.handleChoice.sore', h.handleChoice?.sore, 'lead');
  (H.mistakes ?? []).forEach((m, i) => { add(`mistakes[${i}](${m.key}).title`, m.title, 'mistakeLabel'); add(`mistakes[${i}](${m.key}).fix`, m.fix, 'mistakeFix'); });
  // Look closer
  (h.faults ?? []).forEach((f, i) => { if (typeof f === 'object') { add(`handling.faults[${i}](${f.key}).label`, f.label, 'label'); add(`handling.faults[${i}](${f.key}).alt`, f.alt, 'alt'); } });
  (H.zooms ?? []).forEach((z, i) => {
    const p = `zooms[${i}](${z.key})`;
    add(`${p}.chip`, z.chip, 'label'); add(`${p}.chipCaption`, z.chipCaption, 'label'); add(`${p}.heading`, z.heading, 'heading');
    for (const c of ['caption', 'captionPage2']) for (const s of ['right', 'wrong']) add(`${p}.${c}.${s}`, z[c]?.[s], 'caption');
    for (const c of ['callout', 'callouts']) for (const s of ['right', 'wrong']) add(`${p}.${c}.${s}.text`, z[c]?.[s]?.text, 'label');
    add(`${p}.rightNote`, z.rightNote, 'label');
    add(`${p}.camLabel`, z.camLabel, 'caption');
    add(`${p}.feelPrompt`, z.feelPrompt, 'caption');
    const hd = z.hand;
    if (hd) {
      for (const s of ['right', 'wrong']) add(`${p}.hand.notes.${s}`, hd.notes?.[s], 'label');
      add(`${p}.hand.note`, hd.note, 'caption'); add(`${p}.hand.cameraLabel`, hd.cameraLabel, 'caption');
      const ins = hd.inset;
      if (ins) {
        add(`${p}.hand.inset.label`, ins.label, 'caption'); add(`${p}.hand.inset.cameraLabel`, ins.cameraLabel, 'caption');
        add(`${p}.hand.inset.when`, ins.when, 'caption');
        for (const s of ['right', 'wrong']) add(`${p}.hand.inset.${s}.note`, ins[s]?.note, 'label');
      }
      (hd.wrong ?? []).forEach((f, j) => { if (typeof f === 'object') { add(`${p}.hand.wrong[${j}].label`, f.label, 'label'); add(`${p}.hand.wrong[${j}].alt`, f.alt, 'alt'); } });
    }
    for (const [k, v] of Object.entries(z.alt ?? {})) add(`${p}.alt.${k}`, v, 'alt');
  });
  (M.THUMB_PAGE ?? []).forEach((t, i) => { add(`THUMB_PAGE[${i}](${t.mode}).title`, t.title, 'label'); add(`THUMB_PAGE[${i}](${t.mode}).note`, t.note, 'caption'); add(`THUMB_PAGE[${i}](${t.mode}).alt`, t.alt, 'alt'); });
  // Feel
  const F = H.feel ?? {};
  add('feel.feelLine', F.feelLine, 'feelLine');
  (F.textOnly ?? []).forEach((m, i) => add(`feel.textOnly[${i}].plain`, m.plain, 'lead'));
  (F.rows ?? []).forEach((r, i) => { const p = `feel.rows[${i}](${r.key})`; add(`${p}.where`, r.where, 'rowWhere'); add(`${p}.means`, r.means, 'rowMeans'); add(`${p}.fix`, r.fix, 'rowFix'); });
  // Setup, risks
  (H.setup ?? []).forEach((s, i) => add(`setup[${i}]`, s.text, 'setup'));
  (H.risks ?? []).forEach((r, i) => add(`risks[${i}](${r.key})`, r.text, 'risk'));
  // Sources: research notes only, never shown (owner 2026-09-30, LR-23)
  for (const key of H.sources ?? []) {
    const ev = M.EVIDENCE_LABELS?.[key];
    if (ev?.text) add(`EVIDENCE_LABELS.${key}.text`, ev.text, 'sourceNote', false);
    else add(`SOURCES.${key}.note`, M.SOURCES?.[key]?.note, 'sourceNote', false);
  }
  // User copy the app shows but this page does not
  add('copy.setupLine', H.copy?.setupLine, 'lead', false);
  add('copy.mistakeLine', H.copy?.mistakeLine, 'lead', false);
  add('copy.cueLine', H.copy?.cueLine, 'cue', false);
  add('handling.cue', h.cue, 'cue', false);
  add('handling.width.text', h.width?.text, 'prose', false);
  (h.thumb?.options ?? []).forEach((o, i) => add(`handling.thumb.options[${i}].when`, o.when, 'prose', false));
  (H.posture ?? []).forEach((p, i) => { add(`posture[${i}](${p.key}).label`, p.label, 'label', false); add(`posture[${i}](${p.key}).detail`, p.detail, 'prose', false); });
  return out;
}

/* ---------------------------------------------------------------- checks ----------------------------------------- */
function checkText(v, f, names = []) {
  const t = plain(f.text), n = words(f.text), ss = sentences(f.text), [maxW, maxS] = KIND[f.kind];
  for (const [rule, re] of BANNED) if (re.test(t)) v(f.path, `banned: ${rule}`, `"${t.match(re)[0]}"`);
  ss.forEach((s, i) => { const w = words(s); if (w > MAX_SENTENCE_WORDS) v(f.path, `sentence > ${MAX_SENTENCE_WORDS} words`, `sentence ${i + 1}: ${w} words`); });
  if (maxW != null && n > maxW) v(f.path, `${f.kind} > ${maxW} words`, `${n} words`);
  if (f.kind === 'label' && n < LABEL_MIN_WORDS) v(f.path, `label < ${LABEL_MIN_WORDS} word`, `${n} words`);
  if (maxS != null && ss.length > maxS) v(f.path, `${f.kind} > ${maxS} sentence${maxS > 1 ? 's' : ''}`, `${ss.length} sentences`);
  if (f.kind === 'feelLine' && !t.startsWith(FEEL_LINE_START)) v(f.path, `feelLine must start "${FEEL_LINE_START}"`, `starts "${t.split(' ').slice(0, 4).join(' ')}"`);
  if (f.kind === 'rowFix') { const w0 = t.split(' ')[0].replace(/[^A-Za-z']/g, '').toLowerCase(); if (!FIX_VERBS.has(w0)) v(f.path, 'row fix must start with a verb', `starts "${t.split(' ')[0]}" (a verb? add it to FIX_VERBS)`); }
  if (RED_FLAG_WORDING_KINDS.has(f.kind) && OWN_RED_FLAG.test(t)) v(f.path, 'own red-flag wording (link the shared box, C8)', `"${t.match(OWN_RED_FLAG)[0]}"`);
  if (f.kind !== 'sourceNote') {
    for (const [rule, re] of NO_CONTACT_SOURCE) if (re.test(t)) v(f.path, rule, `"${t.match(re)[0]}"`);
    for (const [n, re] of names) if (re.test(t)) v(f.path, 'names a registry source (LR-23)', `"${n}"`);
  }
}

const FLAG_OF = f => f === true ? 'wrist' : f;
/** The red-flag boxes a sheet shows, in the order the page prints them. */
export const flagsOf = H => H.riskFlags ?? ['wrist'];
const boxText = B => [B.name, B.now, B.doctor].join(' ');

export function lintHowto(M, shared, names = sourceNamePatterns([M])) {
  const H = M.default ?? M, ex = String(H.id ?? '?').replace(/^lib_/, ''), violations = [], review = [];
  const v = (path, rule, detail) => violations.push({ ex, path, rule, detail });
  const fields = copyFields(M), seen = new Map();
  for (const f of fields) {
    const k = `${f.kind}\u0000${f.text}`;
    if (seen.has(k)) { seen.get(k).alsoAt.push(f.path); continue; }
    seen.set(k, f); f.alsoAt = [];
    checkText(v, f, names);
    if (TRIPLET.test(plain(f.text))) review.push({ ex, path: f.path, rule: 'three one-word items in a row (6.2, for people)', detail: `"${plain(f.text).match(TRIPLET)[0]}"` });
  }
  // list caps
  const cap = (path, list, max, what) => { if ((list?.length ?? 0) > max) v(path, `more than ${max} ${what}`, `${list.length}`); };
  cap('mistakes', H.mistakes, MISTAKES_MAX, 'handling mistakes');
  cap('feel.rows', H.feel?.rows, FEEL_ROWS_MAX, 'feel rows');
  cap('setup', H.setup, SETUP_MAX_STEPS, 'setup steps');
  cap('risks', H.risks, RISKS_MAX, 'risk lines');
  // red-flag rows stay, same key, same flag
  const rows = H.feel?.rows ?? [];
  for (const [key, flag] of Object.entries(RED_FLAG_ROWS[H.id] ?? {})) {
    const r = rows.find(x => x.key === key);
    if (!r) v(`feel.rows(${key})`, 'red-flag row removed (it must stay)', `links the ${FLAG_OF(flag)} box`);
    else if (r.redFlag !== flag) v(`feel.rows(${key}).redFlag`, 'red-flag link changed', `${JSON.stringify(r.redFlag)}, was ${JSON.stringify(flag)}`);
  }
  // claim wiring: every row, mistake, risk and setup step keeps a claim with its tags and registry sources
  const claimed = [...rows.map((r, i) => [`feel.rows[${i}](${r.key})`, r.claim]), ...(H.mistakes ?? []).map((m, i) => [`mistakes[${i}](${m.key})`, m.claim]),
    ...(H.risks ?? []).map((r, i) => [`risks[${i}](${r.key})`, r.claim]), ...(H.setup ?? []).map((s, i) => [`setup[${i}]`, s.claim])];
  for (const [path, c] of claimed) {
    if (!c?.tags?.length || !Array.isArray(c.sources)) v(`${path}.claim`, 'claim missing (keep the claim and its sources)', '');
    else for (const s of c.sources) if (!M.SOURCES?.[s]) v(`${path}.claim`, 'claim source not in the registry', s);
  }
  // sources and evidence labels are never shown (LR-23); every listed source still has a label, as data
  if ('SHOW_EVIDENCE' in shared) v('shared.SHOW_EVIDENCE', 'sources and evidence labels are never shown (owner 2026-09-30, LR-23)', String(shared.SHOW_EVIDENCE));
  for (const key of H.sources ?? []) if (!(M.EVIDENCE_LABELS?.[key]?.tag ?? M.SOURCES?.[key]?.use)) v(`sources(${key})`, 'source without an evidence label', key);
  // visible total: every shown field once (not alt texts or source notes), the red-flag boxes, the disclaimer
  const counted = new Set(fields.filter(f => f.shown && f.kind !== 'alt' && f.kind !== 'sourceNote').map(f => plain(f.text)));
  const spec = [...counted].reduce((a, t) => a + words(t), 0);
  const boxes = flagsOf(H).map(f => shared[RED_FLAG_BLOCKS[f]?.exp]).filter(Boolean);
  const safety = boxes.reduce((a, B) => a + words(boxText(B)), 0) + words(shared.DISCLAIMER ?? '');
  const total = spec + safety;
  if (total > VISIBLE_WORDS_MAX) v('(sheet)', `visible words > ${VISIBLE_WORDS_MAX}`, `${total} (sheet copy ${spec}, red flags and disclaimer ${safety})`);
  return { ex, words: { total, spec, safety }, violations, review, fields };
}

export function lintShared(shared, names = []) {
  const violations = [], v = (path, rule, detail) => violations.push({ ex: 'shared', path, rule, detail });
  if (shared.DISCLAIMER !== OWNER_DISCLAIMER) v('shared.DISCLAIMER', 'the owner\'s safety line must stay exactly', JSON.stringify(shared.DISCLAIMER));
  // LR-23: no contact, source or evidence wording in the disclaimer or the boxes; no call/phone/GP/clinic in the boxes
  const noContact = (path, text, safety) => {
    for (const [rule, re] of NO_CONTACT_SOURCE) if (re.test(plain(text))) v(path, rule, `"${plain(text).match(re)[0]}"`);
    for (const [n, re] of names) if (re.test(plain(text))) v(path, 'names a registry source (LR-23)', `"${n}"`);
    if (safety && SAFETY_LINE_RE.test(plain(text))) v(path, 'no call, phone, GP, clinic or hospital in a red-flag box (LR-23)', `"${plain(text).match(SAFETY_LINE_RE)[0]}"`);
  };
  noContact('shared.DISCLAIMER', shared.DISCLAIMER ?? '', false);
  for (const [joint, spec] of Object.entries(RED_FLAG_BLOCKS)) {
    const B = shared[spec.exp], p = `shared.${spec.exp}`;
    if (!B) { v(p, 'red-flag box missing', joint); continue; }
    if (B.name !== spec.name) v(`${p}.name`, 'joint-name opener changed', `${JSON.stringify(B.name)}, must be "${spec.name}"`);
    const n = words(boxText(B));
    if (n > RED_FLAG_BOX_MAX_WORDS) v(p, `red-flag box > ${RED_FLAG_BOX_MAX_WORDS} words`, `${n} words`);
    for (const re of spec.triggers) if (!re.test(plain(boxText(B)))) v(p, 'red-flag trigger lost', String(re));
    if (!/today/i.test(B.now ?? '')) v(`${p}.now`, 'the urgent line must say "today"', B.now);
    if (!/doctor/i.test(B.doctor ?? '')) v(`${p}.doctor`, 'the doctor line must say "doctor"', B.doctor);
    if (!B.claim?.sources?.includes(spec.source)) v(`${p}.claim`, 'NHS source removed', spec.source);
    for (const k of ['now', 'doctor']) checkText(v, { path: `${p}.${k}`, text: B[k] ?? '', kind: 'prose' });
    for (const k of ['name', 'now', 'doctor']) noContact(`${p}.${k}`, B[k] ?? '', true);
  }
  return violations;
}

/** All sheets plus the shared module; returns { reports, violations } (violations = every failure, in order). */
export function lintAll(modules, shared) {
  const names = sourceNamePatterns(modules);
  const reports = modules.map(M => lintHowto(M, shared, names));
  return { reports, violations: [...lintShared(shared, names), ...reports.flatMap(r => r.violations)] };
}

export const formatViolations = list => list.map(x => `  ${x.ex}  ${x.path}  [${x.rule}]${x.detail ? '  ' + x.detail : ''}`).join('\n');
