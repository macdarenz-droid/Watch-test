// HT4b-A5 C19 bad fixtures on one built sheet's copy fields (a golden-B *.howto.mjs module). Each returns a shallow
// copy with one field changed; the sheet's functions are kept by reference.
type Row = Record<string, unknown>;
type Howto = { setup: Row[]; risks: Row[]; mistakes: Row[]; feel: { rows: Row[] } };
export type Sheet = { default: Howto };

const at = (list: Row[], i: number, patch: Row) => list.map((x, j) => (j === i ? { ...x, ...patch } : x));
const withSheet = <M extends Sheet>(M: M, f: (H: Howto) => Howto): M => ({ ...M, default: f(M.default) });
const setupLine = (text: string) => <M extends Sheet>(M: M) => withSheet(M, H => ({ ...H, setup: at(H.setup, 0, { text }) }));

/** M4: "(Muyor 2023)" in a feel fix. */
export const m4 = <M extends Sheet>(M: M) =>
  withSheet(M, H => ({ ...H, feel: { ...H.feel, rows: at(H.feel.rows, 0, { fix: 'Check the seat height first (Muyor 2023).' }) } }));
/** M5: "+44 20 7946 0000" in a risk line. */
export const m5 = <M extends Sheet>(M: M) => withSheet(M, H => ({ ...H, risks: at(H.risks, 0, { text: 'Wrist pain? Ring +44 20 7946 0000.' }) }));
/** M6: "www.nhs.uk" in a setup line. */
export const m6 = setupLine('Read www.nhs.uk before you set the seat.');
/** M9: "help@example.org" in a mistake fix. */
export const m9 = <M extends Sheet>(M: M) => withSheet(M, H => ({ ...H, mistakes: at(H.mistakes, 0, { fix: 'Email help@example.org to ask.' }) }));
/** D-LR23-1 extras, each in a setup line. */
export const weiss1995 = setupLine('Keep the wrist straight, as Weiss 1995 found.');
export const nsca = setupLine('NSCA teaches a mid-chest handle height.');
export const textHome = setupLine('Feeling low? text HOME to 741741.');
export const ring131114 = setupLine('Hurt? ring 13 11 14.');
/** LR23-DOCS review: a registry source's first-author surname (no year), caught only by the data-driven name check. */
export const registrySurname = setupLine('Set the seat the way Calatayud does.');
