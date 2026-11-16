// HT-4 (HT4-A3): C8, evidence. A rule without a Claim, a claim without a source (unless it names why in `note`), a
// source missing from the registry, a claim whose only sources are `unreachable`, and red-flag wording outside
// `redFlag` (a row's means/fix, grip line or caption never carries its own red-flag wording).
import type { Claim, HowToContent, Source } from '../../../src/howto/content-types';

const RED_FLAG_WORDING = /get it checked|see a doctor|\bGP\b|\bphysio\b|\bnumb\b|tingl|swell/i;

function checkClaim(field: string, claim: Claim | undefined, sources: Readonly<Record<string, Source>>): string[] {
  const bad: string[] = [];
  if (!claim || !Array.isArray(claim.sources)) { bad.push(`C8: ${field}: no Claim`); return bad; }
  if (claim.sources.length === 0 && !claim.note) bad.push(`C8: ${field}: a claim with no sources needs a note`);
  for (const s of claim.sources) if (!sources[s]) bad.push(`C8: ${field}: source "${s}" is missing from the registry`);
  if (claim.sources.length > 0 && claim.sources.every(s => sources[s]?.access === 'unreachable')) bad.push(`C8: ${field}: every source is unreachable`);
  return bad;
}

function checkWording(field: string, text: string): string[] {
  return RED_FLAG_WORDING.test(text) ? [`C8: ${field}: carries its own red-flag wording instead of redFlag`] : [];
}

export function checkC8(content: HowToContent, sources: Readonly<Record<string, Source>>): string[] {
  const bad: string[] = [];
  const h = content.handling;
  if (h.archetype !== 'none') {
    bad.push(...checkClaim('handling.thumb.claim', h.thumb.claim, sources));
    bad.push(...checkClaim('handling.wrist.claim', h.wrist.claim, sources));
    if (h.width) bad.push(...checkClaim('handling.width.claim', h.width.claim, sources));
    if (h.handleChoice) bad.push(...checkClaim('handling.handleChoice.claim', h.handleChoice.claim, sources));
    bad.push(...checkWording('handling.gripLine', h.gripLine));
  }
  content.setup.forEach((s, i) => bad.push(...checkClaim(`setup[${i}].claim`, s.claim, sources)));
  content.posture.forEach((p, i) => bad.push(...checkClaim(`posture[${i}] (${p.key}).claim`, p.claim, sources)));
  bad.push(...checkClaim('feel.claim', content.feel.claim, sources));
  content.feel.rows.forEach((r, i) => {
    bad.push(...checkClaim(`feel.rows[${i}] (${r.key}).claim`, r.claim, sources));
    bad.push(...checkWording(`feel.rows[${i}] (${r.key}).means`, r.means));
    bad.push(...checkWording(`feel.rows[${i}] (${r.key}).fix`, r.fix));
  });
  content.mistakes.forEach((m, i) => {
    bad.push(...checkClaim(`mistakes[${i}] (${m.key}).claim`, m.claim, sources));
    bad.push(...checkWording(`mistakes[${i}] (${m.key}).fix`, m.fix));
  });
  content.risks.forEach((r, i) => bad.push(...checkClaim(`risks[${i}] (${r.key}).claim`, r.claim, sources)));
  content.zooms.forEach((z, i) => {
    bad.push(...checkWording(`zooms[${i}] (${z.key}).caption.right`, z.caption.right));
    bad.push(...checkWording(`zooms[${i}] (${z.key}).caption.wrong`, z.caption.wrong));
  });

  return bad;
}
