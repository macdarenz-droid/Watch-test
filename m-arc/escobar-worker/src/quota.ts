/**
 * Daily quotas (§12.5, PL-01, PL-07): per device turns, steps and output tokens, per IP turns,
 * and global steps and output tokens. Backends in order: the QUOTA_DO Durable Object (atomic,
 * counts every step), the QUOTA KV namespace (soft; written once per user turn to stay inside
 * KV's write limits), or none.
 */
import type { Env } from './anthropic';
import type { Limits, QuotaKeys } from './quotaDO';

export interface DeviceUsage { turns: number; steps: number; out: number }
export const DEFAULTS = { turns: 80, steps: 400, out: 400_000, ipTurns: 300, ipSteps: 1500, globalSteps: 20_000, globalOut: 3_000_000 };

const num = (v: string | undefined, d: number): number => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };
export const limits = (env: Env): Limits => ({
  device: { turns: num(env.MAX_TURNS_PER_DEVICE, DEFAULTS.turns), steps: num(env.MAX_STEPS_PER_DEVICE, DEFAULTS.steps), out: num(env.MAX_OUTPUT_PER_DEVICE, DEFAULTS.out) },
  ip: { turns: num(env.MAX_TURNS_PER_IP, DEFAULTS.ipTurns), steps: num(env.MAX_STEPS_PER_IP, DEFAULTS.ipSteps) },
  global: { steps: num(env.MAX_STEPS_TOTAL, DEFAULTS.globalSteps), out: num(env.MAX_OUTPUT_TOTAL, DEFAULTS.globalOut) },
});

export const dayKey = (now: number): string => new Date(now).toISOString().slice(0, 10);
const deviceKey = (device: string, day: string) => `d:${day}:${device}`;
const ipKey = (ip: string, day: string) => `i:${day}:${ip}`;
const globalKey = (day: string) => `g:${day}`;

const DEVICE_MESSAGE = "That's today's coaching limit. Escobar is resting and back after midnight UTC; your notes still update.";
const GLOBAL_MESSAGE = 'Escobar is resting for today. Your notes still update.';
const UNAVAILABLE_MESSAGE = 'The coach is unavailable right now.';
/** Retry-After when the quota store cannot enforce (AUD-3): an outage, not a used-up day. */
export const ENFORCEMENT_RETRY_SEC = 60;

async function read<T>(kv: KVNamespace, key: string, fallback: T): Promise<T> {
  try { return ((await kv.get(key, 'json')) as T | null) ?? fallback; } catch { return fallback; }
}

const counter = (env: Env, now: number) => env.QUOTA_DO!.get(env.QUOTA_DO!.idFromName(dayKey(now)));

/** Seconds until the next UTC midnight: when the daily counters reset. */
export const resetInSec = (now: number): number => Math.ceil((Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1) - now) / 1000);

/** `id` names the Durable Object reservation to reconcile or release; the KV fallback has none. */
export type QuotaResult = { ok: true; id?: string } | { ok: false; message: string; retryAfter: number };

/** How long admission waits for the Durable Object before refusing the paid call. */
export const ADMIT_TIMEOUT_MS = 5_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error(`timed out after ${ms} ms`)), ms); });
  return Promise.race([p, t]).finally(() => { if (timer !== undefined) clearTimeout(timer); });
}

/**
 * AUD-3: with the Durable Object bound, admission checks and reserves one step, one turn and
 * `reserveOut` output tokens in one atomic call. If the object throws or times out the paid call
 * is refused (fail closed) with a `quota` error that asks for a retry in 60 s.
 */
