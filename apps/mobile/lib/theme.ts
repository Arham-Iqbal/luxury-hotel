// Design tokens — the single place colors/spacing/type live (playbook §10).
// Aurelia "Midnight & Gold": deep midnight navy + champagne gold + warm ivory.
// Editorial serif display (Playfair / Cormorant) + Inter body.
import { useWindowDimensions } from "react-native";

export const colors = {
  // brand — midnight
  navy: "#0B1424",
  navyDeep: "#070D18",
  ink: "#121E33",
  inkSoft: "#1A2942",
  // gold
  gold: "#C9A24B",
  goldBright: "#D8B461",
  goldSoft: "#E7CF94",
  goldDim: "#9C7C36",
  // surfaces
  bg: "#FAF7F0",
  bgWarm: "#F5EFE3",
  surface: "#FFFFFF",
  surfaceAlt: "#F3ECDD",
  surfaceDark: "#101B2E",
  // text
  text: "#141C2B",
  textMuted: "#5A6678",
  textFaint: "#9AA3B2",
  textOnDark: "#F5EFE3",
  textOnDarkMuted: "#A6B4C8",
  textGold: "#C9A24B",
  // utility
  border: "#EAE2D2",
  borderSoft: "#F0E9DA",
  borderDark: "#243450",
  borderGold: "rgba(201,162,75,0.35)",
  success: "#2F7D5B",
  danger: "#B4413C",
  warning: "#C8862A",
  star: "#D4A23A",
  overlay: "rgba(7,13,24,0.62)",
  // gradient stops
  heroTop: "rgba(7,13,24,0.15)",
  heroMid: "rgba(7,13,24,0.45)",
  heroBottom: "rgba(7,13,24,0.92)",
} as const;

// Cinematic gradient presets (use with expo-linear-gradient).
export const gradients = {
  hero: ["rgba(7,13,24,0.15)", "rgba(7,13,24,0.50)", "rgba(7,13,24,0.94)"] as const,
  heroSoft: ["rgba(7,13,24,0.10)", "transparent", "rgba(7,13,24,0.55)"] as const,
  cardOverlay: ["transparent", "rgba(7,13,24,0.10)", "rgba(7,13,24,0.88)"] as const,
  midnight: ["#0B1424", "#121E33", "#0B1424"] as const,
  gold: ["#E7CF94", "#C9A24B", "#9C7C36"] as const,
  goldFaint: ["rgba(201,162,75,0.16)", "rgba(201,162,75,0.02)"] as const,
};

// Font family tokens (loaded in app/_layout.tsx).
export const fonts = {
  serifBold: "PlayfairDisplay_800ExtraBold",
  serif: "PlayfairDisplay_700Bold",
  serifSemi: "PlayfairDisplay_600SemiBold",
  serifLight: "CormorantGaramond_600SemiBold",
  serifLightMed: "CormorantGaramond_500Medium",
  sans: "Inter_400Regular",
  sansMed: "Inter_500Medium",
  sansSemi: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  xxl: 34,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 21,
  xxl: 27,
  display: 36,
  hero: 52,
  giant: 68,
} as const;

export const shadow = {
  card: {
    shadowColor: "#0B1424",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 5,
  },
  soft: {
    shadowColor: "#0B1424",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  gold: {
    shadowColor: "#C9A24B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  lift: {
    shadowColor: "#0B1424",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 44,
    elevation: 8,
  },
} as const;

// Removing the RN-Web focus ring trips TS — keep it loose and spread inline (§17).
export const webNoOutline = { outlineStyle: "none" } as object;

// Letter-spacing presets for that luxury "kicker" look.
export const tracking = {
  wide: 3,
  wider: 4.5,
  tight: -0.5,
  tighter: -1.2,
} as const;

export function formatPrice(n: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    // Fallback with Indian lakh/crore grouping.
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  }
}

// Compact ₹ for dashboards: ₹32.2 Cr / ₹12.5 L / ₹75,700.
export function formatPriceCompact(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const isDesktop = width >= 1100;
  const contentMaxWidth = 1240;
  return { width, height, isMobile, isTablet, isDesktop, contentMaxWidth };
}
