# How-to concept 3: 3D figure

The third take on the How-to sheet. Version 1 was the comic-figure form guide (paused 2026-09-29). Version 2 is the Technical Plates the app ships now (`src/slices/howto`). This one shows the Dumbbell Lateral Raise on a rigged 3D figure made with Meshy. It is a design concept and is not wired into the app.

## Files

| File | What |
|---|---|
| `index.html` | The sheet: Movement, Grip, Posture (Form and Mistake), Feel, play, replay, 0.5x/1x, tempo scrubber. Silent Black, or Paper in light mode. |
| `figure.glb` | Meshy text to 3D, auto-rigged (24 bones, no finger bones), 71k triangles, 1.8 MB. |
| `hand.glb` | Meshy text to 3D: a fist on a dumbbell handle, for the Grip close-up. 54k triangles, 1.2 MB. |

To view it, serve the folder (for example `npx serve docs/design/howto-3d`) and open the page. Opening the file directly does not load the models, because browsers block `fetch` on `file://`. three.js 0.169.0 loads from jsDelivr.

## How it works

- Timing and copy come from the app's lateral raise data: lift 1 s, hold 0.5 s, lower 2 s, rest 0.5 s (`src/howto/generated/ht-dumbbell-lateral-raise.ts`, `feel-lateral-raise.ts`).
- The page poses the arm bones itself, with minimum-jerk easing. Shoulder abduction goes from 9° to 88°, the elbows bend about 20° and the hands sit slightly forward. The mistake adds a 24° shrug, a 6° lean back and a 96° top.
- The side delts and upper traps are tinted per vertex, measured in the bind pose from the shoulder and neck bones. Skinning then carries the tint with the motion.
- Meshy's texture is turned grey and tinted with the theme's figure colour, so the figure matches every theme.

## Meshy trail (2026-10-02)

| Step | Task | Credits |
|---|---|---|
| Figure preview, rejected (came back in a flexing pose that can't be rigged) | text-to-3d `01a0fc38-cbfa-7132-b3cb-5db28df08cf7` | 20 |
| Figure preview, A-pose | text-to-3d `01a0fc3a-3667-7505-8382-733dec91d0be` | 20 |
| Figure texture | text-to-3d refine `01a0fc3b-51ae-709d-bd9a-93d94dbfe78c` | 10 |
| Reduced locally from 418k to 71k triangles, under Meshy's 300k rigging limit | gltf-transform `simplify` | 0 |
| Auto-rig | rigging `01a0fc3c-9453-70e7-948c-deb4e0fb8fe6` | 5 |
| Hand on dumbbell | text-to-3d `01a0fc3d-6350-733b-bb7e-2a76036ffbfb` | 20 |
| Hand texture | text-to-3d refine `01a0fc3e-755c-7153-90c9-c62c23943731` | 10 |
| **Total** | | **85** |

Both models were packed with `gltf-transform optimize --compress quantize --texture-compress webp --texture-size 1024`. That uses no Draco or meshopt, so the page needs no WASM decoder.

## Limits and risks

- The rig has no finger bones, so in the full-body views the dumbbell rests in an open hand. Grip uses the separate hand model. Fixing this means either a rig with fingers or a fist baked into the mesh.
- Bringing this into the app would add three.js to the bundle (the full library is about 170 KB gzipped; tree-shaking makes it smaller) and about 3 MB of models. It would also need a WebGL fallback, which could be the Technical Plate.
- Each new exercise needs its own pose data. The figure and rig can be reused.
- Check Meshy's terms for your plan before you ship generated models in the Play Store app.