export async function admitQuota(env: Env, keys: QuotaKeys, now: number, reserveOut: number, timeoutMs = ADMIT_TIMEOUT_MS): Promise<QuotaResult> {
  const lim = limits(env);
  const retryAfter = resetInSec(now);
  if (env.QUOTA_DO) {
    const id = crypto.randomUUID();
    try {
      const r = await withTimeout(Promise.resolve(counter(env, now).admit(keys, lim, id, reserveOut, now)), timeoutMs);
      if (r.ok) return { ok: true, id };
      return { ok: false, message: r.scope === 'global' ? GLOBAL_MESSAGE : DEVICE_MESSAGE, retryAfter };
    } catch (e) {
      console.error('quota admission failed:', String(e));
      // A timed-out admit may still land: release it so the hold does not wait for expiry.
      void Promise.resolve().then(() => counter(env, now).release(id)).catch(() => {});
      // An outage is short: ask for a retry in a minute, not after midnight.
      return { ok: false, message: UNAVAILABLE_MESSAGE, retryAfter: ENFORCEMENT_RETRY_SEC };
    }
  }
  if (!env.QUOTA) return { ok: true };
  const day = dayKey(now);
  const [d, i, g] = await Promise.all([
    read<DeviceUsage>(env.QUOTA, deviceKey(keys.device, day), { turns: 0, steps: 0, out: 0 }),
    read<{ turns: number }>(env.QUOTA, ipKey(keys.ip, day), { turns: 0 }),
    read<{ steps: number; out?: number }>(env.QUOTA, globalKey(day), { steps: 0, out: 0 }),
  ]);
  if (d.turns >= lim.device.turns || d.steps >= lim.device.steps || d.out >= lim.device.out || i.turns >= lim.ip.turns) return { ok: false, message: DEVICE_MESSAGE, retryAfter };
  if (g.steps >= lim.global.steps || (g.out ?? 0) >= lim.global.out) return { ok: false, message: GLOBAL_MESSAGE, retryAfter };
  return { ok: true };
}

/**
 * Records one billed model step. The Durable Object reconciles reservation `id` with it: steps +1,
 * its output tokens, and a turn when it ends one. The KV fallback writes once per turn (`turnSteps`
 * steps and the last step's output), as before. Never throws; if the Durable Object write fails,
 * the reservation stays and is charged in full when it expires.
 */
export async function recordStep(env: Env, keys: QuotaKeys, now: number, step: { turnEnded: boolean; outputTokens: number; turnSteps: number }, id?: string): Promise<void> {
  try {
    if (env.QUOTA_DO) {
      const delta = { steps: 1, out: step.outputTokens, turns: step.turnEnded ? 1 : 0 };
      await (id ? counter(env, now).reconcile(id, delta) : counter(env, now).add(keys, delta));
      return;
    }
    if (!env.QUOTA || !step.turnEnded) return;
    const day = dayKey(now);
    const d = await read<DeviceUsage>(env.QUOTA, deviceKey(keys.device, day), { turns: 0, steps: 0, out: 0 });
    const i = await read<{ turns: number }>(env.QUOTA, ipKey(keys.ip, day), { turns: 0 });
    const g = await read<{ steps: number; out?: number }>(env.QUOTA, globalKey(day), { steps: 0, out: 0 });
    await Promise.all([
      env.QUOTA.put(deviceKey(keys.device, day), JSON.stringify({ turns: d.turns + 1, steps: d.steps + step.turnSteps, out: d.out + step.outputTokens }), { expirationTtl: 172_800 }),
      env.QUOTA.put(ipKey(keys.ip, day), JSON.stringify({ turns: i.turns + 1 }), { expirationTtl: 172_800 }),
      env.QUOTA.put(globalKey(day), JSON.stringify({ steps: g.steps + step.turnSteps, out: (g.out ?? 0) + step.outputTokens }), { expirationTtl: 172_800 }),
    ]);
  } catch (e) { console.error('quota write failed:', String(e)); }
}

/** Drops reservation `id` for a step that billed nothing. Never throws; a failed release expires. */
export async function releaseQuota(env: Env, now: number, id: string | undefined): Promise<void> {
  if (!env.QUOTA_DO || !id) return;
  try { await counter(env, now).release(id); } catch (e) { console.error('quota release failed:', String(e)); }
}
