# Demo App Playbook — reusable setup for client demo apps

Private reference (gitignored). Built from the FreshCart demo, hardened on the
EstateHub demo (a 99acres/MagicBricks clone). Copy this approach for future
"one codebase → Android APK + website + admin console" demo apps so setup +
deploy don't eat days. Every gotcha below is one we actually hit and fixed.

- **Part I (§1–12):** the architecture, stack, deploy, and original gotchas.
- **Part II (§13–25):** hard-won fixes from the 2nd build — version pinning that
  prevents the white-screen crash, the custom bottom tab bar that works on APK +
  mobile browser, responsive rules, env-var table, premium UX patterns, hidden
  admin, the APK flow, and a 4-step pre-ship verification ritual. **Read Part II
  before starting a new app.**

---

## 1. The architecture (one Expo codebase → 3 deliverables)

```
Expo (SDK 56) + React Native + TypeScript
        │
        ├── Android APK   ← EAS cloud build (no Android SDK needed)
        ├── Website       ← Expo web export (static) → Vercel
        └── Admin console ← web-only routes in the same app
                              backed by a mock API (Express local / Vercel serverless)
```

Key idea: **react-native-web** renders the same RN components as HTML/CSS, so one
codebase is the app AND the site. iOS works from the same code too (just needs an
Apple Developer account, $99/yr, to install on real devices — no free APK equivalent).

---

## 2. Tech stack (what to install)

| Layer | Choice |
|-------|--------|
| Framework | **Expo SDK 56** + **React Native 0.85** |
| Language | **TypeScript** |
| UI | **React 19**, react-native-web (web), @expo/ui, @expo/vector-icons |
| Routing | **expo-router** (file-based, works app + web) |
| Client state | **Zustand 5** (+ AsyncStorage persistence) |
| Server state | **TanStack React Query 5** |
| Animation/gesture | reanimated 4, gesture-handler, worklets |
| Images | expo-image |
| Polish | expo-linear-gradient, expo-haptics, expo-glass-effect, expo-symbols |
| Mock API (local) | **Express** run via **tsx** |
| Mock API (prod) | **Vercel serverless functions** (mirror of the Express routes) |
| Shared data | a **workspace package** = single source of truth for the catalog |
| Monorepo | **npm workspaces** |
| Build | **EAS Build** (Android), Expo web export → **Vercel** |

> **Version reality check (read §13):** SDK 56 / RN 0.85 / React 19 is the
> aspiration, but the 2nd demo actually shipped stable on **Expo SDK 52 / RN
> 0.76.9 / React 18.3.1** because the bleeding edge wasn't reliable yet. Whatever
> SDK you pick, the iron rule is: run `npx expo install --check` right after install
> and pin every package it flags. A wrong `async-storage` major = white screen.
> §13 has the full known-good SDK 52 table.

---

## 3. Monorepo layout

```
apps/mobile/        Expo app → APK + web + admin (all screens)
packages/data/      shared catalog + types (SINGLE SOURCE OF TRUTH)
mock-api/           Express mock API for LOCAL dev
api/                Vercel serverless mirror of the API (production)
scripts/            vercel-build.mjs, gen-api-data.mjs, fix-expo-hoisting.mjs
vercel.json         one-project deploy: static site + /api functions + SPA rewrites
```

---

## 4. Architecture decisions that paid off

- **One workspace package is the single source of truth** for the catalog. Both the
  API (seed) and the app's offline fallback import it. Don't duplicate data.
- **Offline-safe storefront:** the app's API client tries the network, then falls
  back to the bundled data package. So the standalone APK is a complete store with
  no server.
- **Cart/orders/auth/notifications are client-side** (Zustand, persisted). The
  shopping flow never depends on the server being up.
- **Admin writes are live** (go to the API). Admin is **web-only** (no offline
  fallback because it does writes).
- **Responsive from one codebase:** a `useLayout()` hook returns
  `{ isMobile, isTablet, isDesktop, ... }`. Desktop = top navbar; mobile = bottom tabs.

---

## 5. Local dev (Windows / PowerShell)

```powershell
npm install        # root; a postinstall fixes expo-router hoisting for the monorepo
npm run api        # terminal 1 → Express mock API (http://localhost:4000)
npm run web        # terminal 2 → Expo web dev server
```
Admin console: open `/admin` in the browser (web-only).

