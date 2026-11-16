// LR-23 (owner, 2026-09-30): the single definition of the no-contacts / no-sources patterns.
// Golden-B copy-lint.mjs holds a byte-identical copy; a parity test pins the two together.
// Literals copied byte for byte from docs/howto/LR23-PLAN.md amendment D-LR23-1. Never loosen or exempt without the supervisor.
export const CONTACT_RE = /(?<![\d.,])(?:999|111|911|112|000|988)(?![\d.,]*\d)|(?<![\d.,])\d{5,6}(?![\d.,]*\d)|\b116 ?123\b|\+\d[\d ().-]{6,}\d|\b\d{3,5}[ .-]\d{3}[ .-]\d{3,4}\b|\b\d{2} \d{2} \d{2}\b|\b(?:nine|one|zero)(?:[ -](?:nine|one|zero)){2}\b|emergency (?:services?|numbers?|departments?|rooms?|lines?|contacts?)|ambulance|\bA&E\b|urgent (?:care|treatment)|hotline|helpline|crisis (?:line|text)|samaritans|\blifeline\b|\btext \w+ to\b|\btel:|mailto:|[\w.+-]+@[\w-]+\.[a-z]{2,}|https?:\/\/|\bwww\./i;
export const SOURCE_RE = /\bsources?\b|\bcitations?\b|\bcited\b|\bet al\b|\bstud(?:y|ies)\b|\bmeta-analys[ie]s\b|\bpubmed\b|\bdoi\b|\bNHS\b|\bACSM\b|\bCoaching consensus\b|\bWeak for this use\b|\([A-Za-z][^()]* (?:19|20)\d{2}[a-z]?\)|\[[^\]]*(?:19|20)\d{2}[^\]]*\]|\bresearch(?:ers?)?\b|\btrials?\b|\bevidence\b/i;
// Case-sensitive on purpose: under /i, WHO would match "who".
export const SOURCE_CS_RE = /\b[A-Z][a-z]+(?: et al\.?)?,? (?:19|20)\d{2}[a-z]?\b|\b(?:NSCA|ACE|ISSN|WHO)\b|Barbell Logic|Human Kinetics/;
export const SAFETY_LINE_RE = /\b(?:call|phone|dial|ring|GP|clinic|hospital)\b/i;
