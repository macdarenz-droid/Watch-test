import {
  freshEscobar, freshUnits, MAX_GYMS, type EquipmentProfile, type Gym, type LoadUnit, type UnitsState, MAX_MEMORY_ITEMS, MAX_MEMORY_TEXT, MAX_PINS, MEMORY_KINDS, SHOW_COMPONENT_IDS,
  type DailyBrief, type EscobarState, type MemoryItem, type PinnedCard, type TodayChange, type TodayOverride,
} from './models';

/**
 * Field-by-field repair of a saved `escobar` block (§6.1). A state written by an
 * older build, a hand-edited backup or a half-written save must never break boot,
 * so every malformed item is dropped and every list is capped here.
 */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const DEVICE_ID = /^dev_[a-f0-9]{24}$/;
const MEMORY_SOURCES = ['user_said', 'inferred', 'user_edit', 'summary'] as const;

function memoryItem(v: unknown): MemoryItem | null {
  if (!isObj(v) || !str(v.id) || !str(v.text) || !str(v.createdAt)) return null;
  if (!MEMORY_KINDS.includes(v.kind as MemoryItem['kind'])) return null;
  const text = v.text.trim().slice(0, MAX_MEMORY_TEXT);
  if (!text) return null;
  const source = MEMORY_SOURCES.includes(v.source as MemoryItem['source']) ? (v.source as MemoryItem['source']) : 'user_said';
  const item: MemoryItem = { id: v.id, kind: v.kind as MemoryItem['kind'], text, source, createdAt: v.createdAt, updatedAt: str(v.updatedAt) ? v.updatedAt : v.createdAt };
  if (str(v.expiresOn) && DAY.test(v.expiresOn)) item.expiresOn = v.expiresOn;
  if (str(v.conversationId)) item.conversationId = v.conversationId;
  return item;
}

function pin(v: unknown): PinnedCard | null {
  if (!isObj(v) || !str(v.id) || !str(v.title) || !str(v.pinnedAt)) return null;
  if (!SHOW_COMPONENT_IDS.includes(v.component as PinnedCard['component'])) return null;
  const p: PinnedCard = { id: v.id, component: v.component as PinnedCard['component'], params: isObj(v.params) ? v.params : {}, title: v.title.slice(0, 60), pinnedAt: v.pinnedAt };
  if (str(v.until) && DAY.test(v.until)) p.until = v.until;
  return p;
}

function change(v: unknown): TodayChange | null {
  if (!isObj(v)) return null;
  switch (v.kind) {
    case 'swap': return str(v.from) && str(v.to) ? { kind: 'swap', from: v.from, to: v.to } : null;
    case 'remove': return str(v.exerciseId) ? { kind: 'remove', exerciseId: v.exerciseId } : null;
    case 'add': return str(v.exerciseId) && num(v.sets) ? { kind: 'add', exerciseId: v.exerciseId, sets: v.sets } : null;
    case 'sets': return str(v.exerciseId) && num(v.sets) ? { kind: 'sets', exerciseId: v.exerciseId, sets: v.sets } : null;
    case 'load': return str(v.exerciseId) && num(v.factor) ? { kind: 'load', exerciseId: v.exerciseId, factor: v.factor } : null;
    default: return null;
  }
}

function todayOverride(v: unknown): TodayOverride | null {
  if (!isObj(v) || !str(v.day) || !DAY.test(v.day) || !str(v.splitId) || !Array.isArray(v.changes)) return null;
  const changes = v.changes.map(change).filter((c): c is TodayChange => !!c);
  return { day: v.day, splitId: v.splitId, reason: str(v.reason) ? v.reason.slice(0, 140) : '', changes };
}

function brief(v: unknown): DailyBrief | null {
  if (!isObj(v) || !str(v.day) || !str(v.headline) || !str(v.generatedAt) || !Array.isArray(v.priorities)) return null;
  const priorities = v.priorities
    .filter((p): p is { insightId: string; line: string } => isObj(p) && str(p.insightId) && str(p.line))
    .slice(0, 3)
    .map(p => ({ insightId: p.insightId, line: p.line }));
  return { day: v.day, headline: v.headline, priorities, generatedAt: v.generatedAt, source: v.source === 'escobar' ? 'escobar' : 'brain' };
}

