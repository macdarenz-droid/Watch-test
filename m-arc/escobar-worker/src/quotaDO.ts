/**
 * Daily quota counters (PL-01, PL-07): one SQLite-backed Durable Object per UTC day.
 * A Durable Object runs one call at a time, and the synchronous KV API keeps every
 * read-modify-write free of `await`, so concurrent turns never lose an update.
 *
 * AUD-3: admission is one atomic step. `admit` checks the finished counters plus every live
 * reservation, and on success reserves one step, one turn and the step's max output before the
 * paid call opens. `reconcile` swaps the reservation for the real usage; `release` drops it when
 * nothing was billed. Both are idempotent. A reservation still open after RESERVATION_TTL_MS is
 * charged in full (never below the bill: a step's output cannot pass its max_tokens).
 */
import { DurableObject } from 'cloudflare:workers';

export type Limits = { device: { turns: number; steps: number; out: number }; ip: { turns: number; steps: number }; global: { steps: number; out: number } };
export type QuotaKeys = { device: string; ip: string };
export type QuotaDelta = { steps: number; out: number; turns: number };
export type QuotaCheck = { ok: true } | { ok: false; scope: 'device' | 'ip' | 'global' };

type DeviceRow = { turns: number; steps: number; out: number };
type IpRow = { turns: number; steps?: number };
type GlobalRow = { steps: number; out: number };
/** A live reservation (`r:<id>`): its keys, what it holds, and when it expires. */
type Reservation = { device: string; ip: string; turns: number; steps: number; out: number; exp: number };

const RETENTION_MS = 3 * 86_400_000;
/** Longer than any step: the idle timeout is 60 s and the largest max_tokens is 32k. */
export const RESERVATION_TTL_MS = 30 * 60_000;

export class QuotaCounter extends DurableObject {
  private alarmChecked = false;

  /** Checks and reserves in one synchronous block, so parallel requests see each other's holds. */
  async admit(keys: QuotaKeys, lim: Limits, id: string, out: number, now: number): Promise<QuotaCheck> {
    const kv = this.ctx.storage.kv;
    if (kv.get(`r:${id}`) || kv.get(`x:${id}`)) return { ok: false, scope: 'device' };
    const held = { d: { turns: 0, steps: 0, out: 0 }, i: { turns: 0, steps: 0 }, g: { steps: 0, out: 0 } };
    for (const [k, r] of [...kv.list<Reservation>({ prefix: 'r:' })]) {
      if (r.exp <= now) { this.apply(r, r); kv.delete(k); kv.put(`x:${k.slice(2)}`, 'expired'); continue; }
      if (r.device === keys.device) { held.d.turns += r.turns; held.d.steps += r.steps; held.d.out += r.out; }
      if (r.ip === keys.ip) { held.i.turns += r.turns; held.i.steps += r.steps; }
      held.g.steps += r.steps; held.g.out += r.out;
    }
    const d = kv.get<DeviceRow>(`d:${keys.device}`) ?? { turns: 0, steps: 0, out: 0 };
    if (d.turns + held.d.turns >= lim.device.turns || d.steps + held.d.steps >= lim.device.steps || d.out + held.d.out >= lim.device.out) return { ok: false, scope: 'device' };
    const i = kv.get<IpRow>(`i:${keys.ip}`) ?? { turns: 0 };
    // Steps too: a turn that never ends (every step a tool call) must still hit the IP cap.
    if (i.turns + held.i.turns >= lim.ip.turns || (i.steps ?? 0) + held.i.steps >= lim.ip.steps) return { ok: false, scope: 'ip' };
    const g = kv.get<GlobalRow>('g') ?? { steps: 0, out: 0 };
    if (g.steps + held.g.steps >= lim.global.steps || g.out + held.g.out >= lim.global.out) return { ok: false, scope: 'global' };
    kv.put(`r:${id}`, { device: keys.device, ip: keys.ip, turns: 1, steps: 1, out, exp: now + RESERVATION_TTL_MS } satisfies Reservation);
    await this.ensureAlarm();
    return { ok: true };
  }

  /** Replaces reservation `id` with the step's real usage. A second call, or one after expiry or release, does nothing. */
  async reconcile(id: string, delta: QuotaDelta): Promise<void> {
    const kv = this.ctx.storage.kv;
    const r = kv.get<Reservation>(`r:${id}`);
    if (!r) return;
    kv.delete(`r:${id}`);
    kv.put(`x:${id}`, 'settled');
    this.apply(r, delta);
  }

  /**
   * Drops reservation `id` without charging it (nothing was billed). Idempotent. The marker is
   * written even when no hold exists yet, so a release that beats a late admit still blocks it.
   */
  release(id: string): void {
    const kv = this.ctx.storage.kv;
    kv.delete(`r:${id}`);
    if (!kv.get(`x:${id}`)) kv.put(`x:${id}`, 'released');
  }

  async add(keys: QuotaKeys, delta: QuotaDelta): Promise<void> {
    this.apply(keys, delta);
    // Counters are already written; the alarm only schedules this day's cleanup.
    await this.ensureAlarm();
  }

  private apply(keys: QuotaKeys, delta: QuotaDelta): void {
    const kv = this.ctx.storage.kv;
    const d = kv.get<DeviceRow>(`d:${keys.device}`) ?? { turns: 0, steps: 0, out: 0 };
    kv.put(`d:${keys.device}`, { turns: d.turns + delta.turns, steps: d.steps + delta.steps, out: d.out + delta.out });
    const i = kv.get<IpRow>(`i:${keys.ip}`) ?? { turns: 0 };
    kv.put(`i:${keys.ip}`, { turns: i.turns + delta.turns, steps: (i.steps ?? 0) + delta.steps });
    const g = kv.get<GlobalRow>('g') ?? { steps: 0, out: 0 };
    kv.put('g', { steps: g.steps + delta.steps, out: g.out + delta.out });
  }

  private async ensureAlarm(): Promise<void> {
    if (this.alarmChecked) return;
    this.alarmChecked = true;
    if (await this.ctx.storage.getAlarm() == null) await this.ctx.storage.setAlarm(Date.now() + RETENTION_MS);
  }

  async alarm(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }
}
