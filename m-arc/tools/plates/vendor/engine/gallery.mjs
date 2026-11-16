// Engine self-test: every equipment primitive with a posed body, to check scale and contacts.
// NOT exercise cards (no cues, no research). Run: node engine/gallery.mjs -> out/_gallery.png + contact report.
import { createRequire } from 'node:module';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderPlate, PLATE_CSS } from './plate.mjs';
import { rootOnSeat, landmarksOf } from './body.mjs';
import { legPressFace, latBarPoint } from './equipment.mjs';
import { allThemesCss } from './themes.mjs';
import { readFileSync } from 'node:fs';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..');
const H = 1.75;

// 1. Pull-up, side: hands on a 32 mm bar at 2.25 m
const BAR = [0, 2.25, 0.02];
const hang = dy => ({ root: { at: [0, 2.25 - 0.66 - 0.4725 - 0.03 + dy, -0.04] }, hip: 12, knee: 35, ankle: -20,
  reach: { l: { at: [0.3, BAR[1], BAR[2]], pole: [0.3, -0.4, 0.6] }, r: { at: [-0.3, BAR[1], BAR[2]], pole: [-0.3, -0.4, 0.6] } } });
const pullup = { id: 'g1', name: 'pull-up bar', view: 'side', camera: { fit: true }, poses: { start: hang(0), end: hang(0.42) }, ghosts: { count: 2, parts: ['arm.r'] },
  equipment: [{ type: 'floor', from: -0.6, to: 0.6 }, { type: 'pullupBar', at: BAR }], trace: { point: 'hip.r' } };

// 2. 45-degree leg press, side: seat, back pad, feet on the plate
const LP = { rail: { from: [0, 0.30, 0.25], angle: 45, length: 1.45 }, offset: 0.22, seat: { at: [0, 0.42, -0.12], angle: 12, len: 0.45 } };
const SEAT = [0, 0.43, -0.12], TILT = -38;
const lpPose = travel => { const fc = legPressFace(LP, travel); return { root: { at: rootOnSeat(SEAT, TILT), tilt: TILT }, trunk: 0, neck: 20,
  shoulder: { flex: 30 }, elbow: 40,
  plant: { l: { at: [0.12, ...fc.at.slice(1)], normal: fc.normal, toe: fc.up }, r: { at: [-0.12, ...fc.at.slice(1)], normal: fc.normal, toe: fc.up } } }; };
const lmLP = landmarksOf(lpPose(0.25));
const legpress = { id: 'g2', name: 'leg press', view: 'side', camera: { fit: true }, poses: { start: lpPose(0.25), end: lpPose(0.6) }, ghosts: { count: 2, parts: ['leg.r'] },
  equipment: [{ type: 'floor', from: -0.8, to: 1.6 }, { type: 'backPad', surface: [lmLP.backUpper, lmLP.buttock], len: 0.75, below: 0.1 },
    (lm, ctx) => ({ type: 'legPress45', ...LP, travel: ctx.pose === 'start' ? 0.25 : ctx.pose === 'end' ? 0.6 : (legPressFace(LP, 0).at && (0.25 + 0.35 * (+ctx.pose.replace('ghost', '') + 1) / 3)) })],
  trace: { point: 'knee.r' } };

// 3. Chest press, side: seat, back pad, handle on a pivot arm
const CP_SEAT = [0, 0.46, 0];
const cpPose = z => ({ root: { at: rootOnSeat(CP_SEAT, -8), tilt: -8 }, hip: 95, knee: 95, ankle: 5,
  reach: { l: { at: [0.2, 1.12, z], pole: [0.6, -0.6, -0.5] }, r: { at: [-0.2, 1.12, z], pole: [-0.6, -0.6, -0.5] } } });
const lmCP = landmarksOf(cpPose(0.2));
const PIVOT = [0, 1.85, -0.25];
const chest = { id: 'g3', name: 'chest press', view: 'side', camera: { fit: true }, poses: { start: cpPose(0.2), end: cpPose(0.55) }, ghosts: { count: 2, parts: ['arm.r'] },
  equipment: [{ type: 'floor', from: -0.6, to: 0.9 }, { type: 'seat', at: CP_SEAT }, { type: 'backPad', surface: [lmCP.backUpper, lmCP.buttock], len: 0.7, below: 0.08 },
    lm => ({ type: 'chestPress', pivot: PIVOT, handle: lm['grip.r'], frameTo: [0, 0, -0.3] })], trace: { point: 'grip.r' } };

