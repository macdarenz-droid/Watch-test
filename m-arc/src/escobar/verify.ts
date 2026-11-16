/**
 * Grounding and verification (§14): the directive grammar (citations, knowledge cards,
 * chips), a stream buffer that never renders half a directive, the numeric check against
 * the fact ledger, and the app-side safety pre-screen (§19).
 */
import { extractNumbers } from './ledger';
import type { Fact } from './types';

const OPEN = '⟦';
const CLOSE = '⟧';

export interface Directive { kind: 'cite'; ids: string[] }
export interface ParsedAnswer {
  /** Text with directives kept only in their canonical forms (unknown ones removed). */
  text: string;
  /** Text with every directive stripped: what the verifier and screen readers see. */
  plain: string;
  citations: string[];
  cards: string[];
  chips: string[];
}

const FACT_LIST = /^f\d+(\s*,\s*f\d+)*$/;
const CARD = /^k:([a-z0-9_]+)$/;
const CHIPS = /^chips:\s*(.+)$/s;

/** Parses the full answer. Unknown directives are removed; chips are only honoured once, at the end. */
export function parseDirectives(raw: string): ParsedAnswer {
  const citations: string[] = [], cards: string[] = [];
  let chips: string[] = [];
  let text = '';
  let plain = '';
  let i = 0;
  while (i < raw.length) {
    const start = raw.indexOf(OPEN, i);
    if (start < 0) { text += raw.slice(i); plain += raw.slice(i); break; }
    text += raw.slice(i, start);
    plain += raw.slice(i, start);
    const end = raw.indexOf(CLOSE, start + 1);
    if (end < 0) break; // an unclosed directive at the end is dropped
    const body = raw.slice(start + 1, end).trim();
    const tail = raw.slice(end + 1).trim();
    if (FACT_LIST.test(body)) {
      const ids = body.split(',').map(s => s.trim());
      citations.push(...ids);
      text += `${OPEN}${ids.join(',')}${CLOSE}`;
    } else if (CARD.test(body)) {
      cards.push(CARD.exec(body)![1]!);
      text += `${OPEN}${body}${CLOSE}`;
    } else if (CHIPS.test(body) && tail === '' && !chips.length) {
      chips = CHIPS.exec(body)![1]!.split('|').map(s => s.trim()).filter(Boolean).slice(0, 3).map(s => s.slice(0, 40));
    }
    i = end + 1;
  }
  return { text: text.replace(/[ \t]+\n/g, '\n').trimEnd(), plain: plain.replace(/\s+([.,;:!?])/g, '$1').trimEnd(), citations, cards, chips };
}

/**
 * BUG-31: the brief writes facts as "38 [f41]" and the model copies that form. A `[fN]` or
 * `[fN, fM]` tag whose ids are all in this conversation's ledger becomes the canonical `⟦fN⟧` /
 * `⟦fN,fM⟧`, so its digits are not read as a number and it is stripped like any citation. A tag
 * naming an unknown id stays as written: its digits still count, and are still checked.
 */
const BRIEF_TAG = /\[\s*(f\d+(?:\s*,\s*f\d+)*)\s*\]/g;
export function normalizeCitations(text: string, ledger: Fact[]): string {
  const known = new Set(ledger.map(f => f.id));
  return text.replace(BRIEF_TAG, (tag, list: string) => {
    const ids = list.split(',').map(s => s.trim());
    return ids.every(id => known.has(id)) ? `${OPEN}${ids.join(',')}${CLOSE}` : tag;
  });
}

/** BUG-31: a trailing "[", "[f", "[f12", "[f12," or "[f12, f3" that may still become a fact tag. */
// BUG-31 review: one way to match only (the nested \s* before and after a comma backtracked exponentially).
const PARTIAL_TAG = /\[\s*(?:f\d*\s*(?:,\s*(?:f\d*\s*)?)*)?$/;

/**
 * Streaming: holds back an unfinished `⟦…`, and a trailing partial `[f…` tag (BUG-31), so half a
 * directive or tag is never rendered. A held "[" that turns out not to be a fact tag ("[1]",
 * "[note]") is released unchanged. `push` returns the text that is safe to show so far.
 */
export class DirectiveBuffer {
  private raw = '';
  push(delta: string): string {
    this.raw += delta;
    return this.safe();
  }
  safe(): string {
    const open = this.raw.lastIndexOf(OPEN);
    const close = this.raw.lastIndexOf(CLOSE);
    let visible = open > close ? this.raw.slice(0, open) : this.raw;
    const partial = PARTIAL_TAG.exec(visible);
    if (partial) visible = visible.slice(0, partial.index);
    return parseDirectives(visible).text;
  }
  get full(): string { return this.raw; }
}

// ---------- Numeric grounding (§14.3) ----------

const DATE_ISO = /\b\d{4}-\d{2}-\d{2}\b/g;
const DATE_WORDS = /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?\b/gi;
const TIME = /\b\d{1,2}:\d{2}\b/g;
const SETS_REPS = /\b\d+\s*[x×]\s*\d+\b/gi;
const QUOTED = /"[^"]*"|“[^”]*”/g;
const KG_PER_LB = 0.45359237;

