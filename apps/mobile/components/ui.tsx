// Small reusable UI atoms used across screens.
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, radius, fontSize, shadow, fonts, tracking, gradients } from "@/lib/theme";

// --- Typography ---

export function Display({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: fonts.serifBold, color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function Kicker({ label, tone = "gold", center }: { label: string; tone?: "gold" | "muted"; center?: boolean }) {
  return (
    <View style={[styles.kickerRow, center && { justifyContent: "center" }]}>
      <View style={[styles.kickerLine, { backgroundColor: tone === "gold" ? colors.gold : colors.textFaint }]} />
      <Text style={[styles.kickerText, { color: tone === "gold" ? colors.textGold : colors.textMuted }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={["transparent", colors.borderGold, "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[{ height: 1, width: "100%" }, style]}
    />
  );
}

// --- Atoms ---

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "gold" | "dark" | "glass" }) {
  const bg =
    tone === "gold" ? colors.gold : tone === "dark" ? colors.navy : tone === "glass" ? "rgba(255,255,255,0.14)" : colors.surfaceAlt;
  const fg = tone === "neutral" ? colors.textMuted : colors.surface;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        tone === "glass" && { borderWidth: 1, borderColor: "rgba(231,207,148,0.4)" },
      ]}
    >
      <Text style={[styles.badgeText, { color: tone === "glass" ? colors.goldSoft : fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Rating({ value, count, light }: { value: number; count?: number; light?: boolean }) {
  return (
    <View style={styles.ratingRow}>
      <Ionicons name="star" size={13} color={colors.star} />
      <Text style={[styles.ratingValue, light && { color: colors.textOnDark }]}>{value.toFixed(1)}</Text>
      {count !== undefined && (
        <Text style={[styles.ratingCount, light && { color: colors.textOnDarkMuted }]}>({count.toLocaleString("en-IN")})</Text>
      )}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  style,
  loading,
  disabled,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "gold" | "outline" | "ghost" | "goldOutline";
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
  const isOutline = variant === "outline" || variant === "ghost" || variant === "goldOutline";
  const fg =
    variant === "outline" ? colors.navy : variant === "goldOutline" ? colors.gold : variant === "ghost" ? colors.navy : variant === "gold" ? colors.navy : colors.surface;

  const inner = (
    <View style={styles.btnInner}>
      {icon && <Ionicons name={icon} size={16} color={fg} style={{ marginRight: 7 }} />}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </View>
  );

  if (variant === "gold") {
    return (
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        style={({ pressed }) => [styles.btn, full && { alignSelf: "stretch" }, { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }, shadow.gold, style]}
      >
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
          {loading ? <ActivityIndicator color={fg} size="small" /> : inner}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg = variant === "primary" ? colors.navy : "transparent";
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        styles.btnPad,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === "outline" && styles.btnOutline,
        variant === "goldOutline" && styles.btnGoldOutline,
        variant === "ghost" && styles.btnGhost,
        full && { alignSelf: "stretch" },
        variant === "primary" && shadow.soft,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : inner}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  subtitle,
  kicker,
  action,
  center,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
  action?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <View style={[styles.sectionHeader, center && { flexDirection: "column", alignItems: "center", textAlign: "center" } as ViewStyle]}>
      <View style={[{ flex: 1, minWidth: 0 }, center && { alignItems: "center" }]}>
        {kicker ? <Kicker label={kicker} center={center} /> : null}
        <Text style={[styles.sectionTitle, center && { textAlign: "center" }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSub, center && { textAlign: "center" }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  kickerLine: { width: 28, height: 1.5 },
  kickerText: { fontSize: fontSize.xs, fontFamily: fonts.sansSemi, letterSpacing: tracking.wider },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, alignSelf: "flex-start" },
  badgeText: { fontSize: fontSize.xs, fontFamily: fonts.sansSemi, letterSpacing: 0.3 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingValue: { fontSize: fontSize.sm, fontFamily: fonts.sansBold, color: colors.text },
  ratingCount: { fontSize: fontSize.xs, color: colors.textFaint, marginLeft: 2, fontFamily: fonts.sans },
  btn: { height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  btnPad: { paddingHorizontal: spacing.lg },
  btnGrad: { flex: 1, alignSelf: "stretch", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  btnOutline: { borderWidth: 1.5, borderColor: colors.navy, height: 50, backgroundColor: "transparent" },
  btnGoldOutline: { borderWidth: 1.5, borderColor: colors.gold, height: 50, backgroundColor: "transparent" },
  btnGhost: { height: 42, paddingHorizontal: spacing.md },
  btnInner: { flexDirection: "row", alignItems: "center" },
  btnText: { fontSize: fontSize.md, fontFamily: fonts.sansBold, letterSpacing: 0.4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: spacing.lg, gap: spacing.md },
  sectionTitle: { fontSize: fontSize.xxl, fontFamily: fonts.serifBold, color: colors.text, letterSpacing: tracking.tight },
  sectionSub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 6, fontFamily: fonts.sans, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
});