Free a stuck API port:
`Get-NetTCPConnection -LocalPort 4000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`

---

## 6. Deploy the WEBSITE to Vercel

### One-time
1. Push repo to GitHub.
2. Vercel → Add New → Project → import the repo.
3. Leave build settings to `vercel.json` (don't override in the dashboard).
4. Deploy → get `https://<app>.vercel.app` (storefront `/`, admin `/admin`).

### Auto-deploy
Every push to `main` auto-builds and updates production. Other branches get preview
URLs. A failed build keeps the last good version live.

### vercel.json (the working shape)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "apps/mobile/dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/[...path]?path=$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### Env vars in Vercel
- **API base:** DON'T set `EXPO_PUBLIC_API_URL`. The build script clears it so the
  site uses same-origin `/api`. Setting it breaks API calls.
- **Admin password (if used):** set `EXPO_PUBLIC_ADMIN_PASSWORD` in Vercel →
  Settings → Environment Variables.

---

## 7. ⚠️ Vercel gotchas we actually hit (fix these proactively)

### A. Build ran in the wrong folder → "Missing script: vercel-build"
Vercel auto-detected a subfolder (e.g. `mock-api`) as the **Root Directory**.
**Fix:** Vercel → Settings → Build and Deployment → **Root Directory** → clear it
(repo root) → Save → redeploy.

### B. Serverless function 500 (FUNCTION_INVOCATION_FAILED)
The `/api` function imported the shared data workspace package, which shipped only
**TypeScript source** (`"main": "src/index.ts"`). Node can't run `.ts` at runtime,
and Vercel doesn't reliably bundle a symlinked workspace package into the function.
**Fix:** pre-bundle the data package into a plain JS file the function imports:
- `scripts/gen-api-data.mjs` runs `esbuild packages/data/src/index.ts --bundle
  --platform=node --format=esm --outfile api/_data.js`
- the function imports runtime values from `./_data.js`; types stay as
  `import type { ... } from "@demo/data"` (erased at compile, no runtime cost)
- add a `api/_data.d.ts` so the JS import is typed (avoids `@ts-expect-error`)
- wire the generator into `vercel-build` so it regenerates every deploy
- commit `api/_data.js` as a safety net

### C. Every API route 404'd with `"path":"/"`, or platform NOT_FOUND
The `[...path]` catch-all didn't receive the URL segments under `framework: null`.
Single-segment paths (`/api/health`) worked; multi-segment (`/api/admin/stats`) got
a platform 404.
**Fix (two parts):**
1. Rewrite forwards the path: `/api/(.*)` → `/api/[...path]?path=$1`
2. The function reads the path robustly:
```ts
const qp = req.query.path;
let segments: string[];
if (typeof qp === "string") segments = qp.split("/").filter(Boolean);
else if (Array.isArray(qp) && qp.length) segments = qp;
else segments = (req.url ?? "").split("?")[0].replace(/^\/api/, "").split("/").filter(Boolean);
const path = "/" + segments.join("/");
```

### D. Build-time TS error: "Unused '@ts-expect-error' directive" (TS2578)
A `@ts-expect-error` over an import that actually resolves fails the build.
**Fix:** don't suppress — give the JS file a `.d.ts` so the import is typed.

### E. Stale deployment confusion
"Redeploy" only works on the latest deployment. If you see an old error, check the
**Deployments list** (left sidebar) for the newest commit — you're often reading an
old/stale build log. Disable build cache when redeploying if behavior seems stuck.

---

## 8. Build the ANDROID APK (EAS)

```powershell
npm install -g eas-cli
eas login
cd apps/mobile
eas build:configure                               # first time; choose Android, accept project
eas build --platform android --profile preview    # cloud build → prints .apk download link
```

### eas.json (the working shape — APK output)
```json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "local" },
  "build": {
    "preview":    { "distribution": "internal", "android": { "buildType": "apk" } },
    "production":  { "autoIncrement": true,      "android": { "buildType": "apk" } }
  },
  "submit": { "production": {} }
}
```

### ⚠️ EAS gotchas we hit
- **Empty env string rejected:** `"env": { "EXPO_PUBLIC_API_URL": "" }` fails
  validation in newer EAS CLI ("not allowed to be empty"). **Remove the empty env
  block** — unset behaves the same.
- **`.env` leaks into the APK:** `EXPO_PUBLIC_*` vars in `.env` are inlined into
  every build. If `.env` has `EXPO_PUBLIC_API_URL=http://localhost:4000` (for web
  dev), the standalone APK bakes in localhost and breaks. **Fix in config.ts:**
  ignore localhost URLs on native so the APK falls back to offline data:
  ```ts
  const isWeb = Platform.OS === "web";
  const RAW = process.env.EXPO_PUBLIC_API_URL || extra?.apiUrl || "";
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(RAW);
  const EXPLICIT = !isWeb && isLocalhost ? "" : RAW;
  ```

### APK data behaviour
Installed APK has no server → uses the bundled catalog (offline-safe): full store,
cart, checkout, order tracking all work standalone. Admin is web-only, not in the APK.

---

## 9. iOS (when needed)

- Same code works: `eas build --platform ios --profile <profile>`.
- **No free direct-install** like Android's APK. Requires **Apple Developer account
  ($99/yr)**; distribute via **TestFlight** (invite by email) or registered device
  UDIDs (ad hoc, ≤100). Simulator builds run only on a Mac.
- **For iPhone demos, just send the Vercel web link** — opens in Safari, no install,
  no Apple account. Easiest path.

---

## 10. Conventions worth keeping

- Import design tokens from one `theme` module: `colors, spacing, radius, fontSize,
  formatPrice, useLayout, ...`. Never hardcode colors/URLs.
- Money via a `formatPrice(n)` helper (locale/currency in one place). Never `.toFixed`.
- **No hardcoded API URLs** — resolve the base only in `lib/config.ts` from
  `EXPO_PUBLIC_API_URL` (localhost dev / empty prod-same-origin / empty offline APK).
- **Zustand selectors must never return a freshly-allocated object/array** → infinite
  render loop. Select primitives/arrays; derive with `useMemo`. (Bug we hit twice.)
- When adding an API route, update BOTH `mock-api/src/server.ts` (Express) AND
  `api/[...path].ts` + `api/_store.ts` (Vercel) AND the shared types.
- New screens: rely on expo-router file paths AND add a `<Stack.Screen>` in
  `app/_layout.tsx` (and admin nav entries in the admin shell).

---

## 11. Monorepo / Windows gotchas

- **OneDrive + Windows:** file locks/sync interfere with `node_modules`; some `rm`
  calls warn "device busy" — usually harmless.
- **Expo hoisting:** `@expo/cli` hoists to root but `expo-router` stays in the app; a
  root `postinstall` (`fix-expo-hoisting.mjs`) symlinks it. Re-run `npm install` on
  MODULE_NOT_FOUND for an `expo-router` path.
- **Don't run `npx expo install`** here (CLI install util was flaky). Use it only to
  resolve versions, then plain `npm install`.
- **Web export is SPA** (`output: "single"`). `npx serve dist` 404s deep links — use
  `npm run web` locally; Vercel/Netlify rewrite in prod (see vercel.json).

---

## 12. Fast-start checklist for the NEXT demo app

1. `npx create-expo-app`, set up npm workspaces (apps/mobile, packages/data, mock-api, api).
2. Add the hoisting postinstall + `vercel-build` + `gen-api-data` scripts.
3. Put the catalog/types in `packages/data` (single source of truth).
4. Build `lib/config.ts` with the localhost-on-native guard from day one.
5. Mirror every API route in Express (local) and `api/[...path].ts` (Vercel).
6. Use the `vercel.json` and `eas.json` shapes above verbatim.
7. Deploy web: GitHub → Vercel import → leave settings to vercel.json.
8. APK: `eas build:configure` → `eas build -p android --profile preview`.
9. Sanity check before any deploy: `npx expo export -p web` must end "Exported: dist".

---

# PART II — Lessons from the 2nd build (EstateHub, a 99acres/MagicBricks clone)

Everything below was learned the hard way on the second demo app. Read this part
**before** starting the next one — it turns "days of debugging" into "copy the
known-good shapes." The architecture in Part I still holds; this part fixes the
gotchas Part I didn't know about yet.

---

## 13. ⚠️ Pin the EXACT SDK package versions (this caused a white screen)

The single worst bug: the app built and exported fine but rendered a **blank
white screen on web**, console showing:

```
Error: Module implementation must be a class
    at registerWebModule (...)
```

**Cause:** mismatched Expo package versions. `npm install` happily installs
newer majors than the installed Expo SDK supports, and one of them
(`@react-native-async-storage/async-storage` v2) ships a web module that fails
to register → the whole React tree crashes to white.

**Fix / rule:** after install, ALWAYS run:
```powershell
npx expo install --check
```
It lists every package whose version doesn't match the SDK. Pin those exact
versions in `package.json` and reinstall. For **Expo SDK 52** the known-good set is:

| Package | Correct version (SDK 52) |
|---------|--------------------------|
| expo | ~52.0.0 |
| react / react-dom | 18.3.1 |
| react-native | **0.76.9** (not 0.76.5) |
| @react-native-async-storage/async-storage | **1.23.1** (NOT 2.x — 2.x white-screens web) |
| @expo/vector-icons | **~14.0.4** (v15 then needs expo-font added explicitly) |
| expo-font | **~13.0.4** (REQUIRED if vector-icons is v14 — it imports expo-font) |
| expo-router | ~4.0.0 |
| expo-image | ~2.0.0 |
| expo-constants | ~17.0.0 |
| expo-linear-gradient | ~14.0.0 |
| react-native-safe-area-context | 4.12.0 |
| react-native-screens | ~4.4.0 |
| react-native-web | ~0.19.13 |

**Symptom → fix map:**
- White screen + `registerWebModule` "must be a class" → async-storage is 2.x, downgrade to 1.23.1.
- `Unable to resolve module expo-font from @expo/vector-icons` → add `expo-font` (~13.0.4) to deps.
- Anything else weird on web → run `npx expo install --check`, pin, reinstall.

> Part I said "don't run `npx expo install` to install." Still true — but DO use
> `npx expo install --check` to *diagnose* version drift. It's the fastest fix.

---

## 14. ⚠️ Bottom nav cut off / behind phone keys (APK **and** mobile browser)

Two separate problems that look the same ("the bottom tab bar is cut / unusable"):

### A. APK: tabs render behind the phone's gesture/nav keys
Native phones have a bottom system bar (gesture pill / 3 buttons). A fixed-height
tab bar sits *behind* it. **Fix:** add the bottom safe-area inset to the bar
height and padding.

### B. Mobile browser: labels clipped at the bottom — and the inset is 0
On a **mobile browser**, `useSafeAreaInsets().bottom` returns **0**, so "add the
inset" does nothing, and the browser's bottom chrome still clips the labels.
Worse: **React Navigation's default web tab bar ignores `tabBarStyle.height` and
`paddingBottom`** entirely — it computes its own compact ~51px height. We proved
this by measuring the rendered element: `paddingBottom: 0px` despite the style.

### The fix that works EVERYWHERE: a custom tab bar
Stop fighting the default. Provide your own `tabBar` so you fully control height +
padding, and use a **minimum floor** so browsers (inset=0) still get breathing room:

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  if (!isMobile) return null;                 // desktop uses a top navbar
  const bottomPad = Math.max(insets.bottom, 12); // FLOOR of 12 even when inset=0
  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {/* map state.routes → Pressable with icon + label, navigation.navigate(route.name) */}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <CustomTabBar {...p} />} screenOptions={{ headerShown: false }}>
      {/* <Tabs.Screen .../> for each tab */}
    </Tabs>
  );
}
```

**The universal rule for ALL bottom-anchored UI** (tab bar, sticky CTA bars,
scroll-content bottom padding): never trust the raw inset — use
`Math.max(insets.bottom, FLOOR)`. We applied this to the tab bar (floor 12),
the property-detail sticky "Enquire" bar (floor 8), and the `<Page>` scroll
content (floor 12). Verify by measuring in a headless browser:
`el.getBoundingClientRect().bottom <= window.innerHeight`.

### Android edge-to-edge config (so insets report correctly in the APK)
Add to `app.json`:
```json
"androidStatusBar":     { "barStyle": "dark-content", "backgroundColor": "#ffffff" },
"androidNavigationBar": { "barStyle": "dark-content", "backgroundColor": "#ffffff" }
```

---

## 15. Safe-area: the standard wrapper pattern

- Root: `<SafeAreaProvider>` in `app/_layout.tsx` (once).
- Screens: `SafeAreaView` with `edges={["top"]}` only (let the custom tab bar /
  sticky bars own the bottom via the floor rule above).
- Every scroll container that can reach the bottom gets
  `contentContainerStyle={{ paddingBottom: BASE + Math.max(insets.bottom, FLOOR) }}`.
- Add `overflow: "hidden"` to the root `safe` style on every screen to kill
  accidental horizontal scroll on web (a stray wide child otherwise "cuts" the page).

---

## 16. Responsive: one codebase, phone + browser + desktop

- `useLayout()` → `{ isMobile (<768), isTablet, isDesktop (>=1100), contentMaxWidth }`.
- **Desktop** = top navbar (`<TopNav>`); **mobile** = custom bottom tabs + a compact
  mobile header. Toggle on `isMobile`.
- **Cards in a wrapping grid:** on mobile give them `width: "100%"` (one per row).
  `flex: 1` inside `flexWrap:"row"` wraps badly — pass an explicit width:
  `const cardWidth = isMobile ? "100%" : isDesktop ? 280 : 320;`
- Panel/admin rows with many columns: add `flexWrap: "wrap"` + `minWidth: 0` on the
  flex child so they stack instead of overflowing on phones.
- Reduce panel/content padding on mobile (`spacing.md` not `spacing.xl`).
- **Verify responsiveness for real** with the headless browser at 375px:
  `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow)
  on every screen. Don't eyeball it.

