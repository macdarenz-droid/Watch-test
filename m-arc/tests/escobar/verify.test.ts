import { describe, it, expect } from 'vitest';
import { parseDirectives, DirectiveBuffer, checkGrounding, safetySignals, repairInstruction, normalizeCitations } from '@/escobar/verify';
import type { Fact } from '@/escobar/types';

const fact = (id: string, value: number, label: string, unit?: string): Fact => ({ id, value, label, ...(unit ? { unit } : {}), source: { tool: 't' }, turn: 0 });

describe('directives (§14.2)', () => {
  it('keeps citations and card refs, extracts chips, drops unknown directives', () => {
    const p = parseDirectives('Bench e1RM is 102.5 kg ⟦f12⟧, protein 1.6 g/kg ⟦k:protein_intake⟧ ⟦evil: run⟧. ⟦chips: Show squat | Why amber? | Plan tomorrow | Fourth⟧');
    expect(p.citations).toEqual(['f12']);
    expect(p.cards).toEqual(['protein_intake']);
    expect(p.chips).toEqual(['Show squat', 'Why amber?', 'Plan tomorrow']);
    expect(p.text).not.toContain('evil');
    expect(p.text).not.toContain('chips');
    expect(p.plain).toBe('Bench e1RM is 102.5 kg, protein 1.6 g/kg.');
  });
  it('multiple fact ids and chips only at the very end', () => {
    expect(parseDirectives('x ⟦f1, f2⟧').citations).toEqual(['f1', 'f2']);
    expect(parseDirectives('⟦chips: a | b⟧ then more').chips).toEqual([]);
    expect(parseDirectives('long '.repeat(3) + '⟦chips: ' + 'y'.repeat(60) + '⟧').chips[0]!.length).toBe(40);
  });
  it('the stream buffer never shows half a directive', () => {
    const b = new DirectiveBuffer();
    expect(b.push('Up 5% ⟦f')).toBe('Up 5%');
    expect(b.push('12')).toBe('Up 5%');
    expect(b.push('⟧ nice')).toBe('Up 5% ⟦f12⟧ nice');
  });
});

describe('grounding (§14.3)', () => {
  const ledger = [fact('f1', 102.456, 'bench e1RM', 'kg'), fact('f2', 62, 'quads recovery', '%'), fact('f3', 20.412, 'bar', 'kg'), fact('k1', 1.6, 'k:protein_intake numbers protein low'), fact('k2', 2.2, 'k:protein_intake numbers protein high')];
  const g = (answer: string, userTexts: string[] = []) => checkGrounding({ answer, ledger, userTexts });
  it('accepts exact and rounded ledger values (0 and 1 decimals)', () => {
    expect(g('Your bench estimate is 102.5 kg ⟦f1⟧ and quads are at 62% ⟦f2⟧.').ok).toBe(true);
    expect(g('About 102 kg.').ok).toBe(true);
  });
  it('flags invented numbers with their sentences', () => {
    const r = g('Bench is 102.5 kg ⟦f1⟧. You could hit 142.5 kg by spring.');
    expect(r.ok).toBe(false);
    expect(r.ungrounded).toEqual([142.5]);
    expect(r.sentences).toEqual(['You could hit 142.5 kg by spring.']);
  });
  it('lb within 1 lb of a converted kg fact is grounded', () => {
    expect(g('That bar is 45 lb.').ok).toBe(true);
    expect(g('Bench is about 226 lb.').ok).toBe(true);
    expect(g('Bench is about 240 lb.').ok).toBe(false);
  });
  it('small counts, set×rep notation, dates, times and quoted user text are allowed', () => {
    expect(g('Do 3 sets of 8, so 3x8 or 4×10, on 2026-09-17 at 07:30, or 17 Sep. You said "I bench 140".').ok).toBe(true);
  });
  it('checks both ends of a range', () => {
    expect(g('Aim for 62–102 kg.').ok).toBe(true);
    expect(g('Aim for 62–150 kg.').ungrounded).toEqual([150]);
  });
  it('a knowledge card citation grounds that card’s numbers in the same sentence only', () => {
    expect(g('Most people do well on 1.6 to 2.2 g/kg ⟦k:protein_intake⟧.').ok).toBe(true);
    expect(g('Most people do well on 1.6 to 2.2 g/kg.').ok).toBe(true); // values are also plain ledger facts
    expect(checkGrounding({ answer: 'Eat 1.6 g/kg.', ledger: [] }).ok).toBe(false);
  });
  it('numbers from the person’s own messages are allowed', () => {
    expect(g('Since you weigh 83 kg, keep going.', ['I weigh 83 kg now']).ok).toBe(true);
  });
  it('repair instruction lists the numbers', () => {
    // BUG-31 A3: "then restate the answer" drew meta lines; the approved wording, still an exact match.
    expect(repairInstruction([142.5, 18])).toBe('These numbers are not from your tools, cards or the brief: 142.5, 18. Recompute them with tools or remove them. Then write your whole answer again as your reply to the person. Do not mention this check or that anything was re-checked.');
  });
});

