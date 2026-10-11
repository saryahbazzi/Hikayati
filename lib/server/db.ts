import "server-only";
import type { PGlite } from "@electric-sql/pglite";
import { migrations } from "@/db/migrations";

/**
 * One tiny interface over two Postgres drivers:
 *  - DATABASE_URL set  → node-postgres pool (Supabase, Neon, RDS, …)
 *  - otherwise         → PGlite (real Postgres compiled to WASM), persisted under HIKAYATI_DATA_DIR
 *                        (default ./.data/pglite). Tests use `memory://`.
 */
export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  /** Run several statements without parameters (migrations). */
  exec(sql: string): Promise<void>;
  /** Run `fn` atomically. Inside an existing transaction it simply joins it. */
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}
export interface Db extends Queryable {
  readonly driver: "pglite" | "pg";
  /** True when data will not survive a restart (in-memory / serverless without DATABASE_URL). */
  readonly ephemeral: boolean;
}

type G = typeof globalThis & { __hikayatiDb?: Promise<Db> };

async function openPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const explicit = process.env.HIKAYATI_DATA_DIR;
  const serverless = !!process.env.VERCEL;
  const dir = explicit ?? (serverless || process.env.NODE_ENV === "test" ? "memory://" : ".data/pglite");
  const pg = new PGlite(dir);
  await pg.waitReady;
  const inTx = (q: { query: PGlite["query"]; exec: PGlite["exec"] }): Queryable => {
    const self: Queryable = {
      async query<T>(sql: string, params?: unknown[]) {
        const r = await q.query<T>(sql, params as never);
        return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
      },
      async exec(sql: string) {
        await q.exec(sql);
      },
      tx: (fn) => fn(self),
    };
    return self;
  };
  const base = inTx(pg);
  return {
    query: base.query,
    exec: base.exec,
    driver: "pglite",
    ephemeral: dir.startsWith("memory:"),
    tx: (fn) => pg.transaction((t) => fn(inTx(t as never))),
  };
}

async function openPg(url: string): Promise<Db> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url, max: 5, ssl: /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false } });
  const wrap = (c: { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }> }): Queryable => {
    const self: Queryable = {
      async query<T>(sql: string, params?: unknown[]) {
        const r = await c.query(sql, params);
        return { rows: r.rows as T[], rowCount: r.rowCount ?? r.rows.length };
      },
      async exec(sql: string) {
        await c.query(sql);
      },
      tx: (fn) => fn(self),
    };
    return self;
  };
  return {
    query: wrap(pool).query,
    exec: wrap(pool).exec,
    driver: "pg",
    ephemeral: false,
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const out = await fn(wrap(client));
        await client.query("commit");
        return out;
      } catch (e) {
        await client.query("rollback");
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function migrate(db: Db) {
  await db.exec("create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await db.query<{ id: string }>("select id from schema_migrations")).rows.map((r) => r.id));
  for (const m of migrations) {
    if (done.has(m.id)) continue;
    await db.tx(async (q) => {
      await q.exec(m.sql);
      await q.query("insert into schema_migrations (id) values ($1)", [m.id]);
    });
  }
}

/** Process-wide singleton (survives Next dev HMR). Migrates on first use and seeds demo data when allowed. */
export function getDb(): Promise<Db> {
  const g = globalThis as G;
  g.__hikayatiDb ??= (async () => {
    const url = process.env.DATABASE_URL;
    const db = url ? await openPg(url) : await openPglite();
    await migrate(db);
    const { seedReference, seedDemoIfEmpty } = await import("./seed");
    await seedReference(db); // packages, templates, settings: safe in every environment
    const { demoAccessEnabled } = await import("./config");
    if (demoAccessEnabled()) await seedDemoIfEmpty(db);
    return db;
  })();
  return g.__hikayatiDb;
}

/** Test helper: a fresh isolated in-memory database. */
export async function createTestDb(opts: { demo?: boolean } = {}): Promise<Db> {
  const prev = process.env.HIKAYATI_DATA_DIR;
  process.env.HIKAYATI_DATA_DIR = "memory://";
  const db = await openPglite();
  if (prev === undefined) delete process.env.HIKAYATI_DATA_DIR;
  else process.env.HIKAYATI_DATA_DIR = prev;
  await migrate(db);
  const { seedReference, seedDemo } = await import("./seed");
  await seedReference(db);
  if (opts.demo) await seedDemo(db);
  return db;
}

export const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
