export const meta = {
  name: 'ht7-label-variance-rootcause',
  description: 'Find the root cause of the HT-7 "Bony bump" SVG label width variance and a fix that keeps L3 at 0 px',
  phases: [
    { title: 'Hypothesize', detail: '4 independent lenses read the code and evidence' },
    { title: 'Judge', detail: 'rank hypotheses, design discriminating experiments and fixes' },
  ],
}

// HT-7 label-variance root cause: 4 independent lenses (Blink SVG text scaling, font cache, app environment, measurement harness), then one judge.
// Run it with the Workflow tool: script = this file, args = ht7-label-variance-rootcause.args.json (a JSON object with "head" and "evidence", not a string). See README.md in this folder.
// It reads code only: it must not build, run browsers or the gate. Returns { lenses, judged }.

const EVIDENCE = args.evidence
const SCHEMA = {
  type: 'object',
  properties: {
    hypotheses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          mechanism: { type: 'string', description: 'exact causal chain, naming Chromium/Blink/Skia/HarfBuzz components where relevant' },
          fits_evidence: { type: 'string', description: 'how it explains EVERY observation, incl. golden B 0/300, fresh tab good, fresh text node in bad tab bad, relayout/re-attach does not clear, load-dependent rate' },
          contradicts: { type: 'string', description: 'any observation it fails to explain' },
          code_pointers: { type: 'string', description: 'file:line in the repo (main or HT-7 head) that matter' },
          experiment: { type: 'string', description: 'one cheap discriminating experiment: exact steps, what to measure, expected result if true vs false' },
          fix: { type: 'string', description: 'a fix that keeps L3 at 0 px vs golden B at rest, does not change golden B or the plates, does not loosen any check; say which files' },
          confidence: { type: 'number' },
        },
        required: ['title', 'mechanism', 'fits_evidence', 'contradicts', 'experiment', 'fix', 'confidence'],
      },
    },
  },
  required: ['hypotheses'],
}

const COMMON = `You are investigating a rendering non-determinism in M/ARC (repo at /home/user/M-arc; read code with git; HT-7's branch head is ${args.head} — fetch with: cd /home/user/M-arc && git fetch -q origin pull/119/head && git show ${args.head}:<path>; main is origin/main). Do NOT build, do NOT run browsers or the gate (the container is small and busy); reason from code, the golden page and deep knowledge of Chromium internals. Read only what you need.

Key files: src/slices/howto/sections/Posture.tsx, src/slices/howto/css/posture.css, src/howto/generated/posture-barbell-back-squat.ts (the label "Bony bump"), src/slices/howto/zoom/ZoomHost.tsx, src/slices/howto/zoom/registry.ts, the HowToSheet and css under src/slices/howto/**, src/ui/styles.css and index.html (app font setup), src/ui/primitives.tsx (Sheet), the HT-7 block in scripts/screenshot-gate.mjs, golden B = tests/howto/golden/howto-layers.html (its openZoom is around lines 1660-1700), tools/plates/gen/zooms.mjs.

EVIDENCE (measured by the HT-7 builder, trust these numbers):
${EVIDENCE}

Hard constraints on any fix: L3 = 0 px against golden B at rest (pixels), golden B and the approved plates never change in the app, no check or tolerance is loosened, the zoom/scroll motion should stay as close to golden B as possible.

Give 1-3 hypotheses from YOUR lens only, ranked, each with a discriminating experiment the builder can run in its existing 30-open loop (6 browsers, 4 busy cores) and a fix. Be concrete and honest about uncertainty; say "unknown" rather than guess.`

