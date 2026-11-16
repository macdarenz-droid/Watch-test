/**
 * Storage, rate limits, retention and the owner summary for anonymous error reports
 * (docs/ERROR-REPORTS.md "Server"), in Cloudflare D1 (binding ERRORS_DB).
 *
 * - Reports keep only the cleaned allowlisted fields (errorsValidate.ts `cleanReport`).
 * - Rate limits: 30 requests an hour per install id and per IP. Each counter is one atomic
 *   upsert (`n = n + 1 RETURNING n`), so concurrent batches cannot race past the limit. The IP is
 *   never stored: its counter key is an HMAC of the IP and the hour, keyed by a Worker secret, and
 *   rows from earlier hours are deleted on the next request and by the daily cron.
 * - Retention: the daily cron deletes reports older than 90 days.
 * - Content reports (POST /reports, ESC-REPORT-W): one row per reply text and reason, with a count.
 *   They use the same `error_rate` table under their own keys: 10 an hour per network (IPv6 /64),
 *   checked first, then 200 an hour in total.
 * The schema is created on first use (CREATE ... IF NOT EXISTS), once per Worker instance, so the
 * owner has no migration command to run.
 */
import type { ContentReport, Report } from './errorsValidate';

export const HOURLY_LIMIT = 30;
export const RETENTION_MS = 90 * 86_400_000;
export const DAY_MS = 86_400_000;

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS error_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, stored_at INTEGER NOT NULL, install_id TEXT NOT NULL, ts TEXT NOT NULL, app TEXT NOT NULL, platform TEXT NOT NULL, os TEXT, device TEXT, route TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, message TEXT NOT NULL, frames TEXT NOT NULL, sig TEXT NOT NULL, count INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS error_reports_stored_at ON error_reports (stored_at)`,
  `CREATE INDEX IF NOT EXISTS error_reports_sig ON error_reports (sig, stored_at)`,
  `CREATE TABLE IF NOT EXISTS error_rate (k TEXT PRIMARY KEY, hour TEXT NOT NULL, n INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS error_rate_hour ON error_rate (hour)`,
  `CREATE TABLE IF NOT EXISTS content_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, stored_at INTEGER NOT NULL, reason TEXT NOT NULL, app TEXT NOT NULL, text TEXT NOT NULL, text_sha TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 1)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS content_reports_text ON content_reports (text_sha, reason)`,
  `CREATE INDEX IF NOT EXISTS content_reports_stored_at ON content_reports (stored_at)`,
];

const ready = new WeakSet<D1Database>();
export async function ensureSchema(db: D1Database): Promise<void> {
  if (ready.has(db)) return;
  await db.batch(SCHEMA.map(s => db.prepare(s)));
  ready.add(db);
}

export const hourKey = (now: number): string => new Date(now).toISOString().slice(0, 13);

const hex = (buf: ArrayBuffer): string => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/** HMAC-SHA-256 of the hour and the IP, keyed by the Worker secret: a counter key that cannot be turned back into the IP.
 * `domain` keeps each endpoint's counters apart; error-report keys use the default and stay as before. */
export async function ipKey(secret: string, hour: string, ip: string, domain = 'errors-ip'): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${domain}|${hour}|${ip}`)));
}

export type RateResult = { ok: true } | { ok: false; scope: 'installId' | 'ip' };

/** Counts this request against every install id in the batch and the IP; over the limit on any is a 429. */
export async function countRequest(db: D1Database, secret: string, installIds: string[], ip: string, now: number): Promise<RateResult> {
  const hour = hourKey(now);
  const ipk = `p:${await ipKey(secret, hour, ip)}`;
  const upsert = (k: string) => db.prepare('INSERT INTO error_rate (k, hour, n) VALUES (?1, ?2, 1) ON CONFLICT (k) DO UPDATE SET n = n + 1 RETURNING n').bind(k, hour);
  const keys = [...installIds.map(id => `i:${hour}:${id}`), ipk];
  const [, ...counts] = await db.batch<{ n: number }>([
    db.prepare('DELETE FROM error_rate WHERE hour < ?1').bind(hour),
    ...keys.map(upsert),
  ]);
  const n = (i: number) => counts[i]?.results[0]?.n ?? 0;
  for (let i = 0; i < installIds.length; i++) if (n(i) > HOURLY_LIMIT) return { ok: false, scope: 'installId' };
  if (n(installIds.length) > HOURLY_LIMIT) return { ok: false, scope: 'ip' };
  return { ok: true };
}

