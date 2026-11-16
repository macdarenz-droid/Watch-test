// Test pairs for the hand renderer (push, pull, hang), shared by hand-test.mjs and the debug helper.
export const PAIRS = {
  push: {
    camera: 'above', loadAxis: 'along-forearm', markers: ['lever-arc'],
    right: { forearm: 180, wrist: { ext: 8 }, contactAt: 0.3, thumb: 'wrapped', handle: { profile: 'press-vertical' }, load: { kind: 'push' } },
    wrong: { forearm: 180, wrist: { ext: 35 }, contactAt: 1.05, thumb: 'loose', fingers: { curl: 0.92 }, handle: { profile: 'press-vertical' }, load: { kind: 'push' } },
    rightNote: 'Heel of palm', wrongNote: 'Bent back',
    alt: { right: 'Wrist straight, knuckles in line with the forearm, handle in the heel of the palm, thumb wrapped. The push runs straight down the forearm.',
      wrong: 'Wrist bent back, handle in the fingers, thumb loose. The push passes behind the wrist and levers it further back.' },
  },
  pull: {
    camera: 'side', loadAxis: 'across', markers: ['lever-arc', 'tendon'],
    right: { forearm: 180, wrist: { ext: 5 }, contactAt: 1.0, thumb: 'wrapped', handle: { profile: 'pulldown-bar' }, load: { kind: 'pull' } },
    wrong: { forearm: 180, wrist: { ext: -30 }, contactAt: 0.8, thumb: 'wrapped', squeeze: 'max', handle: { profile: 'pulldown-bar' }, load: { kind: 'pull' } },
    rightNote: 'Base of fingers', wrongNote: 'Curled, squeezed',
    alt: { right: 'Bar across the base of the fingers, thumb wrapped, back of the hand in line with the forearm.',
      wrong: 'Wrist curled forward and the bar squeezed hard; the forearm tendons stand out.' },
  },
  hang: {
    camera: 'side', loadAxis: 'across', markers: ['slip-arrow', 'lever-arc'],
    right: { forearm: 180, wrist: { ext: 15 }, contactAt: 1.0, thumb: 'wrapped', handle: { profile: 'bar-28' }, load: { kind: 'gravity' } },
    wrong: { forearm: 180, wrist: { ext: 30 }, contactAt: 1.45, thumb: 'over', fingers: { curl: 1, open: 0.45 }, handle: { profile: 'bar-28' }, load: { kind: 'gravity' } },
    rightNote: 'Top of palm', wrongNote: 'Slipping out',
    alt: { right: 'Bar across the top of the palm where the fingers start, fingers over the top, thumb wrapped under.',
      wrong: 'Bar slid out to the fingertips, fingers peeling open, thumb loose on top.' },
  },
};
// debug-only single poses (engine/_hand-one.mjs <name> right)
export const EXTRA = {
  hook: { right: { forearm: 180, wrist: { ext: 15 }, contactAt: 1.0, thumb: 'hook', handle: { profile: 'bar-28' }, load: { kind: 'gravity' } } },
  over: { right: { forearm: 180, wrist: { ext: 15 }, contactAt: 1.0, thumb: 'over', handle: { profile: 'bar-28' }, load: { kind: 'gravity' } } },
};
