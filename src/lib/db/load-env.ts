/**
 * Side-effect module: loads .env.local before anything else.
 *
 * Must be the FIRST import in any CLI script that touches the database.
 * Both ESM and CJS evaluate imports depth-first in source order, so importing
 * this first guarantees process.env is populated before ./index reads it.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
