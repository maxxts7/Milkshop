/**
 * Applies the SQL files in ./drizzle to whichever database DATABASE_URL points at.
 *
 *   npm run db:migrate
 */
import "./load-env";
import { db, isPglite, isNeon } from "./index";

async function main() {
  const target = isPglite() ? "PGlite (local)" : isNeon() ? "Neon" : "Postgres";
  console.log(`→ Running migrations against ${target}…`);

  if (isPglite()) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder: "./drizzle" });
  } else if (isNeon()) {
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    await migrate(db as never, { migrationsFolder: "./drizzle" });
  } else {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(db as never, { migrationsFolder: "./drizzle" });
  }

  console.log("✔ Migrations applied.");
  process.exit(0);
}

main().catch((err) => {
  console.error("✖ Migration failed:\n", err);
  process.exit(1);
});