export interface GroundingInput {
  answer: string;
  ledger: Fact[];
  /** The person's own messages this conversation: their numbers are allowed. */
  userTexts?: string[];
}

export interface GroundingResult {
  ok: boolean;
  ungrounded: number[];
  /** Sentences containing ungrounded numbers (directives stripped). */
  sentences: string[];
}

/** Sentences without a leading list marker, so they compare equal to what the answer renders (ES-16). */
export function sentencesOf(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim().replace(/^[-•]\s+/, '')).filter(Boolean);
}

function grounded(n: number, values: number[], lbValues: number[]): boolean {
  const a = Math.abs(n);
  for (const v of values) {
    const x = Math.abs(v);
    if (a === x || a === Math.round(x) || a === Math.round(x * 10) / 10) return true;
  }
  for (const lb of lbValues) if (Math.abs(a - lb) <= 1) return true;
  return false;
}

/** Card ids cited in a sentence ground the numbers of that card's facts (§14.4). */
export function checkGrounding(inp: GroundingInput): GroundingResult {
  // BUG-31: brief-form tags ("38 [f41]") of known facts are citations, not numbers.
  const answer = normalizeCitations(inp.answer, inp.ledger);
  const factValues = inp.ledger.map(f => f.value);
  const kgFacts = inp.ledger.filter(f => f.unit === 'kg' || /\bkg\b/.test(f.label)).map(f => f.value / KG_PER_LB);
  const userNums = (inp.userTexts ?? []).flatMap(extractNumbers);
  const bad: number[] = [];
  const badSentences: string[] = [];
  // The trailing chips directive is not a sentence (its options would read as numbers).
  const rawSentences = sentencesOf(answer.replace(/⟦chips:[^⟧]*⟧\s*$/, ''));
  for (const rawSentence of rawSentences) {
    const cardIds = [...rawSentence.matchAll(/⟦k:([a-z0-9_]+)⟧/g)].map(m => m[1]!);
    const cardValues = inp.ledger.filter(f => cardIds.some(id => f.label.startsWith(`k:${id}`))).map(f => f.value);
    const s = parseDirectives(rawSentence).plain;
    const scrubbed = s.replace(QUOTED, ' ').replace(DATE_ISO, ' ').replace(DATE_WORDS, ' ').replace(TIME, ' ').replace(SETS_REPS, ' ');
    // Ranges: "12–15 reps" → both endpoints checked separately.
    const nums = extractNumbers(scrubbed.replace(/(\d)\s*[–-]\s*(\d)/g, '$1 $2'));
    const offending = nums.filter(n => {
      if (Number.isInteger(n) && n >= 0 && n <= 10) return false; // small counts
      if (userNums.includes(n)) return false;
      return !grounded(n, [...factValues, ...cardValues], kgFacts);
    });
    if (offending.length) { bad.push(...offending); badSentences.push(s); }
  }
  return { ok: bad.length === 0, ungrounded: [...new Set(bad)], sentences: badSentences };
}

/** BUG-31: "then restate the answer" drew meta lines such as "Restated with the numbers re-checked:". */
export const repairInstruction = (nums: number[]): string =>
  `These numbers are not from your tools, cards or the brief: ${nums.join(', ')}. Recompute them with tools or remove them. Then write your whole answer again as your reply to the person. Do not mention this check or that anything was re-checked.`;

// ---------- Safety pre-screen (§19) ----------

export type SafetySignal = 'crisis' | 'pain_mentioned' | 'medical' | 'disordered_eating';

/**
 * ES-14: "end it after 3 sets" and "I hurt myself on squats" are not crises; ongoing self-harm
 * ("I've been hurting myself") still is.
 * BUG-32: the everyday ways of saying the same thing: "wanna", "do not", "be alive", "exist",
 * "wish I was dead", "no point in living", "not worth living", "better off without me", "nobody
 * would miss me", "unalive myself", "cut myself", and "kms" (kill myself) only straight after a
 * verb of intent, so a distance ("ran 5 kms", "10kms") never fires. Gym talk stays out: "be
 * here" followed by a time, a day or a duration ("don't want to be here late"), and "cut myself"
 * followed by "shaving", "on the bar" or "some slack". "want to die" still fires on gym hyperbole.
 * BUG-35: "don't want to wake up" (not when "for leg day", "at 5am" or "early" follows), "wish I
 * wasn't alive", "what's the point of living", "want it all to end", "want to disappear" (not
 * "into the sauna"), "want to unalive", and "kill me now" unless a gym word, "lol" or a laughing
 * emoji follows it in the same sentence. The `u` flag lets the emoji match.
 */