export async function storeReports(db: D1Database, reports: Report[], now: number): Promise<void> {
  await db.batch(reports.map(r => db.prepare(
    'INSERT INTO error_reports (stored_at, install_id, ts, app, platform, os, device, route, kind, name, message, frames, sig, count) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)',
  ).bind(now, r.installId, r.ts, r.app, r.platform, r.os ?? null, r.device ?? null, r.route, r.kind, r.name, r.message, JSON.stringify(r.frames), r.sig, r.count)));
}

export const REPORTS_PER_NETWORK = 10;
export const REPORTS_PER_HOUR = 200;

/** Counts one content report: the network (`bucket`, from handler.ts `ipBucket`) first, and the
 * hourly total only when the network is under its limit, so one network cannot use up the total. */
export async function countReport(db: D1Database, secret: string, bucket: string, now: number): Promise<boolean> {
  const hour = hourKey(now);
  const upsert = (k: string) => db.prepare('INSERT INTO error_rate (k, hour, n) VALUES (?1, ?2, 1) ON CONFLICT (k) DO UPDATE SET n = n + 1 RETURNING n').bind(k, hour);
  const [, net] = await db.batch<{ n: number }>([
    db.prepare('DELETE FROM error_rate WHERE hour < ?1').bind(hour),
    upsert(`r:p:${await ipKey(secret, hour, bucket, 'reports-ip')}`),
  ]);
  if ((net?.results[0]?.n ?? 0) > REPORTS_PER_NETWORK) return false;
  const all = await upsert(`r:all:${hour}`).first<number>('n');
  return (all ?? 0) <= REPORTS_PER_HOUR;
}

/** Stores a reported reply. The same text and reason again only raise `n`; the first date and app stay. */
export async function storeContentReport(db: D1Database, r: ContentReport, now: number): Promise<void> {
  const sha = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(r.text)));
  await db.prepare(
    'INSERT INTO content_reports (stored_at, reason, app, text, text_sha) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT (text_sha, reason) DO UPDATE SET n = n + 1',
  ).bind(now, r.reason, r.app, r.text, sha).run();
}

/** Daily cron: reports past 90 days and rate counters from earlier hours go. */
export async function purge(db: D1Database, now: number): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM error_reports WHERE stored_at < ?1').bind(now - RETENTION_MS),
    db.prepare('DELETE FROM content_reports WHERE stored_at < ?1').bind(now - RETENTION_MS),
    db.prepare('DELETE FROM error_rate WHERE hour < ?1').bind(hourKey(now)),
  ]);
}

export async function dailyPurge(db: D1Database | undefined, now: number): Promise<void> {
  if (!db) return;
  await ensureSchema(db);
  await purge(db, now);
}

export interface SignatureSummary { sig: string; kind: string; name: string; message: string; count: number; installs: number; new: boolean }
export interface Summary { since: string; until: string; signatures: SignatureSummary[] }

/** The owner's daily summary: signatures seen in the last 24 hours, with counts, affected installs, and whether each is new (first seen in the window). */
export async function summarize(db: D1Database, now: number): Promise<Summary> {
  const since = now - DAY_MS;
  const { results } = await db.prepare(
    `SELECT sig, MAX(kind) AS kind, MAX(name) AS name, MAX(message) AS message, SUM(count) AS count, COUNT(DISTINCT install_id) AS installs,
       (SELECT MIN(stored_at) FROM error_reports f WHERE f.sig = e.sig) AS first_seen
     FROM error_reports e WHERE stored_at >= ?1 GROUP BY sig ORDER BY count DESC LIMIT 500`,
  ).bind(since).all<{ sig: string; kind: string; name: string; message: string; count: number; installs: number; first_seen: number }>();
  return {
    since: new Date(since).toISOString(),
    until: new Date(now).toISOString(),
    signatures: results.map(r => ({ sig: r.sig, kind: r.kind, name: r.name, message: r.message, count: r.count, installs: r.installs, new: r.first_seen >= since })),
  };
}
