// HT4-A3 C7 bad fixture: the redFlag box exceeds redFlagBoxWords (30 words, name + now + doctor).
import type { HowToContent } from '../../../../src/howto/content-types';

export function mutate(good: HowToContent): HowToContent {
  return {
    ...good,
    redFlag: {
      ...good.redFlag,
      now: "Get it checked today if you can't grip properly, the wrist looks a different shape than normal, or your hand goes numb.",
      doctor: "See a doctor if it's no better after a full two weeks of rest, keeps coming back again and again, or tingles a lot.",
    },
  };
}
