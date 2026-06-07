// Pre-bundle the shared data package into a plain JS file the Vercel serverless
// function can import at runtime. Node can't run the .ts source, and Vercel
// doesn't reliably bundle a symlinked workspace package into the function.
// See playbook §7B.
import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [join(root, "packages", "data", "src", "index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(root, "api", "_data.js"),
});

console.log("[gen-api-data] wrote api/_data.js");
