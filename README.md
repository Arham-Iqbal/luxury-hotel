# Aurelia Stays — luxury travel & hotel booking

A portfolio demo built from **one Expo codebase → Android APK + website + hidden admin console**, backed by a mock API. Renders the same React Native components as a native app and a responsive website via `react-native-web`.

> Demo project for portfolio purposes — not a real booking service. No payments are taken.

## What's inside

| Deliverable | How |
|-------------|-----|
| **Website** | Expo web export (static) → Vercel |
| **Android APK** | EAS cloud build (offline-safe, bundled catalog) |
| **Admin console** | Hidden web-only route at `/admin` |
| **Mock API** | Express locally, Vercel serverless in prod |

### Features
- Luxury landing page (hero search, trust stats, categories, featured stays, destinations, experiences, why-us, CTA, footer)
- Explore with live search, quick category chips, sort, and a **filter sheet** with removable pills + live result count
- Hotel detail: gallery, highlights, amenities, room selection, reviews, sticky reserve bar (mobile) / booking card (desktop)
- Booking flow in a bottom-sheet modal → confirmation with code, persisted to **My Trips**
- Saved stays (favorites), client-side auth, membership tiers — all persisted with AsyncStorage
- **Hidden ops console** (`/admin`): staff login (email + password), KPIs, hand-built revenue/destination charts, recent bookings table

## Tech stack
Expo SDK 52 · React Native 0.76.9 · React 18.3.1 · TypeScript · expo-router · Zustand 5 · TanStack Query 5 · react-native-web · npm workspaces.

## Monorepo layout
```
apps/mobile/     Expo app → APK + web + admin
packages/data/   shared catalog + types (single source of truth)
mock-api/        Express mock API for local dev
api/             Vercel serverless mirror of the API
scripts/         hoisting fix, gen-api-data, vercel-build
```

## Local dev (Windows / PowerShell)
```powershell
npm install        # postinstall fixes expo-router hoisting
npm run api        # terminal 1 → Express mock API (http://localhost:4000)
npm run web        # terminal 2 → Expo web dev server
```
- Storefront: `/`  ·  Admin console: `/admin`
- Admin demo login: `staff@aurelia.travel` / `aurelia-admin`

If `npm run web` dies on a network/doctor check:
```powershell
$env:EXPO_NO_DEPENDENCY_VALIDATION=1; npm run web
```

## Deploy the website (Vercel)
1. Push to GitHub → Vercel → Add New → Project → import the repo.
2. Leave build settings to `vercel.json` (don't override). Root Directory = repo root.
3. Set env vars `EXPO_PUBLIC_ADMIN_EMAIL` + `EXPO_PUBLIC_ADMIN_PASSWORD`. **Do not** set `EXPO_PUBLIC_API_URL` (prod uses same-origin `/api`).

## Build the Android APK (EAS)
```powershell
npm install -g eas-cli
eas login
cd apps/mobile
eas init
eas build --platform android --profile preview
```
The installed APK is an offline demo using the bundled `@aurelia/data` catalog.

## Pre-ship verification
```powershell
npx expo install --check          # no version mismatches
npm run typecheck                 # exit 0
cd apps/mobile; npx expo export -p web   # ends "Exported: dist"
```
Then serve `dist/` and check each screen at 375px: renders, no console errors, no horizontal overflow, tab labels not clipped.