---

## 17. Web `<TextInput>` focus outline

RN Web shows an ugly focus ring. Removing it via a style key trips TS
(`outlineStyle` isn't in RN's type). Don't put it in `StyleSheet.create`. Instead
export one loose token and spread it inline:
```ts
// theme.ts
export const webNoOutline = { outlineStyle: "none" } as object;
// usage
<TextInput style={[styles.input, webNoOutline]} />
```

---

## 18. tsconfig: kill the TS 7.0 deprecation warnings

Expo's base sets `moduleResolution: "node"` (legacy) and people add `baseUrl` for
path aliases — both are deprecated and warn under TS 5.9+. Fix WITHOUT
`ignoreDeprecations` by using modern resolution (what Metro uses anyway):
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "paths": { "@/*": ["./*"] }   // no baseUrl needed under "bundler"
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

---

## 19. Premium UX patterns that made the demo feel real

- **Modal/bottom-sheet, not inline reveal.** First version revealed agent contact
  *inline far down the page* → felt broken ("have to scroll to find it"). Replaced
  with a `<Modal transparent animationType={isMobile?"slide":"fade"}>` bottom sheet
  (mobile) / centered dialog (desktop) that pops instantly. Use this shape for any
  "show me more / contact / filters" action.
- **Auth-gated content done right.** Logged-out users see a *masked* preview
  (`+91 98•••• ••3`, `ra•••@domain`) + a login CTA; logged-in users get the real
  phone/WhatsApp/email + the action auto-logs a lead. Masking sells the gate.
