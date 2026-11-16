/** The modes a turn can run in. Their addenda are generated from the app and travel inside the brief, never in `system`. */
export type Mode = 'chat' | 'plan' | 'live' | 'brief' | 'moment' | 'summarize';
export const MODES: Mode[] = ['chat', 'plan', 'live', 'brief', 'moment', 'summarize'];
