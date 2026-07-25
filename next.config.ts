import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray lockfile in the parent directory otherwise makes Turbopack guess
  // the wrong workspace root.
  turbopack: {
    root: path.resolve(__dirname),
  },

  /**
   * PGlite ships a WASM build of Postgres. Bundling it rewrites the paths it
   * uses to locate its own .wasm/.data files, which fails at runtime with
   * ERR_INVALID_FILE_URL_PATH. Keeping it external lets Node resolve it
   * normally. It is only ever loaded when DATABASE_URL starts with pglite://.
   */
  serverExternalPackages: ["@electric-sql/pglite"],

  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