- **Filters as a sheet** with removable active-filter pills + a live "Show N
  results" button + "Clear all". Quick chips stay on the page; deep filters live in
  the sheet.
- **Long landing page** = many small sections (hero search, trust stats, category
  grid, featured, cities, recently-added, popular localities, "why us", top agents,
  CTA banner, popular searches, footer). Each section is tiny; together they read
  as a real product.
- **Hand-built charts** (horizontal bars from `<View>` widths) — no chart dep
  needed for dashboards.

---

## 20. Roles & hidden admin (don't expose admin publicly)

- Public auth offers only consumer-facing roles (e.g. customer + agent/owner).
  **Never** put "Admin" in the public signup.
- Admin is a **separate hidden console** at `/admin` with its own dark, full-screen
  staff-login screen ("Authorized personnel only"), reachable only by typing the
  URL. Validate **both** an admin email and password (from env), not just a password
  — a lone password field next to an ignored email box looks broken.
- Remove admin/agent panel links from the public navbar and profile menu.

---

## 21. Env vars — exactly what goes where (and what breaks it)

`EXPO_PUBLIC_*` vars are **inlined into the bundle at build time** (web AND apk).

| Var | Local `.env` | Vercel env | Why |
|-----|--------------|------------|-----|
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000/api` | **DO NOT SET** | Prod must use same-origin `/api`. `vercel-build` deletes it. Setting it in Vercel **breaks all API calls.** |
| `EXPO_PUBLIC_ADMIN_EMAIL` | set | **set** | admin gate |
| `EXPO_PUBLIC_ADMIN_PASSWORD` | set | **set** | admin gate |

- `.env` is gitignored → never reaches Vercel (correct). The localhost URL there is
  safe because `config.ts` ignores localhost on native and `vercel-build` strips it
  for web prod.
- No hardcoded URLs anywhere except `lib/config.ts`. Verify with a grep for
  `http://localhost` / your domain across `*.ts*` before deploying — only `config.ts`
  comments and image-CDN URLs should match.

