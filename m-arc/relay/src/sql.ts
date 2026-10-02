// The five SQL calls the store needs. Both backends are synchronous SQLite, so the store is too.
export type Val = string | number | null | Uint8Array
export type Row = Record<string, Val>

export interface Sql {
  all<T = Row>(q: string, ...args: Val[]): T[]
  get<T = Row>(q: string, ...args: Val[]): T | undefined
  run(q: string, ...args: Val[]): void
  script(q: string): void
  tx<T>(fn: () => T): T
}

// Durable Object storage.sql: BLOBs come back as ArrayBuffer; transactions go through transactionSync.
export function durableSql(storage: DurableObjectStorage): Sql {
  const sql = storage.sql
  const bind = (a: Val[]) => a.map(v => (v instanceof Uint8Array ? v.slice().buffer : v))
  const norm = (r: Record<string, SqlStorageValue>): Row => {
    const o: Row = {}
    for (const k in r) {
      const v = r[k]
      o[k] = v instanceof ArrayBuffer ? new Uint8Array(v) : (v as Val)
    }
    return o
  }
  const all = <T>(q: string, ...a: Val[]) => sql.exec(q, ...bind(a)).toArray().map(norm) as T[]
  let depth = 0
  return {
    all,
    get: <T>(q: string, ...a: Val[]) => all<T>(q, ...a)[0],
    run: (q, ...a) => void sql.exec(q, ...bind(a)).toArray(),
    script: q => void sql.exec(q),
    tx<T>(fn: () => T): T {
      if (depth) return fn()
      depth++
      try {
        return storage.transactionSync(fn)
      } finally {
        depth--
      }
    },
  }
}

interface NodeDb {
  prepare(q: string): { all(...a: Val[]): unknown[]; run(...a: Val[]): unknown }
  exec(q: string): void
}

// node:sqlite DatabaseSync (local dev, self-hosting, tests).
export function nodeSql(db: NodeDb): Sql {
  const cache = new Map<string, ReturnType<NodeDb['prepare']>>()
  const prep = (q: string) => {
    let s = cache.get(q)
    if (!s) cache.set(q, (s = db.prepare(q)))
    return s
  }
  let depth = 0
  return {
    all: <T>(q: string, ...a: Val[]) => prep(q).all(...a) as T[],
    get: <T>(q: string, ...a: Val[]) => prep(q).all(...a)[0] as T | undefined,
    run: (q, ...a) => void prep(q).run(...a),
    script: q => db.exec(q),
    tx<T>(fn: () => T): T {
      if (depth) return fn()
      depth++
      db.exec('BEGIN')
      try {
        const r = fn()
        db.exec('COMMIT')
        return r
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      } finally {
        depth--
      }
    },
  }
}
