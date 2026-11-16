// HT-4 (HT4-A3): C7, copy style lint. Limits are the owner's "shorter, concept-first" lengths of 2026-09-30, which
// replace GRIP-AND-FEEL-ARCHITECTURE.md 6.2's own lengths for the golden-B pin b3a90af (README.md, "Compact-copy
// update" table); the GA 6.2 bans still apply in full. Values match the vendored, already-proven
// tools/plates/layers/artifact/copy-lint.mjs's exported constants exactly (see the `LIMITS_MATCH_COPY_LINT` test in
// content.test.ts), kept as named constants here per the supervisor (PR #107) so a future length change is a
// one-line edit to LIMITS, not a search-and-replace - and so this check stays self-contained (never imports
// copy-lint.mjs, which is shaped for golden-B's raw `*.howto.mjs` module namespace, not the mapped `HowToContent`).
//
// Review fix (High 5, PR #107): tokenization now matches copy-lint.mjs's own `words`/`sentences` exactly (it strips
// <br>, curly quotes and collapses whitespace before counting, and ignores punctuation-only tokens/sentences); bans
// now scan every user-authored text field content-types.ts has, not just a handful; labelMinWords/labelMaxWords are
// enforced on every "short label" field; FIX_VERBS enforces a feel-row fix starts with an imperative verb; the
// per-sheet redFlag block gets its own RED_FLAG_BOX_MAX_WORDS cap plus the "today"/"doctor" wording checks; and a
// VISIBLE_WORDS_MAX budget sums every shown field once (excluding alt texts) plus the redFlag box.
import type { HandFault, HowToContent } from '../../../src/howto/content-types';

/** Length caps (README.md "Compact-copy update" table = copy-lint.mjs's own exported constants). */
export const LIMITS = {
  anySentenceWords: 15,
  feelLineWords: 20,
  feelLineSentences: 2,
  rowWhereWords: 6,
  rowMeansWords: 12,
  rowMeansSentences: 1,
  rowFixWords: 15,
  rowFixSentences: 2,
  leadLineWords: 22, // gripLine, setupLine, mistakeLine
  leadLineSentences: 2,
  setupStepWords: 12,
  setupMaxSteps: 5,
  mistakesMax: 3,
  mistakeLabelWords: 5,
  mistakeFixWords: 12,
  feelRowsMax: 4,
  captionWords: 10,
  risksMax: 3,
  riskWords: 14,
  redFlagBoxWords: 30,
  sourceNoteWords: 12,
  altWords: 30,
  labelMinWords: 1,
  labelMaxWords: 3,
  cueWords: 6,
  visibleWordsMax: 450,
};

/** Row fixes start with a verb (6.2). Imperative verbs seen in coaching copy; a fix starting with another word fails.
 *  If a new fix really starts with a verb, add the verb here. Copied verbatim from copy-lint.mjs's FIX_VERBS. */
export const FIX_VERBS = new Set(`add adjust aim allow anchor angle avoid back bend brace breathe bring cap chalk check
choose clear come control count curl cut dip do don't draw drive drop ease end film finish get go grab grip hang hinge
hold keep land lay lean leave let lift line lock look loosen lower make match move narrow open pack pause pick pin
place plant point press pull push put raise reach relax remove reset rest return roll rotate set shift shorten sink sit
skip slide slow snug spread squat squeeze stand start stay step stop straighten stretch swap switch take think tilt
touch try tuck turn unlock use walk wrap widen work`.split(/\s+/));