---

## 22. Building the APK (the actual flow that worked)

```powershell
eas login                                   # your Expo account (free)
cd apps/mobile
eas init                                     # first time: creates EAS project + projectId
eas build --platform android --profile preview   # cloud build → prints .apk link (~10-20 min)
```
- First build prompts "Generate a new Android Keystore?" → **Yes** (EAS manages signing).
- `preview` profile = direct-install APK (sideload / share). `production` = versioned.
- Installed APK = **offline demo**: it ignores the baked-in localhost URL (native
  guard) and uses the bundled `packages/data` catalog. Browsing/search/favorites
  work standalone; admin/agent *writes* show an offline notice (web-only).
- To make the APK hit your LIVE site instead of offline data: add a build profile
  with `"env": { "EXPO_PUBLIC_API_URL": "https://<app>.vercel.app/api" }` (a real
  https URL passes the localhost guard).

---

## 23. Local dev when `expo start --web` crashes on a network check

On some machines `npm run web` (= `expo start --web`) dies during startup with a
fetch stack trace — Expo's online "dependency doctor" check failing on the network.
Two workarounds:
- Disable the check: `$env:EXPO_NO_DEPENDENCY_VALIDATION=1; npm run web`
- Or QA against the production build directly: `npx expo export -p web` then serve
  `dist/` with any static server that has an SPA fallback (rewrite unknown paths to
  `/index.html`). This is closer to prod and never hits the doctor check.

