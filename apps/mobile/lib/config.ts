// The ONLY place the API base URL is resolved (playbook §8/§10/§21).
// - web dev:  EXPO_PUBLIC_API_URL = http://localhost:4000/api
// - web prod: empty -> same-origin /api (vercel-build strips the env var)
// - APK:      localhost is ignored on native -> offline bundled data fallback
import { Platform } from "react-native";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

const isWeb = Platform.OS === "web";
const RAW = process.env.EXPO_PUBLIC_API_URL || extra?.apiUrl || "";
const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(RAW);

// On native, ignore a localhost URL baked into the build so the standalone
// APK falls back to offline data instead of trying to reach the dev machine.
const EXPLICIT = !isWeb && isLocalhost ? "" : RAW;

// Empty on web prod -> same-origin /api. Empty on native -> offline mode.
export const API_BASE = EXPLICIT || (isWeb ? "/api" : "");

export const HAS_REMOTE_API = API_BASE.length > 0;

export const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL || "staff@aurelia.travel";
export const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || "aurelia-admin";

export const BRAND = {
  name: "Aurelia",
  full: "Aurelia Stays",
  tagline: "Extraordinary places, effortlessly booked.",
};