const BANNED_CHARS: Array<[RegExp, string]> = [
  [/—/, 'em dash'],
  [/(?<!\d)–|–(?!\d)/, 'en dash used as punctuation'],
  [/!/, '"!"'],
  [/\p{Extended_Pictographic}/u, 'emoji'],
  [/%/, '"%"'],
  [/;/, 'semicolon'],
  [/\([A-Z][A-Za-z-]+[^)]*\b(19|20)\d\d\)|\b[A-Z][a-z]+ et al\b|\b[A-Z][a-z]+ (19|20)\d\d\b/, 'a study citation'],
  [/\bEMG\b/i, '"EMG"'],
  [/\bMVI?C\b/, '"MVC"/"MVIC"'],
  [/\bmind[- ]muscle\b/i, '"mind-muscle"'],
  [/\bengag(e|es|ed|ing)\b/i, '"engage"'],
  [/\bactivat(e|es|ed|ing|ion|ions)\b/i, '"activate"'],
  [/\bfir(e|es|ed|ing)\b/i, '"fire"'],
  [/\btorch(es|ed|ing)?\b/i, '"torch"'],
  [/\bblast(s|ed|ing)?\b/i, '"blast"'],
  [/\bsculpt\w*/i, '"sculpt"'],
  [/\btone[ds]?\b/i, '"tone"'],
  [/\byour core\b/i, '"your core"'],
  [/\bunlock your (potential|gains)\b/i, '"unlock your potential/gains"'],
  [/\bmaximi[sz]\w*/i, '"maximise"'],
  [/\boptimal\w*/i, '"optimal"'],
  [/\boptimi[sz]\w*/i, '"optimise"'],
  [/\bultimate\w*/i, '"ultimate"'],
  [/\bcrucial\w*/i, '"crucial"'],
  [/\bessential\w*/i, '"essential"'],
  [/\bkey to\b/i, '"key to"'],
  [/\bgame[- ]?changer\b/i, '"game changer"'],
  [/\bpowerhouse\b/i, '"powerhouse"'],
  [/\beffortless\w*/i, '"effortless"'],
  [/\bseamless\w*/i, '"seamless"'],
  [/\belevat(e|es|ing)\b/i, '"elevate"'],
  [/\bjourney\w*/i, '"journey"'],
  [/\bsimply\b/i, '"simply"'],
  [/\bmake sure\b/i, '"make sure"'],
  [/\bensur(e|es|ed|ing)\b/i, '"ensure"'],
  [/\b(it'?s|it is) important\b/i, '"it\'s important"'],
  [/\bremember to\b/i, '"remember to"'],
  [/\bfocus on\b/i, '"focus on"'],
  [/\bthroughout the movement\b/i, '"throughout the movement"'],
  [/\bcontrolled manner\b/i, '"controlled manner"'],
  [/\bproper form\b/i, '"proper form"'],
  [/\bnot\b[^.,]{1,40}\bbut\b/i, '"not X but Y"'],
  [/\bit'?s not\b[^.]{1,40},\s*it'?s\b/i, '"it\'s not X, it\'s Y"'],
  [/\bnot just\b[^.]*\bbut\b/i, '"not just ... but"'],
  [/\b(pectoralis|deltoids?|latissimus|trapezius|rectus|supraspinatus|scapholunate|TFCC|iliopsoas|erectors?)\b/i, 'a Latin/clinical name'],
  [/\bpink(y|ie|ies)\b/i, '"pinky" (say "little finger")'],
];

const OWN_RED_FLAG = /get it checked|see a doctor|\bGP\b|physio|numb|tingl|swell/i;

function scanText(field: string, text: string): string[] {
  const bad: string[] = [];
  for (const [re, name] of BANNED_CHARS) if (re.test(text)) bad.push(`C7: ${field}: contains ${name}`);
  return bad;
}

/** copy-lint.mjs's own tokenizer: strip <br>, normalise curly quotes, collapse whitespace, then count only tokens
 *  that hold a letter or digit (so trailing punctuation like "-" or a lone "." never counts as a word/sentence). */
const plain = (s: string) => String(s).replace(/<br\s*\/?>/gi, ' ').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const words = (s: string) => plain(s).split(' ').filter(w => /[\p{L}\p{N}]/u.test(w)).length;
const sentences = (s: string) => plain(s).split(/(?<=[.?!])\s+(?=\S)/).filter(x => /[\p{L}\p{N}]/u.test(x));

function checkLength(field: string, text: string, maxWords: number | null, maxSentences: number | null): string[] {
  const bad: string[] = [];
  const n = words(text);
  if (maxWords != null && n > maxWords) bad.push(`C7: ${field}: ${n} words, at most ${maxWords}`);
  const sents = sentences(text);
  if (maxSentences != null && sents.length > maxSentences) bad.push(`C7: ${field}: ${sents.length} sentences, at most ${maxSentences}`);
  for (const s of sents) if (words(s) > LIMITS.anySentenceWords) bad.push(`C7: ${field}: a sentence has ${words(s)} words, at most ${LIMITS.anySentenceWords}`);
  return bad;
}

function checkLabel(field: string, text: string | undefined): string[] {
  if (!text) return [];
  const n = words(text);
  const bad: string[] = [];
  if (n < LIMITS.labelMinWords) bad.push(`C7: ${field}: ${n} words, at least ${LIMITS.labelMinWords}`);
  if (n > LIMITS.labelMaxWords) bad.push(`C7: ${field}: ${n} words, at most ${LIMITS.labelMaxWords}`);
  return bad;
}

function checkListCap(field: string, length: number, max: number, what: string): string[] {
  return length > max ? [`C7: ${field}: ${length} ${what}, at most ${max}`] : [];
}

export function checkC7(content: HowToContent): string[] {
  const bad: string[] = [];
  const scan = (field: string, text: string | undefined) => { if (text) bad.push(...scanText(field, text)); };
  const visible = new Map<string, string>();
  const shown = (field: string, text: string | undefined) => { if (text) visible.set(field, text); };
  const isFault = (f: string | HandFault): f is HandFault => typeof f === 'object';

  const h = content.handling;
  if (h.archetype !== 'none') {
    scan('handling.gripLine', h.gripLine);
    scan('handling.cue', h.cue);
    scan('handling.width.text', h.width?.text);
    scan('handling.handleChoice.sore', h.handleChoice?.sore);
    if ('limitText' in h.wrist) scan('handling.wrist.limitText', h.wrist.limitText);
    bad.push(...checkLength('handling.gripLine', h.gripLine, LIMITS.leadLineWords, LIMITS.leadLineSentences));
    bad.push(...checkLength('handling.cue', h.cue, LIMITS.cueWords, null));
    shown('handling.gripLine', h.gripLine);
    shown('handling.handleChoice.sore', h.handleChoice?.sore);
    if ('limitText' in h.wrist) shown('handling.wrist.limitText', h.wrist.limitText);
    h.faults.forEach((f, i) => {
      if (!isFault(f)) return;
      scan(`handling.faults[${i}] (${f.key}).label`, f.label);
      scan(`handling.faults[${i}] (${f.key}).alt`, f.alt);
      bad.push(...checkLabel(`handling.faults[${i}] (${f.key}).label`, f.label));
      bad.push(...checkLength(`handling.faults[${i}] (${f.key}).alt`, f.alt, LIMITS.altWords, null));
      shown(`handling.faults[${i}] (${f.key}).label`, f.label);
    });
    (h.thumb.options ?? []).forEach((o, i) => scan(`handling.thumb.options[${i}].when`, o.when));
  }
  content.setup.forEach((s, i) => {
    scan(`setup[${i}]`, s.text);
    bad.push(...checkLength(`setup[${i}]`, s.text, LIMITS.setupStepWords, null));
    shown(`setup[${i}]`, s.text);
  });
  bad.push(...checkListCap('setup', content.setup.length, LIMITS.setupMaxSteps, 'setup steps'));
  content.posture.forEach((p, i) => {
    scan(`posture[${i}] (${p.key}).label`, p.label);
    scan(`posture[${i}] (${p.key}).detail`, p.detail);
    bad.push(...checkLabel(`posture[${i}] (${p.key}).label`, p.label));
    bad.push(...checkLength(`posture[${i}] (${p.key}).detail`, p.detail, null, null));
  });
  scan('feel.feelLine', content.feel.feelLine);
  bad.push(...checkLength('feel.feelLine', content.feel.feelLine, LIMITS.feelLineWords, LIMITS.feelLineSentences));
  if (!content.feel.feelLine.startsWith('You should feel this')) bad.push('C7: feel.feelLine does not start with "You should feel this"');
  shown('feel.feelLine', content.feel.feelLine);
  content.feel.rows.forEach((r, i) => {
    scan(`feel.rows[${i}] (${r.key}).where`, r.where);
    scan(`feel.rows[${i}] (${r.key}).means`, r.means);
    scan(`feel.rows[${i}] (${r.key}).fix`, r.fix);
    bad.push(...checkLength(`feel.rows[${i}] (${r.key}).where`, r.where, LIMITS.rowWhereWords, null));
    bad.push(...checkLength(`feel.rows[${i}] (${r.key}).means`, r.means, LIMITS.rowMeansWords, LIMITS.rowMeansSentences));
    bad.push(...checkLength(`feel.rows[${i}] (${r.key}).fix`, r.fix, LIMITS.rowFixWords, LIMITS.rowFixSentences));
    if (OWN_RED_FLAG.test(r.means) || OWN_RED_FLAG.test(r.fix)) bad.push(`C7: feel.rows[${i}] (${r.key}): own red-flag wording (link redFlag, C8)`);
    const w0 = plain(r.fix).split(' ')[0]?.replace(/[^A-Za-z']/g, '').toLowerCase();
    if (w0 && !FIX_VERBS.has(w0)) bad.push(`C7: feel.rows[${i}] (${r.key}).fix: must start with a verb, starts "${plain(r.fix).split(' ')[0]}" (a verb? add it to FIX_VERBS)`);
    shown(`feel.rows[${i}] (${r.key}).where`, r.where);
    shown(`feel.rows[${i}] (${r.key}).means`, r.means);
    shown(`feel.rows[${i}] (${r.key}).fix`, r.fix);
  });
  bad.push(...checkListCap('feel.rows', content.feel.rows.length, LIMITS.feelRowsMax, 'feel rows'));
  content.zooms.forEach((z, i) => {
    const p = `zooms[${i}] (${z.key})`;
    scan(`${p}.chip`, z.chip);
    scan(`${p}.chipCaption`, z.chipCaption);
    scan(`${p}.heading`, z.heading);
    scan(`${p}.caption.right`, z.caption.right);
    scan(`${p}.caption.wrong`, z.caption.wrong);
    scan(`${p}.alt.right`, z.alt.right);
    scan(`${p}.alt.wrong`, z.alt.wrong);
    scan(`${p}.feelPrompt`, z.feelPrompt);
    bad.push(...checkLabel(`${p}.chip`, z.chip));
    bad.push(...checkLabel(`${p}.chipCaption`, z.chipCaption));
    bad.push(...checkLength(`${p}.caption.right`, z.caption.right, LIMITS.captionWords, null));
    bad.push(...checkLength(`${p}.caption.wrong`, z.caption.wrong, LIMITS.captionWords, null));
    bad.push(...checkLength(`${p}.alt.right`, z.alt.right, LIMITS.altWords, null));
    bad.push(...checkLength(`${p}.alt.wrong`, z.alt.wrong, LIMITS.altWords, null));
    bad.push(...checkLength(`${p}.feelPrompt`, z.feelPrompt ?? '', LIMITS.captionWords, null));
    shown(`${p}.chip`, z.chip);
    shown(`${p}.chipCaption`, z.chipCaption);
    shown(`${p}.heading`, z.heading);
    shown(`${p}.caption.right`, z.caption.right);
    shown(`${p}.caption.wrong`, z.caption.wrong);
    shown(`${p}.feelPrompt`, z.feelPrompt);
    for (const c of ['callout', 'callouts'] as const) {
      const cc = z[c];
      if (!cc) continue;
      for (const side of ['right', 'wrong'] as const) {
        const text = cc[side]?.text;
        scan(`${p}.${c}.${side}.text`, text);
        bad.push(...checkLabel(`${p}.${c}.${side}.text`, text));
        shown(`${p}.${c}.${side}.text`, text);
      }
    }
    const hd = z.hand;
    if (hd) {
      for (const side of ['right', 'wrong'] as const) {
        const note = hd.notes?.[side];
        scan(`${p}.hand.notes.${side}`, note);
        bad.push(...checkLabel(`${p}.hand.notes.${side}`, note));
        shown(`${p}.hand.notes.${side}`, note);
      }
      scan(`${p}.hand.note`, hd.note);
      scan(`${p}.hand.cameraLabel`, hd.cameraLabel);
      shown(`${p}.hand.note`, hd.note);
      shown(`${p}.hand.cameraLabel`, hd.cameraLabel);
      const ins = hd.inset;
      if (ins) {
        scan(`${p}.hand.inset.label`, ins.label);
        scan(`${p}.hand.inset.cameraLabel`, ins.cameraLabel);
        shown(`${p}.hand.inset.label`, ins.label);
        shown(`${p}.hand.inset.cameraLabel`, ins.cameraLabel);
        for (const side of ['right', 'wrong'] as const) {
          const note = ins[side]?.note;
          scan(`${p}.hand.inset.${side}.note`, note);
          bad.push(...checkLabel(`${p}.hand.inset.${side}.note`, note));
          shown(`${p}.hand.inset.${side}.note`, note);
        }
      }
      hd.wrong.forEach((f, j) => {
        if (!isFault(f)) return;
        scan(`${p}.hand.wrong[${j}].label`, f.label);
        scan(`${p}.hand.wrong[${j}].alt`, f.alt);
        bad.push(...checkLabel(`${p}.hand.wrong[${j}].label`, f.label));
        bad.push(...checkLength(`${p}.hand.wrong[${j}].alt`, f.alt, LIMITS.altWords, null));
        shown(`${p}.hand.wrong[${j}].label`, f.label);
      });
    }
  });
  scan('copy.setupLine', content.copy.setupLine);
  scan('copy.mistakeLine', content.copy.mistakeLine);
  scan('copy.cueLine', content.copy.cueLine);
  bad.push(...checkLength('copy.setupLine', content.copy.setupLine, LIMITS.leadLineWords, LIMITS.leadLineSentences));
  bad.push(...checkLength('copy.mistakeLine', content.copy.mistakeLine, LIMITS.leadLineWords, LIMITS.leadLineSentences));
  bad.push(...checkLength('copy.cueLine', content.copy.cueLine ?? '', LIMITS.cueWords, null));
  content.mistakes.forEach((m, i) => {
    scan(`mistakes[${i}] (${m.key}).title`, m.title);
    scan(`mistakes[${i}] (${m.key}).fix`, m.fix);
    bad.push(...checkLength(`mistakes[${i}] (${m.key}).title`, m.title, LIMITS.mistakeLabelWords, null));
    bad.push(...checkLength(`mistakes[${i}] (${m.key}).fix`, m.fix, LIMITS.mistakeFixWords, null));
    if (OWN_RED_FLAG.test(m.fix)) bad.push(`C7: mistakes[${i}] (${m.key}).fix: own red-flag wording (link redFlag, C8)`);
    shown(`mistakes[${i}] (${m.key}).title`, m.title);
    shown(`mistakes[${i}] (${m.key}).fix`, m.fix);
  });
  bad.push(...checkListCap('mistakes', content.mistakes.length, LIMITS.mistakesMax, 'handling mistakes'));
  content.risks.forEach((r, i) => {
    scan(`risks[${i}] (${r.key})`, r.text);
    bad.push(...checkLength(`risks[${i}] (${r.key})`, r.text, LIMITS.riskWords, null));
    shown(`risks[${i}] (${r.key})`, r.text);
  });
  bad.push(...checkListCap('risks', content.risks.length, LIMITS.risksMax, 'risk lines'));

  // The per-sheet red-flag box (copy-lint.mjs's lintShared, applied to this sheet's own re-exported block).
  const rf = content.redFlag;
  scan('redFlag.name', rf.name);
  scan('redFlag.now', rf.now);
  scan('redFlag.doctor', rf.doctor);
  const boxWords = words(`${rf.name} ${rf.now} ${rf.doctor}`);
  if (boxWords > LIMITS.redFlagBoxWords) bad.push(`C7: redFlag: ${boxWords} words, at most ${LIMITS.redFlagBoxWords}`);
  if (!/today/i.test(rf.now)) bad.push('C7: redFlag.now must say "today"');
  if (!/doctor/i.test(rf.doctor)) bad.push('C7: redFlag.doctor must say "doctor"');

  // Visible budget: every field the page actually shows, counted once each (dedup by field path - a chip and its
  // caption are different fields even if the text repeats, matching copy-lint.mjs's own dedup-by-(kind,text) intent
  // closely enough that a sheet within budget here is within budget there), plus the red-flag box. Alt texts and
  // source notes are excluded (copy-lint.mjs: `f.kind !== 'alt' && f.kind !== 'sourceNote'`).
  const visibleTotal = [...visible.values()].reduce((a, t) => a + words(t), 0) + boxWords;
  if (visibleTotal > LIMITS.visibleWordsMax) bad.push(`C7: visible words ${visibleTotal}, at most ${LIMITS.visibleWordsMax}`);

  return bad;
}
