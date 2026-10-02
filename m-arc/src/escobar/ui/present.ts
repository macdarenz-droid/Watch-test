/** Plain-words presentation helpers for Escobar's answers (pure, tested in tests/escobar/ui.test.ts). */

const PAST: Array<[RegExp, string]> = [
  [/^Reading\b/, 'Read'], [/^Checking\b/, 'Checked'], [/^Counting\b/, 'Counted'], [/^Drawing\b/, 'Drew'],
  [/^Looking\b/, 'Looked'], [/^Working out\b/, 'Worked out'], [/^Searching\b/, 'Searched'], [/^Opening\b/, 'Opened'],
  [/^Finding\b/, 'Found'], [/^Calculating\b/, 'Calculated'], [/^Preparing\b/, 'Prepared'], [/^Drafting\b/, 'Drafted'],
  [/^Remembering\b/, 'Remembered'], [/^Forgetting\b/, 'Forgot'], [/^Getting\b/, 'Got'], [/^Adjusting\b/, 'Adjusted'],
  [/^Noting\b/, 'Noted'], [/^Adding\b/, 'Added'],
];

/** "Reading your Lat Pulldown history…" → "Read your Lat Pulldown history". */
export function pastTense(label: string): string {
  const s = label.replace(/…$/, '').trim();
  for (const [re, to] of PAST) if (re.test(s)) return s.replace(re, to);
  return s;
}

/** A fact citation, canonical (`⟦f12⟧`, `⟦f3,f4⟧`) or in the brief's form (`[f12]`, `[f3, f4]`, BUG-31). */
const FACT_CITE = /⟦\s*(f\d+(?:\s*,\s*f\d+)*)\s*⟧|\[\s*(f\d+(?:\s*,\s*f\d+)*)\s*\]/g;
/** Any marker (an unclosed one at the end included) or brief-form fact tag, with the spaces before it. */
const ANY_MARKER = /[ \t]*(?:⟦[^⟧]*(?:⟧|$)|\[\s*f\d+(?:\s*,\s*f\d+)*\s*\])/gi;
/** A tag cut off at the end, e.g. a pin title cut to 60 characters: "… trend [f4". */
const TRAILING_HALF_TAG = /[ \t]*\[\s*(?:f\d*\s*(?:,\s*(?:f\d*\s*)?)*)?$/i; // one way to match only, like PARTIAL_TAG

/**
 * Pulls every fact citation (`⟦f12⟧`, `⟦f3,f4⟧`, and the brief's `[f12]` / `[f3, f4]`, BUG-31) out of
 * one sentence and returns their ids; drops knowledge-card citations (`⟦k:…⟧`). Nothing of either is
 * shown (owner, LR-23): the markers only serve the number check. Spaces a removed marker leaves
 * before punctuation go too.
 */
export function splitCitations(sentence: string): { text: string; ids: string[] } {
  const ids: string[] = [];
  const text = sentence
    .replace(FACT_CITE, (_m, a: string | undefined, b: string | undefined) => { for (const id of (a ?? b ?? '').split(',').map(x => x.trim())) if (!ids.includes(id)) ids.push(id); return ''; })
    .replace(/⟦k:[^⟧]*⟧/g, '')
    .replace(/\s+([.,;:!?—–)])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
  return { text, ids };
}

/**
 * BUG-31: text shown outside the answer (a preamble, an earlier draft, a `show` caption, a pinned
 * card's title) without any `⟦…⟧` marker or `[fN]` / `[fN, fM]` tag, known id or not. Each goes
 * with the spaces before it, so no gap is left before punctuation and nothing else moves. Applied
 * at render time, so conversations stored with tags display clean too.
 */
export function stripCitationTags(text: string): string {
  return text.replace(ANY_MARKER, '').replace(TRAILING_HALF_TAG, '').trim();
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * What the "What Escobar looked at" drawer shows for one tool use (D-LR23-3). The person's own
 * data shows in full; internal hints are hidden at display time, stored old results included:
 * `sources` and `rating` of looked-up knowledge cards, and the note of an escalate call.
 * The model still receives them unchanged.
 */
export function drawerView(name: string, input: Record<string, unknown>, content: string | undefined): { inputs: Array<[string, unknown]>; output: string | null } {
  const inputs = Object.entries(input).filter(([k, v]) => v != null && typeof v !== 'object' && !(name === 'escalate' && k === 'note'));
  if (content == null) return { inputs, output: null };
  try {
    const j = JSON.parse(content) as unknown;
    let data = isRecord(j) && 'data' in j ? j.data : j;
    if (name === 'lookup_knowledge' && isRecord(data) && Array.isArray(data.cards)) {
      data = { ...data, cards: data.cards.map(c => { if (!isRecord(c)) return c; const { sources: _s, rating: _r, ...rest } = c; return rest; }) };
    }
    return { inputs, output: JSON.stringify(data, null, 1).slice(0, 4000) };
  } catch { return { inputs, output: content.slice(0, 4000) }; }
}