describe('BUG-31 A1 brief-form fact tags', () => {
  // The owner's screenshot: every id is above f10, so each tag's digits used to read as a number.
  const SCREENSHOT = "You've done 2 [f40] of 3 [f43] planned sessions this week, 38 [f41] sets, 6 [f42] records. Readiness is green 67 [f33], advice normal. Biceps are at 45% [f34] and triceps 52% [f36], so your last sessions were real work.";
  const ledger = [
    fact('f33', 67, 'readiness score today'), fact('f34', 45, 'Biceps recovery', '%'), fact('f36', 52, 'Triceps recovery', '%'),
    fact('f40', 2, 'sessions this week'), fact('f41', 38, 'sets this week'), fact('f42', 6, 'records this week'), fact('f43', 3, 'planned sessions this week'),
  ];
  it('normalizeCitations makes [fN] and [fN, fM] canonical only when every id is in the ledger', () => {
    expect(normalizeCitations('38 [f41] sets, 2 [f40, f43] and 3 [ f43 ,f42 ].', ledger)).toBe('38 ⟦f41⟧ sets, 2 ⟦f40,f43⟧ and 3 ⟦f43,f42⟧.');
    expect(normalizeCitations('67 [f999], 38 [f41, f999], [1], [note], ⟦f41⟧', ledger)).toBe('67 [f999], 38 [f41, f999], [1], [note], ⟦f41⟧');
  });
  it('the screenshot paragraph is grounded', () => {
    expect(checkGrounding({ answer: SCREENSHOT, ledger })).toEqual({ ok: true, ungrounded: [], sentences: [] });
  });
  it('an invented number next to a real id is still flagged, and only that number', () => {
    const r = checkGrounding({ answer: 'You did 55 [f41] sets. Readiness is 67 [f33].', ledger });
    expect(r.ungrounded).toEqual([55]);
    // The verifier's plain form, as for any mid-sentence ⟦f41⟧ (the screen collapses the gap).
    expect(r.sentences).toEqual(['You did 55  sets.']);
  });
  it('an unknown id is left as written, so its digits are still flagged', () => {
    const r = checkGrounding({ answer: 'Readiness is 67 [f999]. You did 38 [f41, f998] sets.', ledger });
    // One unknown id keeps the whole tag as written, so all its digits count.
    expect(r.ungrounded).toEqual([999, 41, 998]);
    expect(r.sentences).toEqual(['Readiness is 67 [f999].', 'You did 38 [f41, f998] sets.']);
  });
});

