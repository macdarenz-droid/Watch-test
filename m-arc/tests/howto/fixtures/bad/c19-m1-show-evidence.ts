// HT4b-A5 C19 bad fixture M1: the shared module exports SHOW_EVIDENCE = true.
export const mutate = <T extends object>(shared: T) => ({ ...shared, SHOW_EVIDENCE: true });
