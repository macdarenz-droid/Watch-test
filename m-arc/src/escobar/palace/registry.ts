/**
 * The palace (§7.1): every screen, panel, setting and key action in the app, with where
 * it is, what it does and the element to spotlight. Pure data plus lookup, so it works
 * offline (`find_in_app`) and travels to the Worker as the manifest (§7.3).
 */
import type { PanelId, Tab } from '@/app/router';
import type { MethodId } from '../knowledge/methodIds';

export interface PalaceTarget {
  tab: Tab;
  panel?: PanelId;
  /** Panel params, or a tab's view (`view` for Body, `seg` for History). */
  params?: Record<string, string>;
  /** The `data-palace` value to spotlight. */
  anchor?: string;
}

export interface PalaceEntry {
  id: string;
  title: string;
  where: string;
  what: string;
  how?: string[];
  keywords: string[];
  target: PalaceTarget;
  methods?: MethodId[];
}

const e = (id: string, title: string, where: string, what: string, keywords: string[], target: PalaceTarget, extra: { how?: string[]; methods?: MethodId[] } = {}): PalaceEntry =>
  ({ id, title, where, what, keywords, target: { anchor: id, ...target }, ...extra });

const START = { anchor: 'train.start' };

export const PALACE: PalaceEntry[] = [
  // Today
  e('today.header', 'Today', 'Today tab, top', "Today's date and greeting, with your training streak.", ['today', 'home', 'greeting', 'streak', 'date'], { tab: 'today' }),
  e('today.session-card', "Today's session", 'Today tab → first card', "What's scheduled today, a session in progress, or what you've done today, with a Start button.", ['today', 'scheduled', 'start', 'session', 'workout', 'continue'], { tab: 'today' }, { how: ['Tap Start to begin the scheduled split'] }),
  e('today.readiness', 'Readiness', 'Today tab → Readiness', "Today's readiness band (green, amber, red), its score and the reasons behind it.", ['readiness', 'ready', 'amber', 'red', 'green', 'score', 'fatigue', 'sleep', 'resting heart rate'], { tab: 'today' }, { methods: ['readiness'] }),
  e('today.week', 'Current week', 'Today tab → Current week', 'Workouts, sets and records so far this week, with a one-line grade.', ['week', 'weekly', 'workouts', 'sets', 'records', 'grade'], { tab: 'today' }, { methods: ['records'] }),
  e('today.recovery', 'Recovery snapshot', 'Today tab → Recovery', 'A small muscle map and the muscles still recovering, with hours left.', ['recovery', 'recovering', 'muscles', 'sore', 'hours left'], { tab: 'today' }, { methods: ['recovery'] }),
  e('today.coach', 'Top coach note', 'Today tab → Coach', "The coach's most important note right now.", ['coach', 'insight', 'note', 'tip', 'advice'], { tab: 'today' }),
  e('today.spark', 'Daily spark', 'Today tab → Daily spark', 'A short daily quote. It can be turned off in Settings.', ['quote', 'spark', 'motivation'], { tab: 'today' }),
  e('today.settings', 'Settings button', 'Today tab → gear icon, top right', 'Opens Settings.', ['settings', 'gear', 'preferences', 'options'], { tab: 'today' }),

  // Train
  e('train.workouts', 'Workouts', 'Train tab', 'Your splits, the targets for each exercise, and Start.', ['train', 'workouts', 'splits', 'program', 'programme', 'routine'], { tab: 'train' }),
  e('train.gym-chip', 'Gym', 'Train tab → "At: …" chip', 'Which gym you are at. Each gym remembers the unit of every rack, stack and bar.', ['gym', 'location', 'home gym', 'travel', 'kg', 'lb', 'pounds', 'units'], { tab: 'train' }, { how: ['Tap the "At:" chip', 'Pick a gym, or add one and answer "Mostly kg or lb here?"'] }),
  e('train.split', 'Split and targets', 'Train tab → the selected split', "Each exercise's next target load and reps, and why.", ['split', 'targets', 'next', 'target', 'progression', 'load', 'reps'], { tab: 'train' }, { methods: ['progression', 'plateau'] }),
  e('train.start', 'Start a session', 'Train tab → Start', 'Starts the live session: a quick check-in, a short brief, then the timer.', ['start', 'begin', 'workout', 'session', 'live'], { tab: 'train' }, { how: ['Pick a split', 'Tap Start', 'Answer the check-in or skip it', 'Tap Start again'] }),
  e('train.log-past', 'Log a past session', 'Train tab → Log a past session', 'Adds a session you did without the timer, with its day and start time.', ['log', 'past', 'forgot', 'retro', 'add session', 'backfill'], { tab: 'train' }),
  e('train.new-split', 'New split', 'Train tab → + Split', 'Creates a new split, or starts from the Push / Pull / Legs template.', ['new split', 'create', 'template', 'push pull legs', 'ppl'], { tab: 'train' }),
  e('train.edit-split', 'Edit a split', 'Train tab → pencil icon on the split', 'Rename, reorder, add or remove exercises, change sets and focus muscles, or delete the split.', ['edit', 'rename', 'reorder', 'add exercise', 'remove exercise', 'sets', 'focus', 'delete split'], { tab: 'train' }),
  e('train.effort', 'Rating effort', 'Train → during a session → E / I / M on each set', 'Easy means 3+ reps left, Ideal 1–3 left, Max nothing left. Effort drives the next target.', ['effort', 'rir', 'rpe', 'easy', 'ideal', 'max', 'rate'], { tab: 'train', ...START }, { methods: ['effort_calibration'], how: ['Start a session', 'Tap E, I or M after each set'] }),
  e('train.warmup', 'Warm-up sets', 'Train → during a session → Show warm-up', 'A 50/70/85% ramp of your trend strength before main lifts.', ['warm-up', 'warmup', 'ramp'], { tab: 'train', ...START }, { methods: ['warmup'], how: ['Start a session', 'Open a main lift', 'Tap Show warm-up'] }),
  e('train.substitute', 'Swap an exercise', 'Train → during a session → ⋯ → Substitute exercise', 'Swaps in an exercise for the same main muscle, for today or for good.', ['swap', 'substitute', 'replace', 'alternative'], { tab: 'train', ...START }, { how: ['Start a session', 'Tap ⋯ on the exercise', 'Tap Substitute exercise'] }),
  e('train.add-exercise', 'Add an exercise mid-session', 'Train → during a session → Add exercise to this session', 'Adds any library or custom exercise to the session in progress.', ['add exercise', 'extra', 'custom exercise'], { tab: 'train', ...START }),
  e('train.custom-exercise', 'Custom exercise', 'Train → edit a split → Add exercise → New exercise', 'Creates your own exercise with its muscles, equipment and type.', ['custom', 'new exercise', 'create exercise', 'my exercise'], { tab: 'train', anchor: 'train.edit-split' }, { how: ['Tap the pencil on a split', 'Tap Add exercise', 'Tap New exercise'] }),
  e('train.rest', 'Rest timer', 'Train → during a session → rest banner', 'Starts after each set. Adjust by 15 s or skip. Can end by heart rate with a watch.', ['rest', 'timer', 'rest timer', 'break'], { tab: 'train', ...START }, { methods: ['hr_rest'] }),
  e('train.autoregulation', 'In-session adjustment', 'Train → during a session → line under the first set', 'After your first set of a main lift, suggests more or less load for the rest.', ['autoregulation', 'adjust', 'too heavy', 'too light', 'next set'], { tab: 'train', ...START }, { methods: ['progression'] }),
  e('train.unit-pill', 'Unit pill', 'Train → during a session → kg / lb on each weight box', 'Flips the entry unit for this exercise at this gym. Long-press for the whole equipment group.', ['unit', 'kg', 'lb', 'pounds', 'kilos', 'dumbbells in pounds', 'convert'], { tab: 'train', ...START }),
  e('train.plate-math', 'Plate math', 'Train → during a session → tap a barbell target', 'Shows the plates per side for the target, in the plates’ own unit.', ['plates', 'plate math', 'per side', 'bar', 'barbell', 'load the bar'], { tab: 'train', ...START }),
  e('train.finish', 'Finish a session', 'Train → during a session → Finish', 'Saves the session, asks when you trained if it looks logged later, and shows the debrief.', ['finish', 'save', 'end', 'done', 'debrief', 'summary'], { tab: 'train', ...START }, { methods: ['fidelity', 'records'] }),
  e('train.share', 'Share a workout', 'Train → after Finish → Share workout', 'Right after a session, makes a share card for it: a poster, a stats sticker or a gym receipt, to save or share.', ['share', 'share workout', 'post workout', 'story', 'card', 'brag'], { tab: 'train', ...START }),

  // History
  e('history.calendar', 'Training calendar', 'History tab → Log', 'A month calendar with trained days marked. Tap a day to see its sessions.', ['calendar', 'history', 'month', 'days', 'log'], { tab: 'history', params: { seg: 'log' } }),
  e('history.recent', 'Recent sessions', 'History tab → Log → Recent', 'Your last 30 sessions. Tap one for its sets.', ['recent', 'sessions', 'past', 'history'], { tab: 'history', params: { seg: 'log' } }),
  e('history.session', 'A session', 'History tab → Log → Edit on a session', 'Every set of one session, editable, with delete.', ['session', 'edit session', 'delete session', 'fix', 'mistake', 'heart', 'calories'], { tab: 'history', panel: 'session' }, { methods: ['hr_zones', 'energy', 'fidelity'] }),
  e('history.week', 'Current week', 'History tab → Stats', 'Workouts, sets, volume and effective sets per muscle, against last week.', ['stats', 'volume', 'tonnage', 'week', 'effective sets'], { tab: 'history', params: { seg: 'stats' } }, { methods: ['volume_bands'] }),
  e('history.exercise-stats', 'Exercise progress', 'History tab → Stats → Exercise progress', 'The trend of one exercise: strength estimate, top load, recent sessions.', ['progress', 'trend', 'chart', 'exercise', 'e1rm', 'one rep max', 'strength', 'stall', 'plateau'], { tab: 'history', panel: 'exercise-stats' }, { methods: ['e1rm', 'plateau'] }),
  e('history.records', 'Records', 'History tab → Stats → Records', 'Your personal records: heaviest load, best reps, best estimated max, volume.', ['records', 'pr', 'personal best', 'pb'], { tab: 'history', params: { seg: 'stats' } }, { methods: ['records'] }),
  e('history.share', 'Share your stats', 'History tab → Stats → share icon, top right', 'Makes a picture of your week, month, 3 months, year or all time to save or share: a poster, a stats sticker with your muscle map, or a gym receipt.', ['share', 'share card', 'story', 'instagram', 'poster', 'sticker', 'receipt', 'picture', 'image', 'post'], { tab: 'history', params: { seg: 'stats' } }),
  e('history.session-share', 'Share a session', 'History tab → Log → share icon on a session', 'Makes a share card for that one workout, with an optional photo, as a 9:16 story or a 1:1 square.', ['share session', 'share workout', 'share card', 'story', 'photo'], { tab: 'history', params: { seg: 'log' } }),

  // Body
  e('body.map', 'Muscle map', 'Body tab', 'A front/back map shaded by recovery, this week’s sets, or training level. Tap a muscle.', ['body', 'muscle map', 'map', 'muscles'], { tab: 'body', params: { view: 'recovery' } }, { methods: ['recovery'] }),
  e('body.recovering', 'Recovering muscles', 'Body tab → Recovery → Recovering', 'Muscles still recovering, with percent and hours until ready.', ['recovering', 'recovery', 'sore', 'fatigue', 'ready in'], { tab: 'body', params: { view: 'recovery' } }, { methods: ['recovery'] }),
  e('body.ready', 'Ready for hard work', 'Body tab → Recovery → Ready for hard work', 'Muscles at 90% or more, not yet fully recovered.', ['ready', 'hard work', 'recovered'], { tab: 'body', params: { view: 'recovery' } }, { methods: ['recovery'] }),
  e('body.full', 'Recovered muscles', 'Body tab → Recovery → Recovered muscles', 'Muscles at 97% or more.', ['fully recovered', 'fresh'], { tab: 'body', params: { view: 'recovery' } }, { methods: ['recovery'] }),
  e('body.week-volume', 'Effective sets', 'Body tab → This week', "Each muscle's effective sets this week against its volume band.", ['volume', 'sets per muscle', 'effective sets', 'band', 'mev', 'mrv', 'too much', 'too little'], { tab: 'body', params: { view: 'week' } }, { methods: ['volume_bands', 'balance'] }),
  e('body.levels', 'Training levels', 'Body tab → Levels', 'A relative level per muscle from how much you have trained it.', ['levels', 'level', 'beginner', 'advanced', 'experience'], { tab: 'body', params: { view: 'levels' } }, { methods: ['volume_bands'] }),
  e('body.muscle', 'A muscle', 'Body tab → tap a muscle', "One muscle: recovery, when it's ready, what drove it, your exercises for it, and Mark as fresh.", ['muscle', 'quads', 'chest', 'back', 'mark as fresh', 'details'], { tab: 'body', panel: 'muscle', params: { muscle: 'chest' } }, { methods: ['recovery'], how: ['Tap a muscle on the map', 'Tap Mark as fresh if it feels recovered'] }),
  e('body.bodyfat', 'Body fat estimate', 'Body tab → Body fat estimate', 'A tape-measure estimate (US Navy method). Track the trend, not one reading.', ['body fat', 'bodyfat', 'navy', 'tape', 'waist', 'neck'], { tab: 'body', params: { view: 'recovery' } }, { how: ['Tap Measure', 'Enter height, neck, waist (and hip)', 'Save reading'] }),

  // Coach
  e('coach.header', 'Escobar', 'Escobar tab', 'Escobar’s hall: ask a question, today’s brief, notes, plans, goal and schedule.', ['coach', 'escobar', 'advice', 'what next'], { tab: 'coach' }),
  e('coach.week-line', 'Week summary', 'Escobar tab → top card', 'This week’s workouts, sets and records in one sentence.', ['week', 'summary', 'one line'], { tab: 'coach' }),
  e('coach.insights', 'Escobar’s notes', 'Escobar tab → Escobar’s notes', 'Every current coach insight: recovery, progress, readiness, balance, focus. Helpful hides a note until tomorrow, Not now for 7 days, each with Undo. Hidden notes sit behind one row under the list, with Show again. A lighter week offer appears above when it’s due.', ['insights', 'notes', 'deload', 'lighter week', 'snooze', 'not now', 'helpful', 'balance', 'hidden notes', 'show again'], { tab: 'coach' }, { methods: ['deload_trigger', 'balance', 'plateau'] }),
  e('coach.goal', 'Training goal', 'Escobar tab → Training goal', 'Your goal and its rep ranges.', ['goal', 'strength', 'hypertrophy', 'lean', 'muscle', 'fat loss', 'rep range'], { tab: 'coach' }, { methods: ['progression'] }),
  e('panel.goal', 'Change training goal', 'Escobar tab → Training goal → Change', 'Pick a goal; it offers the goal’s rest time and templates.', ['change goal', 'switch goal', 'new goal'], { tab: 'coach', panel: 'goal' }),
  e('coach.schedule', 'Weekly schedule', 'Escobar tab → Weekly schedule', 'Which split on which weekday. Reminders and streaks follow it.', ['schedule', 'weekly', 'days', 'plan', 'rest days'], { tab: 'coach' }),
  e('panel.schedule', 'Edit the schedule', 'Escobar tab → Weekly schedule → Edit', 'Assign a split or rest to each day, or quick-arrange 2–6 days.', ['edit schedule', 'move day', 'change days', 'arrange'], { tab: 'coach', panel: 'schedule' }),
  e('panel.weekly-review', 'Weekly review', 'Escobar tab → Weekly review card', 'What stood out this week, good or bad. Shown after 5+ training days in a week.', ['weekly review', 'review', 'recap', 'week summary'], { tab: 'coach', panel: 'weekly-review' }, { methods: ['weekly_review'] }),
  e('coach.tip', 'Coach tip', 'Escobar tab → Coach tip / Coach fact', 'A technique cue or fact about your last exercise. Tap Another for more.', ['tip', 'cue', 'technique', 'form', 'learn'], { tab: 'coach' }),
  e('coach.sees', 'Coach data', 'Escobar tab → Coach data', 'What data the coach has.', ['data', 'what coach sees', 'unlock', 'privacy'], { tab: 'coach' }, { methods: ['fidelity'] }),
  e('panel.checkin', 'Daily check-in', 'Train → Start → Quick check-in (or from here)', 'Sleep quality, mood and soreness for today. Feeds readiness.', ['check-in', 'checkin', 'sleep', 'mood', 'soreness', 'sore'], { tab: 'today', panel: 'checkin' }, { methods: ['readiness'] }),
  e('panel.memory', 'Memory', 'Escobar tab → Memory', 'Everything Escobar remembers about you, editable.', ['memory', 'remember', 'forget', 'what you know'], { tab: 'coach', panel: 'memory' }),

  // Settings
  e('settings.theme', 'Theme', 'Settings → Theme', 'Five colour themes.', ['theme', 'colour', 'color', 'dark', 'light', 'appearance'], { tab: 'today', panel: 'settings' }),
  e('settings.weight-unit', 'Show weights in', 'Settings → Training → Show weights in', 'The unit for history, charts and records. Each machine keeps its own entry unit.', ['unit', 'kg', 'lb', 'pounds', 'display unit'], { tab: 'today', panel: 'settings' }),
  e('settings.gyms', 'Gyms and equipment', 'Settings → Training → Gyms and equipment', 'Each gym’s saved units, ladders and plates, editable and resettable.', ['gyms', 'equipment', 'plates', 'dumbbells', 'stack', 'ladder'], { tab: 'today', panel: 'settings' }),
  e('settings.auto-rest', 'Automatic rest timer', 'Settings → Training → Start rest after each set', 'Starts the rest timer when you log a set.', ['auto rest', 'rest timer', 'automatic'], { tab: 'today', panel: 'settings' }),
  e('settings.rest-length', 'Rest length', 'Settings → Training → Rest length', 'Default rest between sets, in 15-second steps.', ['rest length', 'rest time', 'seconds'], { tab: 'today', panel: 'settings' }),
  e('settings.spark', 'Daily quote', 'Settings → Training → Daily quote on Today', 'Shows or hides the daily quote.', ['quote', 'spark', 'hide quote'], { tab: 'today', panel: 'settings' }),
  e('settings.reminders', 'Training reminders', 'Settings → Reminders', 'A reminder on scheduled days, with time, style and an optional readiness summary.', ['reminder', 'notification', 'alert', 'remind me'], { tab: 'today', panel: 'settings' }),
  e('settings.readiness-reminder', 'Morning readiness summary', 'Settings → Reminders → Morning readiness summary', "Swaps today's reminder text for your readiness.", ['readiness reminder', 'morning summary'], { tab: 'today', panel: 'settings' }, { methods: ['readiness'] }),
  e('settings.haptics', 'Haptic feedback', 'Settings → Feedback', 'Vibration on taps and set logging.', ['haptics', 'vibration', 'buzz'], { tab: 'today', panel: 'settings' }),
  e('settings.profile', 'Profile row', 'Settings → Profile', 'Your name, and the way into your profile details.', ['name', 'profile'], { tab: 'today', panel: 'settings' }),
  e('settings.health', 'Health Connect', 'Settings → Watch and health', 'Syncs sleep, resting heart rate, steps and calories from Android Health Connect.', ['health connect', 'sync', 'sleep data', 'steps', 'resting heart rate'], { tab: 'today', panel: 'settings' }, { methods: ['readiness'] }),
  e('panel.watch', 'Watch', 'Settings → Watch and health → Watch', 'Connect a heart-rate watch for live heart rate, heart-guided rest and zones.', ['watch', 'bluetooth', 'heart rate', 'connect watch', 'hr strap'], { tab: 'today', panel: 'watch' }, { methods: ['hr_zones', 'hr_rest'] }),
  e('settings.escobar', 'Escobar settings', 'Settings → Escobar', 'Turn the online coach on or off, what it may see, tone, proactive notes, usage and resetting conversations.', ['escobar', 'online coach', 'ai', 'sharing', 'privacy', 'tone', 'usage', 'cost', 'reset conversations', 'proxy'], { tab: 'today', panel: 'settings' }),
  e('coach.hall', 'Ask Escobar', 'Escobar tab → top', 'Ask anything about your training or this app, with today’s brief underneath.', ['ask', 'chat', 'question', 'escobar', 'talk'], { tab: 'coach' }),
  e('settings.data', 'Your data', 'Settings → Your data', 'Export a backup, restore one, or reset everything.', ['backup', 'export', 'restore', 'reset', 'delete everything', 'data'], { tab: 'today', panel: 'settings' }, { how: ['Tap Export backup to save a file', 'Tap Restore backup to load one'] }),
  e('settings.version', 'App version', 'Settings → bottom', 'The app version.', ['version', 'about'], { tab: 'today', panel: 'settings' }),

  // Profile
  e('profile.about', 'Personal details', 'Settings → Profile → Open → Personal details', 'Birth year, sex and height. They unlock zones, calories and age-adjusted recovery.', ['birth year', 'age', 'sex', 'height'], { tab: 'today', panel: 'profile' }, { methods: ['hr_zones', 'energy'] }),
  e('profile.weigh-in', 'Weigh-in', 'Settings → Profile → Open → Body', 'Log your body weight. Big jumps ask to confirm.', ['weight', 'weigh in', 'body weight', 'scale'], { tab: 'today', panel: 'profile' }),
  e('profile.training', 'Training background', 'Settings → Profile → Open → Training', 'Training since, planned days per week, and goal.', ['training since', 'experience', 'planned days', 'days per week'], { tab: 'today', panel: 'profile' }),
];