// 4. Lat pulldown, front: seat, knee pads, wide bar and cable
const LS = [0, 0.48, 0];
const lpd = y => { const bar = { at: [0, y, 0.05] }; return { root: { at: rootOnSeat(LS, 0) }, hip: { flex: 90, abd: 8 }, knee: 90,
  reach: { l: { at: latBarPoint(bar, 0.42), pole: [1, -0.3, -0.3] }, r: { at: latBarPoint(bar, -0.42), pole: [-1, -0.3, -0.3] } } }; };
const pulldown = { id: 'g4', name: 'lat pulldown', view: 'front', camera: { fit: true }, poses: { start: lpd(1.62), end: lpd(1.05) }, ghosts: { count: 2, parts: ['arm.r'] },
  equipment: [{ type: 'floor', from: -0.7, to: 0.7 }, { type: 'seat', at: LS }, lm => [{ type: 'kneePad', at: lm['thighTop.l'] }, { type: 'kneePad', at: lm['thighTop.r'] }],
    (lm, ctx) => ({ type: 'latBar', at: [0, (lm['grip.l'][1] + lm['grip.r'][1]) / 2 + 0.0, 0.05], cableTo: [0, 2.3, 0.05] })], trace: { point: 'grip.r' } };

// 5. Barbell + rack, front and side
const bbPose = { root: { at: [0, 0.53 * H - 0.004, 0] }, plant: { l: { at: [0.13, 0, 0.077] }, r: { at: [-0.13, 0, 0.077] } },
  reach: { l: { at: [0.25, 0.74, 0.08], pole: [0.2, 0, -1] }, r: { at: [-0.25, 0.74, 0.08], pole: [-0.2, 0, -1] } } };
const bbF = { id: 'g5', name: 'barbell front', view: 'front', camera: { fit: true }, poses: { start: bbPose, end: bbPose }, ghosts: { count: 0 },
  equipment: [{ type: 'floor', from: -1.2, to: 1.2 }, { type: 'rackUpright', at: [0, 0, -0.3], hook: 1.3, span: 1.22 }, lm => ({ type: 'barbell', at: [0, lm['grip.l'][1], lm['grip.l'][2]] })] };
const bbS = { ...bbF, id: 'g6', name: 'barbell side + dumbbell side-on', view: 'side',
  equipment: [{ type: 'floor', from: -0.5, to: 0.8 }, { type: 'rackUpright', at: [0, 0, -0.35], hook: 1.3 }, lm => ({ type: 'barbell', at: lm['grip.r'] }), { type: 'dumbbell', at: [0, 0.12, 0.6], axis: [0, 0, 1] }, { type: 'bench', at: [0, 0.43, 0.6], len: 0.5, axis: 'x' }] };

const specs = [pullup, legpress, chest, pulldown, bbF, bbS];
const FONT = `data:font/woff2;base64,${readFileSync(join(here, 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOK = readFileSync(join(here, 'tokens.css'), 'utf8');
const report = [];
const cells = specs.map(s => { const p = renderPlate(s, { id: s.id }); report.push({ id: s.name, contacts: p.report.contacts, camera: p.report.camera, issues: p.report.issues.filter(i => !i.startsWith('figure')) });
  return `<section><b>${s.name}</b><figure class="plate">${p.svg}${p.overlay}</figure></section>`; }).join('');
const html = `<!doctype html><html data-theme="silent-black"><head><meta charset="utf-8"><style>@font-face{font-family:'Inter Variable';src:url('${FONT}') format('woff2-variations');font-weight:100 900}
${TOK}${allThemesCss()}body{margin:0;background:var(--surface-2);color:var(--text);font-family:var(--font);width:1170px}figure{margin:0}
.g{display:grid;grid-template-columns:repeat(3,390px)}section{padding:12px 16px}b{display:block;font-size:12px;margin-bottom:6px;color:var(--text-2)}${PLATE_CSS}</style></head><body><div class="g">${cells}</div></body></html>`;
const tmp = mkdtempSync(join(root, 'out', '.gallery-')), file = join(tmp, 'g.html');
writeFileSync(file, html);
const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport: { width: 1170, height: 800 }, deviceScaleFactor: 1.5 });
await pg.goto(pathToFileURL(file).href); await pg.evaluate(() => document.fonts.ready);
await pg.screenshot({ path: join(root, 'out', '_gallery.png'), fullPage: true });
await b.close(); rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify(report, null, 1));