---

## 24. The pre-ship verification ritual (do all four)

1. `npx expo install --check` → no version mismatches.
2. `npx tsc --noEmit` (app) AND typecheck the serverless fn → exit 0.
3. `npx expo export -p web` → ends `Exported: dist`.
4. Serve `dist/`, open at **375px** in a real (headless) browser, and for each
   screen assert: renders content (not blank), **no console errors**, and
   `scrollWidth === clientWidth` (no horizontal cut). Then check the bottom tab
   labels aren't clipped (`profileLabel.bottom <= window.innerHeight`).

If all four pass, web deploy and APK build will both work.

---

## 25. Updated fast-start checklist (supersedes §12 for new apps)

1. `create-expo-app` + npm workspaces (apps/mobile, packages/data, mock-api, api).
2. **Immediately run `npx expo install --check` and pin the SDK-correct versions**
   (esp. async-storage 1.x, add expo-font if vector-icons is v14). §13.
3. tsconfig with `moduleResolution: "bundler"` (no baseUrl). §18.
4. `lib/config.ts` with the localhost-on-native guard + `webNoOutline` token. §17.
5. `packages/data` = single source of truth; mirror routes in Express + `api/[...path].ts`.
6. Custom bottom tab bar with `Math.max(insets.bottom, 12)`; `<SafeAreaView edges={["top"]}>`;
   `overflow:"hidden"` on roots. §14–16.
7. Responsive: `useLayout()`, full-width cards on mobile, top navbar on desktop.
8. Hidden admin console + public roles only. §20.
9. `vercel.json` / `eas.json` shapes verbatim; env table §21.
10. Run the §24 verification ritual before every deploy/build.
```
