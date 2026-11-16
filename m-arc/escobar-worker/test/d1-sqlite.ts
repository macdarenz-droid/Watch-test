/**
 * A D1Database stand-in on Node's built-in SQLite, so the error-report tests run the Worker's real
 * SQL. Covers what src/errorsStore.ts uses: prepare/bind/all/first/run and batch (one transaction).
 */
// A non-literal specifier: the Worker's tsconfig has no Node types, and vitest resolves it at run time.
const SQLITE = 'node:sqlite';
const { DatabaseSync } = (await import(/* @vite-ignore */ SQLITE)) as {
  DatabaseSync: new (path: string) => {
    exec(sql: string): void;
    prepare(sql: string): { all(...p: unknown[]): Record<string, unknown>[]; run(...p: unknown[]): unknown };
  };
};

export function sqliteD1() {
  const db = new DatabaseSync(':memory:');
  let statements = 0;
  class Stmt {
    constructor(readonly sql: string, readonly params: unknown[] = []) {}
    bind(...p: unknown[]) { return new Stmt(this.sql, p.map(v => (v === undefined ? null : v))); }
    rows(): Record<string, unknown>[] {
      statements++;
      const s = db.prepare(this.sql);
      if (/^\s*(select|with)\b/i.test(this.sql) || /\breturning\b/i.test(this.sql)) return s.all(...this.params).map(r => ({ ...r }));
      s.run(...this.params);
      return [];
    }
    async all() { return { results: this.rows(), success: true, meta: {} }; }
    async first(col?: string) { const r = this.rows()[0] ?? null; return col && r ? r[col] : r; }
    async run() { return this.all(); }
  }
  const d1 = {
    prepare: (sql: string) => new Stmt(sql),
    async batch(stmts: Stmt[]) {
      db.exec('BEGIN');
      try {
        const out = stmts.map(s => ({ results: s.rows(), success: true, meta: {} }));
        db.exec('COMMIT');
        return out;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    async exec(sql: string) { db.exec(sql); return { count: 0, duration: 0 }; },
  };
  return { d1: d1 as unknown as D1Database, raw: db, get statements() { return statements; } };
}
