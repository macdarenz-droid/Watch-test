/**
 * Machine-relative timing budgets. A CI runner can be slower than the machine the budgets were
 * set on, so every budget is scaled by how long a fixed, deterministic workload takes here.
 */
import { expect } from 'vitest';

/** The calibration workload's median time on the machine the budgets were set on (2026-09-23). */
export const REFERENCE_MS = 26;

/** Seeded (LCG) 200k numbers, sorted: CPU-bound, allocation-light, the same work every run. */
function calibrationWork(): number {
  let x = 123456789;
  const a = new Float64Array(200_000);
  for (let i = 0; i < a.length; i++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; a[i] = x / 4294967296; }
  a.sort();
  return a[100_000]!;
}

export const median = (xs: number[]): number => [...xs].sort((p, q) => p - q)[Math.floor(xs.length / 2)]!;

/** Median of 5 runs after one warm-up. */
export function timeIt(fn: () => void): number {
  fn();
  const t: number[] = [];
  for (let i = 0; i < 5; i++) { const s = performance.now(); fn(); t.push(performance.now() - s); }
  return median(t);
}

let cached: { measured: number; scale: number } | null = null;
/** How much slower this machine is than the reference: never below 1, so fast machines keep the full budget. */
export function machineScale(): { measured: number; scale: number } {
  if (!cached) {
    const measured = timeIt(() => { calibrationWork(); });
    cached = { measured, scale: Math.max(1, measured / REFERENCE_MS) };
  }
  return cached;
}

/** Asserts `ms < budgetMs × scale` and logs measured, scale and the scaled budget. */
export function expectWithinBudget(label: string, ms: number, budgetMs: number): void {
  const { measured, scale } = machineScale();
  const limit = budgetMs * scale;
  console.log(`[perf] ${label}: ${ms.toFixed(1)} ms · budget ${budgetMs} ms × scale ${scale.toFixed(2)} = ${limit.toFixed(1)} ms · calibration ${measured.toFixed(1)} ms (reference ${REFERENCE_MS} ms)`);
  expect(ms, `${label}: ${ms.toFixed(1)} ms over ${limit.toFixed(1)} ms`).toBeLessThan(limit);
}