const LENSES = [
  { key: 'svg-text-scaling', prompt: `LENS: Blink SVG text layout and font scaling. LayoutSVGInlineText computes a "scaled font" from the screen CTM (SVGLayoutSupport / CalculateScreenFontSizeScalingFactor); font-size x scale feeds FontDescription; letter-spacing (-0.135px here) scaled too; text-size-adjust (app 100% vs golden auto); subpixel/hinting decisions by size; LayoutNG SVG text (SVGTextLayoutAlgorithm). What per-tab, size-keyed state could make the same string shape to 25.2705 vs 25.3114 at the same CTM 1.91058, set on some opens and then held for the tab? Why would golden B never hit it? Consider that the zoom panel animates transform scale(.9)->none with Web Animations (compositor) and the app scrolls an overflow panel inside a dialog.` },
  { key: 'font-cache', prompt: `LENS: Blink/Skia font machinery: FontCache, FontPlatformData keyed by size (float vs rounded), SkFont subpixel/linear-metrics/hinting flags, HarfBuzz face/font caches and ShapeCache/ShapeResult caching per Font, FontFallbackList generations and invalidation on @font-face load events (document.fonts loadingdone), font-display swap vs block, unicode-range subsets, variable font (wght axis) instances, woff2-variations vs woff2 registration of the SAME file bytes. The app registers "Inter Variable" (woff2-variations, display swap, latin unicode-range) for its UI; golden B registers "Inter" (woff2, display block, full range) with the same file; the label resolves to Inter-Regular in all cases. Forcing golden's exact face on the crop text still gave 7/120 bad. What cache state is created per open, size-keyed, held per tab, and influenced by CPU load?` },
  { key: 'app-environment', prompt: `LENS: what differs between the app tab and the golden B page AROUND the label at the moment it is first laid out: ancestor transforms (sheet slide-in translateY, the zoom panel's scale animation, will-change), contain / content-visibility on sections, the dialog top layer, overflow clipping, zoom CSS, isolation, the order of DOM insertion (is the posture SVG inserted, laid out, measured while hidden? while display:none? inside a zx-page that is hidden?), lazy chunk loading timing (posture chunk and zoom-*.css chunk arriving mid-open under load), and the HT-6 host's open path (clearMistake, show, scrollToPanel, animate). Read ZoomHost.tsx and Posture.tsx and compare step by step with golden B's openZoom. Which difference can make Chromium shape the label in a state golden B never reaches, and why is it load-dependent?` },
  { key: 'measurement-and-repro', prompt: `LENS: devil's advocate on the harness and the reproduction. Read the HT-7 gate block in scripts/screenshot-gate.mjs (and any loop the builder describes). Check: how the label width is measured (getComputedTextLength / getBBox / pixels), deviceScaleFactor / isMobile emulation per context, whether 6 browsers share a GPU process or font cache, whether page.screenshot or CDP calls themselves can trigger re-raster/relayout at a different scale (e.g. screenshot with scale or clip, captureBeyondViewport), whether the golden B comparison runs in the same context/tab with a different DSF or viewport, and whether "bad" could be produced by a measurement taken while a compositor animation is still settling. Also propose the cleanest experiment that separates a real app rendering difference from a harness artifact. If the harness is at fault, the fix is to the HT-7 block's procedure WITHOUT reducing what it proves (state precisely why it is not a loosening).` },
]

phase('Hypothesize')
const results = await parallel(LENSES.map(l => () =>
  agent(`${COMMON}\n\n${l.prompt}`, { label: `lens:${l.key}`, phase: 'Hypothesize', schema: SCHEMA })
    .then(r => ({ lens: l.key, ...(r || { hypotheses: [] }) }))))

phase('Judge')
const all = results.filter(Boolean)
const judged = await agent(`${COMMON}\n\nYou are the JUDGE. Four independent investigators produced these hypotheses (JSON):\n${JSON.stringify(all, null, 1)}\n\nVerify the strongest claims against the code yourself (git show the files). Then produce, in plain precise English for a builder:\n1. A ranked list of the top 3 root-cause hypotheses, each with why it fits ALL the evidence and what it fails to explain.\n2. An ordered experiment plan of at most 4 experiments, cheapest and most discriminating first; for each: exact steps in the builder's 30-open loop, the measurement, and how each outcome changes the ranking. Stop conditions.\n3. The fix to ship for each top hypothesis, in the builder's files, that keeps L3 = 0 px at rest vs golden B, leaves golden B and the plates unchanged, loosens nothing, and keeps motion close to golden B. If no fix can satisfy all constraints, say so and name the least-bad option with its exact trade-off (for example a golden-B update that needs the owner's approval).\n4. Your overall confidence and what is still unknown.\nKeep it under 900 words.`, { label: 'judge', phase: 'Judge' })

return { lenses: all, judged }