/** BUG-35: words that make "kill me now" gym hyperbole when they follow it in the same sentence. */
const GYM_WORDS = String.raw`sets?|reps?|rounds?|laps?|burpees?|squats?|deadlifts?|lunges?|sprints?|bench|cardio|hiit|amrap|emom|wod|leg day|legs|workout|gym|pull-?ups?|push-?ups?`;
const CRISIS = new RegExp(String.raw`\b(${[
  String.raw`kill(ing)? myself`,
  String.raw`suicid\w*`,
  String.raw`end my life`,
  String.raw`end it all`,
  String.raw`(want to|wanna) die`,
  String.raw`(don'?t|do not) (want to|wanna) (live|be alive|exist|be here(?!\s+((late|later|early|earlier)\b|(at|by|until|till|before|after|past|from|around) \d|(on|at) (the )?(weekends?|(mon|tues|wednes|thurs|fri|satur|sun)days?)\b|for (\d|an? (hour|minute)\b|hours\b|minutes\b|ages\b)|(too|so|that) (long|late|early)\b|all (day|night|morning|afternoon|evening)\b)))`,
  String.raw`self[- ]?harm\w*`,
  String.raw`((want|going|trying) to|wanna|gonna) hurt myself`,
  String.raw`harm(ing)? myself`,
  String.raw`hurt(ing)? myself on purpose`,
  String.raw`(been|keep|kept|started) hurting myself(?!\s+(on|at|during|doing|with|in|lifting|squatting|benching|training))`,
  String.raw`(((want|going|trying|need) to|wanna|gonna) cut|(been|keep|kept|started) cutting) myself(?!\s+((some|a|an|slack|off|short|loose|free|out|down|back|in|on|at|with|while|when|during|doing|shaving|by|from|opening|chopping|cooking)\b|to \d))`,
  String.raw`cut(ting)? myself on purpose`,
  String.raw`unaliv(e|ing) myself`,
  String.raw`(((want|going|about|trying|need) to|wanna|gonna|finna|tryna) unalive|(thinking|thought) (about|of) unaliving)`,
  String.raw`(don'?t|do not) (want to|wanna) wake up(?!\s+((for|before|at|by) (?!(all|any|another|anything|anyone|anybody|nothing|no ?one|much longer)\b)|((so|this|that|too) )?early\b|(on|at) (the )?(weekends?|(mon|tues|wednes|thurs|fri|satur|sun)days?)\b))`,
  String.raw`wish i (wasn'?t|weren'?t|was not|were not) alive`,
  String.raw`(what'?s|what is) the point (of|in) (living|being alive)`,
  String.raw`(want|wanna|wish|need) (for )?(it all|everything) to (end|stop)`,
  String.raw`((want|going|need) to|wanna|gonna) disappear(?!\s+((into|inside|under|behind)\b|in (the )?(sauna|steam room|pool|gym|bed)\b|to (the )?(gym|sauna|pool|beach|bed|couch)\b|for (a |the |\d+ )?(weekend|holiday|vacation|week|day|hour|minute)s?\b))`,
  String.raw`kill me now(?![^.!?]*(\b(${GYM_WORDS}|lol|lmao|haha\w*|jk)\b|[\u{1F602}\u{1F923}\u{1F480}\u{1F605}]))`,
  String.raw`((want|going|about|trying) to|wanna|gonna|finna|tryna) kms`,
  String.raw`wish i (was|were) dead`,
  String.raw`no reason to live`,
  String.raw`no point (in )?living`,
  String.raw`(isn'?t|not) worth living`,
  String.raw`better off (dead|without me)`,
  String.raw`(nobody|no one|no-one) would (even )?miss me`,
].join('|')})\b`, 'iu');
const MEDICAL = /\b(chest pain|chest (hurts|tight)|faint(ed|ing)?|passed out|black(ed)? out|dizz(y|iness)|heart (racing|palpitations)|palpitations|can'?t breathe)\b/i;
const PAIN = /\b(sharp pain|shooting pain|stabbing|numb(ness)?|tingl\w*|pins and needles|radiat\w*|pain|hurts?|injur\w*|strain(ed)?|sprain(ed)?|tweak(ed)?|pulled (a|my))\b/i;
const EATING = /\b(starv\w*|not eating|stop(ped)? eating|purg\w*|throw(ing)? up after|binge\w*|500 calories|800 calories|lose \d{2,} ?(kg|lb|pounds|kilos) in (a|one|two|\d) (week|month)|laxatives?|skip(ping)? (all )?meals|burn off (what|everything) i ate)\b/i;

/** BUG-30: keyboards type the apostrophe as ’ ‘ ʼ ＇ ′ ` or ´, and pastes or autocorrect leave double spaces, no-break
 *  spaces or line breaks; the patterns above expect ' and single spaces. */
const APOSTROPHES = /[\u2018\u2019\u02BC\uFF07\u2032`\u00B4]/g;

export function safetySignals(raw: string): SafetySignal[] {
  const text = raw.replace(APOSTROPHES, "'").replace(/\s+/g, ' ');
  const out: SafetySignal[] = [];
  if (CRISIS.test(text)) out.push('crisis');
  if (MEDICAL.test(text)) out.push('medical');
  if (PAIN.test(text)) out.push('pain_mentioned');
  if (EATING.test(text)) out.push('disordered_eating');
  return out;
}