export function normalizeEscobar(raw: unknown): EscobarState {
  const fresh = freshEscobar();
  if (!isObj(raw)) return fresh;
  const sharing = isObj(raw.sharing) ? raw.sharing : {};
  const proactive = isObj(raw.proactive) ? raw.proactive : {};
  const usage = isObj(raw.usage) ? raw.usage : {};
  const shown: Record<string, string> = {};
  if (isObj(proactive.shown)) for (const [k, d] of Object.entries(proactive.shown)) if (str(d)) shown[k] = d;
  const memory = (Array.isArray(raw.memory) ? raw.memory : []).map(memoryItem).filter((m): m is MemoryItem => !!m);
  const pins = (Array.isArray(raw.pins) ? raw.pins : []).map(pin).filter((p): p is PinnedCard => !!p);
  return {
    enabled: raw.enabled === true,
    proxyUrl: str(raw.proxyUrl) && /^https?:\/\//.test(raw.proxyUrl) ? raw.proxyUrl : null,
    deviceId: str(raw.deviceId) && DEVICE_ID.test(raw.deviceId) ? raw.deviceId : '',
    sharing: { health: sharing.health === true, body: sharing.body === true },
    tone: raw.tone === 'direct' ? 'direct' : 'warm',
    memoryEnabled: raw.memoryEnabled !== false,
    // Newest last: keep the newest when over the cap.
    memory: memory.slice(-MAX_MEMORY_ITEMS),
    pins: pins.slice(-MAX_PINS),
    todayOverride: todayOverride(raw.todayOverride),
    proactive: {
      enabled: proactive.enabled !== false,
      shown,
      day: str(proactive.day) ? proactive.day : '',
      count: num(proactive.count) ? Math.max(0, Math.round(proactive.count)) : 0,
    },
    brief: brief(raw.brief),
    usage: {
      day: str(usage.day) ? usage.day : '',
      turns: num(usage.turns) ? usage.turns : 0,
      inputTokens: num(usage.inputTokens) ? usage.inputTokens : 0,
      outputTokens: num(usage.outputTokens) ? usage.outputTokens : 0,
      cacheReadTokens: num(usage.cacheReadTokens) ? usage.cacheReadTokens : 0,
      ...(num(usage.costUsd) && usage.costUsd >= 0 ? { costUsd: usage.costUsd } : {}),
    },
    legacyImported: raw.legacyImported === true || fresh.legacyImported,
  };
}

/**
 * OBS-ENDPOINT (AUD-4): the coach's on/off state, the sharing flags, the server and the device
 * identity belong to this phone. A restored block keeps this phone's values for them.
 */
export function withLocalTrust(restored: EscobarState, local: EscobarState): EscobarState {
  return { ...restored, enabled: local.enabled, proxyUrl: local.proxyUrl, deviceId: local.deviceId, sharing: { ...local.sharing } };
}

const UNITS = ['kg', 'lb'] as const;
const PROFILE_SOURCES = ['user', 'suspect_fix', 'escobar_scan', 'escobar_chat', 'default'] as const;
const numList = (v: unknown, max: number): number[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const list = v.filter((x): x is number => num(x) && x > 0).slice(0, max);
  return list.length ? list : undefined;
};

export function normalizeProfile(v: unknown): EquipmentProfile | null {
  if (!isObj(v) || !UNITS.includes(v.unit as LoadUnit)) return null;
  const p: EquipmentProfile = {
    unit: v.unit as LoadUnit,
    source: PROFILE_SOURCES.includes(v.source as EquipmentProfile['source']) ? (v.source as EquipmentProfile['source']) : 'user',
    updatedAt: str(v.updatedAt) ? v.updatedAt : '',
  };
  if (num(v.step) && v.step > 0) p.step = v.step;
  const ladder = numList(v.ladder, 80);
  if (ladder) p.ladder = [...ladder].sort((a, b) => a - b);
  const addOns = numList(v.addOns, 6);
  if (addOns) p.addOns = addOns;
  if (num(v.barKg) && v.barKg >= 5 && v.barKg <= 30) p.barKg = v.barKg;
  const plates = numList(v.plates, 12);
  if (plates) p.plates = [...plates].sort((a, b) => b - a);
  return p;
}

function profileMap(v: unknown, gymIds: Set<string>): Record<string, Record<string, EquipmentProfile>> {
  const out: Record<string, Record<string, EquipmentProfile>> = {};
  if (!isObj(v)) return out;
  for (const [gymId, inner] of Object.entries(v)) {
    if (!gymIds.has(gymId) || !isObj(inner)) continue;
    const m: Record<string, EquipmentProfile> = {};
    for (const [key, p] of Object.entries(inner)) { const n = normalizeProfile(p); if (n) m[key] = n; }
    out[gymId] = m;
  }
  return out;
}

/** Repairs `units` (§25.3). A state from before Plate Sense gets one gym whose default unit is the old global setting. */
export function normalizeUnits(raw: unknown, weightUnit: LoadUnit): UnitsState {
  const fresh = freshUnits(weightUnit);
  if (!isObj(raw)) return fresh;
  const seen = new Set<string>();
  const gyms: Gym[] = (Array.isArray(raw.gyms) ? raw.gyms : [])
    .filter((g): g is Record<string, unknown> => isObj(g) && str(g.id) && str(g.name))
    .filter(g => (seen.has(g.id as string) ? false : (seen.add(g.id as string), true)))
    .slice(0, MAX_GYMS)
    .map(g => ({ id: g.id as string, name: (g.name as string).slice(0, 28) || 'Gym', defaultUnit: g.defaultUnit === 'lb' ? 'lb' : 'kg', createdAt: str(g.createdAt) ? g.createdAt : fresh.gyms[0]!.createdAt }));
  if (!gyms.length) return fresh;
  const ids = new Set(gyms.map(g => g.id));
  return {
    gyms,
    activeGymId: str(raw.activeGymId) && ids.has(raw.activeGymId) ? raw.activeGymId : gyms[0]!.id,
    byExercise: profileMap(raw.byExercise, ids),
    byEquipment: profileMap(raw.byEquipment, ids),
  };
}
