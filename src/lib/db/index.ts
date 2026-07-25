import * as schema from "./schema";

/**
 * Three drivers, picked from the shape of DATABASE_URL:
 *
 *   pglite://.data/khanams   → embedded Postgres on disk. Zero setup, used for
 *                              local development and demos. Not for production:
 *                              serverless functions have no persistent disk.
 *   ...neon.tech...          → Neon over HTTP. The production driver on Netlify —
 *                              stateless per request, so nothing leaks.
 *   any other postgres://    → postgres-js over TCP, for a self-hosted database.
 */

/**
 * Read at call time, never at module scope. `next build` imports this module in
 * every worker while collecting page data; throwing here would fail the build on
 * a machine that has no database — even though the build never runs a query,
 * because every database-backed page is force-dynamic.
 */
const dbUrl = () => process.env.DATABASE_URL ?? "";

export const isPglite = () => dbUrl().startsWith("pglite://");
export const isNeon = () => dbUrl().includes("neon.tech");

/*
 * require() rather than import here, deliberately: only one of these three
 * drivers is ever wanted, and a static import would pull all three into every
 * deployment — including PGlite's multi-megabyte WASM payload into a Neon build
 * that will never execute it.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
function createDb() {
  const url = dbUrl();

  // Reached only when something actually queries — i.e. a real request.
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
        "  · Locally: copy .env.example to .env.local (the default pglite:// " +
        "value needs no signup).\n" +
        "  · On Netlify: add DATABASE_URL under Site configuration → " +
        "Environment variables, then redeploy.",
    );
  }

  if (isPglite()) {
    // Required lazily so the WASM bundle never reaches a Neon/TCP deployment.
    const { PGlite } = require("@electric-sql/pglite");
    const { drizzle } = require("drizzle-orm/pglite");
    const dir = url.replace("pglite://", "") || ".data/khanams";

    // PGlite's own mkdir is not recursive, so ensure the parent exists first.
    const { mkdirSync } = require("fs");
    const { dirname } = require("path");
    mkdirSync(dirname(dir), { recursive: true });

    // Reused across hot reloads — a second PGlite on the same dir would lock.
    const g = globalThis as unknown as { __pglite?: unknown };
    g.__pglite ??= new PGlite(dir);
    return drizzle(g.__pglite, { schema });
  }

  if (isNeon()) {
    const { drizzle } = require("drizzle-orm/neon-http");
    const { neon } = require("@neondatabase/serverless");
    return drizzle(neon(url), { schema });
  }

  const { drizzle } = require("drizzle-orm/postgres-js");
  const postgres = require("postgres");
  return drizzle(postgres(url, { max: 1 }), { schema });
}
/* eslint-enable @typescript-eslint/no-require-imports */

type Database = ReturnType<typeof import("drizzle-orm/neon-http").drizzle<typeof schema>>;

function getDb(): Database {
  const g = globalThis as unknown as { __db?: Database };
  g.__db ??= createDb() as Database;
  return g.__db;
}

/**
 * Deliberately lazy. `next build` spawns a worker per core, and each one imports
 * this module while collecting page data — but none of them queries, because
 * every database-backed page is force-dynamic. Connecting at import time meant a
 * dozen workers racing for the same single-writer PGlite directory. The proxy
 * defers the connection to the first real property access, so a build never
 * opens one at all.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
export * from "./schema";