export const PALACE_BY_ID: Record<string, PalaceEntry> = Object.fromEntries(PALACE.map(p => [p.id, p]));

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9%+ ]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Keyword scoring for `find_in_app` (and the offline guide): a whole keyword phrase in the
 * query counts most, then title words, then words in what/where.
 */
export function findInApp(query: string, limit = 5): PalaceEntry[] {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(' ').filter(w => w.length > 1 && !STOP.has(w));
  const scored = PALACE.map(p => {
    let score = 0;
    for (const k of p.keywords) {
      const kk = norm(k);
      if (!kk) continue;
      if (` ${q} `.includes(` ${kk} `)) score += 6 + kk.split(' ').length * 2;
      else if (kk.split(' ').every(w => words.includes(w))) score += 4;
    }
    const title = norm(p.title);
    if (` ${q} `.includes(` ${title} `)) score += 6;
    for (const w of words) {
      if (title.split(' ').includes(w)) score += 3;
      else if (norm(`${p.what} ${p.where}`).split(' ').includes(w)) score += 1;
    }
    return { p, score };
  }).filter(x => x.score > 0);
  scored.sort((a, b) => b.score - a.score || PALACE.indexOf(a.p) - PALACE.indexOf(b.p));
  return scored.slice(0, limit).map(x => x.p);
}

const STOP = new Set(['the', 'my', 'is', 'where', 'how', 'do', 'can', 'what', 'to', 'a', 'an', 'of', 'in', 'on', 'i', 'me', 'find', 'see', 'show', 'take', 'go', 'there', 'and', 'for', 'it', 'at', 'does', 'app', 'change']);
