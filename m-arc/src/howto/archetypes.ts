// GENERATED, do not edit. Written by tools/plates/generate.mjs (tools/plates/gen/content.mjs). inputsSha256=31b31323a81128aa314e1e98348079a17bbec22574feedeb047a07c21e32a1cd
import type { RedFlagBlock } from './content-types';

// GENERATED from tools/plates/layers/howto/shared.mjs (HT-5): the shared "Risks and when to stop" copy, one block
// per joint, plus the owner's one-line disclaimer. No card carries its own red-flag wording (C8).
export const RED_FLAG: RedFlagBlock = {
  "name": "Wrist pain",
  "now": "Can't grip, wrist changed shape, or hand gone numb? Get it checked today.",
  "doctor": "Tingling, keeps coming back, or no better after two weeks' rest? See a doctor.",
  "claim": {
    "tags": [
      "CONSENSUS"
    ],
    "sources": [
      "nhs-wrist-pain"
    ]
  }
};
export const RED_FLAG_SHOULDER: RedFlagBlock = {
  "name": "Shoulder pain",
  "now": "Sudden or severe, after falling, or arm won't move? Get it checked today.",
  "doctor": "Getting worse, very hard to move, or no better after two weeks? See a doctor.",
  "claim": {
    "tags": [
      "CONSENSUS"
    ],
    "sources": [
      "nhs-shoulder-pain"
    ]
  }
};
export const RED_FLAG_KNEE: RedFlagBlock = {
  "name": "Knee pain",
  "now": "Severe pain, badly swollen, changed shape, locking, giving way, or can't put weight on it? Get it checked today.",
  "doctor": "No better after a few weeks? See a doctor.",
  "claim": {
    "tags": [
      "CONSENSUS"
    ],
    "sources": [
      "nhs-knee-pain"
    ]
  }
};
export const RED_FLAG_ELBOW: RedFlagBlock = {
  "name": "Elbow pain",
  "now": "Severe pain and hard to move, heard a snap, changed shape, tingling, or numbness? Get it checked today.",
  "doctor": "No better after a few weeks? See a doctor.",
  "claim": {
    "tags": [
      "CONSENSUS"
    ],
    "sources": [
      "nhs-elbow-pain"
    ]
  }
};
export const DISCLAIMER: string = "General guidance, not medical advice. If something hurts, stop and get it checked.";
