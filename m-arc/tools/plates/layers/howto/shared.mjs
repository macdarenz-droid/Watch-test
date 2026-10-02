// Shared How-to copy: ONE red-flag block and ONE disclaimer for every sheet (plan S-2 condition 4; architecture 4.2).
// Every exercises/<id>.howto.mjs imports from here; no card carries its own copy (C8). The app generates
// src/howto/archetypes.ts from this file (HT-5), so the wording lives in one place.

/** Wrist red flag. Source: NHS, Wrist pain, https://www.nhs.uk/conditions/hand-pain/wrist-pain/ (checked 2026-09-30).
 *  Shown once per sheet, in "Risks and when to stop". Wording: the triggers of architecture 4.2, cut to at most 30 words
 *  per box (owner 2026-09-30, "shorter and compact"); "changes shape" is the NHS page's own phrase. Every box reads
 *  "<triggers>? Get it checked today." then "<triggers>? See a doctor.", and artifact/copy-lint.mjs (RED_FLAG_BLOCKS)
 *  fails the build if a trigger, the joint-name opener or the NHS source goes. */
export const RED_FLAG = {
  name: 'Wrist pain',   // block label: a sheet can show more than one block, and "it" must say which joint
  now: "Can't grip, wrist changed shape, or hand gone numb? Get it checked today.",
  doctor: "Tingling, keeps coming back, or no better after two weeks' rest? See a doctor.",
  claim: { tags: ['CONSENSUS'], sources: ['nhs-wrist-pain'] },
};

/** Shoulder red flag, for every shoulder-pinch row (pull-up, lat pulldown, seated cable row, lateral raise). Source:
 *  NHS, Shoulder pain, https://www.nhs.uk/conditions/shoulder-pain/ (checked 2026-09-30). PROPOSAL for the supervisor:
 *  architecture 4.2 names one wrist RED_FLAG; the joint blocks below are kept here, in the shared module, not in a card.
 *  A row links to one with redFlag: '<joint>' and the card lists it in riskFlags (howto-layers checks both). */
export const RED_FLAG_SHOULDER = {
  name: 'Shoulder pain',
  now: "Sudden or severe, after falling, or arm won't move? Get it checked today.",
  doctor: "Getting worse, very hard to move, or no better after two weeks? See a doctor.",
  claim: { tags: ['CONSENSUS'], sources: ['nhs-shoulder-pain'] },
};

/** Knee red flag (leg press, back squat knee rows). Source: NHS, Knee pain, https://www.nhs.uk/symptoms/knee-pain/
 *  (checked 2026-09-30: 111 if very painful, can't move it or put weight on it, badly swollen or changed shape, locks or
 *  gives way; GP if no better within a few weeks). */
export const RED_FLAG_KNEE = {
  name: 'Knee pain',
  now: "Severe pain, badly swollen, changed shape, locking, giving way, or can't put weight on it? Get it checked today.",
  doctor: 'No better after a few weeks? See a doctor.',
  claim: { tags: ['CONSENSUS'], sources: ['nhs-knee-pain'] },
};

/** Elbow red flag (pull-up and chest press elbow rows). Source: NHS, Elbow and arm pain,
 *  https://www.nhs.uk/symptoms/elbow-and-arm-pain/ (checked 2026-09-30: urgent care if severe pain and hard to move, a
 *  snap or changed shape after an injury, tingling or numbness; GP if it doesn't go away after a few weeks). */
export const RED_FLAG_ELBOW = {
  name: 'Elbow pain',
  now: 'Severe pain and hard to move, heard a snap, changed shape, tingling, or numbness? Get it checked today.',
  doctor: 'No better after a few weeks? See a doctor.',
  claim: { tags: ['CONSENSUS'], sources: ['nhs-elbow-pain'] },
};

/** The owner's safety line, exactly as he wrote it (owner decision 2026-09-30). Shown once per sheet, small, last,
 *  right after Risks and when to stop. */
export const DISCLAIMER = 'General guidance, not medical advice. If something hurts, stop and get it checked.';
