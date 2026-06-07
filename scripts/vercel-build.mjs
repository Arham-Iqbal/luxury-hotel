// Vercel build entry. Runs at deploy time.
// 1. Clears EXPO_PUBLIC_API_URL so the prod web build uses same-origin /api
//    (setting it would break all API calls — playbook §6/§21).
// 2. Regenerates api/_data.js from the shared data package (playbook §7B).
// 3. Exports the Expo web bundle to apps/mobile/dist.
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// 1. Prod must use same-origin /api.
delete process.env.EXPO_PUBLIC_API_URL;

const run = (cmd, cwd) => {
  console.log(`[vercel-build] $ ${cmd}`);
  execSync(cmd, { cwd: cwd ?? root, stdio: "inherit", env: process.env });
};

// 2. Regenerate the serverless data bundle.
run("node scripts/gen-api-data.mjs");

// 3. Export the static web site.
run("npx expo export -p web", join(root, "apps", "mobile"));

console.log("[vercel-build] done — apps/mobile/dist ready");