describe('safety pre-screen (§19)', () => {
  it.each([
    ['I want to kill myself', 'crisis'],
    ['some days I feel like I want to die', 'crisis'],
    ['I got chest pain on the treadmill', 'medical'],
    ['felt dizzy after squats', 'medical'],
    ['sharp pain in my shoulder when I press', 'pain_mentioned'],
    ['my fingers go numb on rows', 'pain_mentioned'],
    ['I want to lose 10 kg in a week', 'disordered_eating'],
    ['I have been eating 500 calories a day', 'disordered_eating'],
  ])('%s → %s', (text, signal) => expect(safetySignals(text)).toContain(signal));
  // ES-14: the crisis screen, phrase by phrase. `true` must raise 'crisis'; `false` must not.
  it.each([
    ['I want to kill myself', true],
    ["I've been thinking about suicide", true],
    ['having suicidal thoughts again', true],
    ['I want to end my life', true],
    ['sometimes I just want to end it all', true],
    ["I don't want to live anymore", true],
    ['I dont want to be here anymore', true],
    ["I've been self-harming", true],
    ['thinking about self harm', true],
    ['I want to hurt myself', true],
    ["I'm going to hurt myself tonight", true],
    ['I keep harming myself', true],
    ['I hurt myself on purpose', true],
    ["I've been hurting myself", true],
    ['I kept hurting myself last month', true],
    ['there is no reason to live', true],
    ["everyone would be better off dead without me, I'd be better off dead", true],
    ['end it after 3 sets', false],
    ['I hurt myself on squats', false],
    ['I keep hurting myself doing deadlifts', false],
    ["I've been hurting myself lifting too heavy", false],
    ['started hurting myself benching wide', false],
    ['this workout is killing me', false],
    ['legs day will kill me', false],
    ['I could die for a rest day', false],
    ['my quads are dead after that', false],
    ['end the session early?', false],
    ['can I end my set at 8 reps', false],
    ['I killed that PR', false],
    ['harmless question: is creatine safe', false],
    // BUG-32: common ways of saying the same thing, each with a curly apostrophe where it has one.
    ['dont wanna be here', true],
    ['i do not want to be here anymore', true],
    ["i don't want to be alive", true],
    ['i don’t want to be alive', true],
    ['dont want to exist anymore', true],
    ['i wanna die', true],
    ['i wish i was dead', true],
    ['wish i were dead', true],
    ["there's no point in living", true],
    ['there’s no point in living', true],
    ["life isn't worth living", true],
    ['life isn’t worth living', true],
    ['everyone would be better off without me', true],
    ['nobody would miss me if i was gone', true],
    ['i want to unalive myself', true],
    ['i want to cut myself', true],
    ['i keep cutting myself', true],
    // BUG-32: the same family, and the time words that keep "be here" about the gym do not hide these.
    ["i've been cutting myself again", true],
    ['i cut myself on purpose', true],
    ['i wanna hurt myself', true],
    ["i'm gonna hurt myself", true],
    ['i wanna kms', true],
    ["i'm about to kms", true],
    ["i don't want to be here at all", true],
    ["i don't want to be here on this earth anymore", true],
    ["i don't want to be here for much longer", true],
    ["i don't want to be here tomorrow", true],
    ["i don't want to be here late. honestly i don't want to be here", true],
    // BUG-32: gym talk stays quiet (the negatives above still hold).
    ['ran 5 kms today', false],
    ['10kms on the bike', false],
    ['i want to run 5 kms', false],
    ["i'm gonna do 10 kms tomorrow", false],
    ['i cut myself shaving', false],
    ['cut my finger', false],
    ["i'm dying for a rest day", false],
    ['i’m dying for a rest day', false],
    ['i want to be here more often', false],
    ["i don't want to be here late", false],
    ['i don’t want to be here late', false],
    ['i dont want to be here at 6am', false],
    ["i don't want to be here on sundays", false],
    ["i don't want to be here for 2 hours", false],
    ["i don't want to be here too long", false],
    ["i don't want to be here all day", false],
    ['i want to cut myself some slack', false],
    ['i keep cutting myself on the knurling', false],
    ['i need to cut myself down to 80 kg', false],
    ['i want to cut myself to 12% body fat', false],
    ['i wish i was deadlifting today', false],
    ['this workout unalived me', false],
    // BUG-35: seven more ways of saying it, each with a curly apostrophe where it has one.
    ["i don't want to wake up", true],
    ['i don’t want to wake up', true],
    ['i dont wanna wake up tomorrow', true],
    ["i don't want to wake up at all", true],
    ["i don't want to wake up for another day", true],
    ["i wish i wasn't alive", true],
    ['i wish i wasn’t alive', true],
    ["what's the point of living", true],
    ['what’s the point of living', true],
    ['whats the point in being alive', true],
    ['i want it all to end', true],
    ['i just want everything to stop', true],
    ['i want to disappear', true],
    ['i just wanna disappear forever', true],
    ['i want to disappear in my sleep', true],
    ['i want to disappear instantly', true],
    ['i wanna disappear underneath it all', true],
    ['i want to unalive', true],
    ["i'm going to unalive", true],
    ['kill me now', true],
    ['please just kill me now', true],
    ["i can't do this anymore, kill me now", true],
    ['did 3 sets today. kill me now, i hate everything', true],
    ['my therapy session went badly, kill me now', true],
    // BUG-35 review: a gym word or "lol" before "kill me now" does not hide it; one after it still does.
    ["i'm a failure lol kill me now", true],
    ['i hate the gym and my life, kill me now', true],
    ['10 burpees, kill me now', true],
    ['i want to disappear in peace', true],
    ['i want to disappear in a way that no one notices', true],
    ["i've been thinking about unaliving", true],
    ['i want to disappear in the sauna', false],
    // BUG-35: gym talk stays quiet.
    ["i don't want to wake up for leg day", false],
    ['i don’t want to wake up at 5am for cardio', false],
    ["i don't want to wake up so early", false],
    ['kill me now, 3 more sets', false],
    ['this burpee set, kill me now lol', false],
    ['kill me now lmao', false],
    ['kill me now lol', false],
    ['kill me now 😂', false],
    ['leg day tomorrow, kill me now 😂', false],
    ['i want to disappear into the sauna', false],
    ['i want to disappear for a week on holiday', false],
    ['i want this set to end', false],
    ['what’s the point of lifting light', false],
    ['this burpee set is unaliving me', false],
  ] as const)('crisis screen: %s → %s', (text, crisis) => expect(safetySignals(text).includes('crisis')).toBe(crisis));
  // BUG-35 review: the crisis scan stays linear; a long run of "kill " once took 33 ms and grew with the square of its length.
  it('crisis screen: a long repeated message scans in under 50 ms', () => {
    for (const times of [1000, 4000]) {
      const start = performance.now();
      safetySignals('kill '.repeat(times));
      expect(performance.now() - start).toBeLessThan(50);
    }
  });
  // BUG-32: "kms" fires only straight after a verb of intent; a distance never does, however it is written.
  it('crisis screen: kms as a distance never fires', () => {
    const fired: string[] = [];
    for (const n of ['1', '5', '10', '21', '42', '2.5', '0.8'])
      for (const unit of [' kms', 'kms', ' KMS'])
        for (const lead of ['', 'ran ', 'i want to run ', 'gonna do ', 'going to ride ', 'about to walk ', 'trying to row ', 'wanna jog '])
          for (const tail of ['', ' today', ' on the bike', '?'])
            if (safetySignals(`${lead}${n}${unit}${tail}`).includes('crisis')) fired.push(`${lead}${n}${unit}${tail}`);
    expect(fired).toEqual([]);
    expect(safetySignals('i wanna kms').includes('crisis')).toBe(true);
  });
  // BUG-30: phone keyboards type the curly apostrophe (U+2019), and some the modifier letter (U+02BC) or U+2018.
  it.each([
    ['I don\u2019t want to be here anymore', 'crisis'],
    ['i don\u2019t want to live', 'crisis'],
    ['I don\u02BCt want to be here', 'crisis'],
    ['I don\u2018t want to live', 'crisis'],
    ['I can\u2019t breathe after that set', 'medical'],
    ['I can\u02BCt breathe', 'medical'],
    // BUG-30 review: other apostrophe look-alikes, and spacing the patterns did not allow.
    ['I don\uFF07t want to live', 'crisis'],
    ['I don\u2032t want to live', 'crisis'],
    ['I don`t want to live', 'crisis'],
    ['I don\u00B4t want to live', 'crisis'],
    ['I don\u2019t  want to be here', 'crisis'],
    ['I don\u2019t\u00A0want to be here', 'crisis'],
    ['I can\u2019t\nbreathe', 'medical'],
  ] as const)('curly apostrophe and spacing: %s → %s', (text, signal) => expect(safetySignals(text)).toContain(signal));
  it('ordinary questions carry no signal', () => {
    expect(safetySignals('Why is my readiness amber?')).toEqual([]);
    expect(safetySignals('Build me a 4-day programme')).toEqual([]);
  });
});
