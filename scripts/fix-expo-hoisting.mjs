// Fixes expo-router hoisting in the npm-workspaces monorepo.
// @expo/cli hoists to the root, but expo-router expects to resolve from the app.
// We symlink (or copy) the root-hoisted expo-router into apps/mobile/node_modules
// if it isn't already resolvable there. Safe to run repeatedly.
import { existsSync, mkdirSync, symlinkSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appModules = join(root, "apps", "mobile", "node_modules");
const rootExpoRouter = join(root, "node_modules", "expo-router");
const appExpoRouter = join(appModules, "expo-router");

try {
  if (existsSync(rootExpoRouter) && !existsSync(appExpoRouter)) {
    mkdirSync(appModules, { recursive: true });
    try {
      symlinkSync(rootExpoRouter, appExpoRouter, "junction");
      console.log("[fix-expo-hoisting] linked expo-router into apps/mobile");
    } catch {
      cpSync(rootExpoRouter, appExpoRouter, { recursive: true });
      console.log("[fix-expo-hoisting] copied expo-router into apps/mobile");
    }
  } else {
    console.log("[fix-expo-hoisting] nothing to do");
  }
} catch (err) {
  console.warn("[fix-expo-hoisting] skipped:", err?.message ?? err);
}
