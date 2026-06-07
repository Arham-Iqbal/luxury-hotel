// Desktop top navbar. Hidden on mobile (mobile uses the custom bottom tabs).
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize, useLayout, shadow, fonts, tracking } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { useAuth } from "@/store/auth";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "The Collection" },
  { href: "/bookings", label: "My Journeys" },
  { href: "/profile", label: "Account" },
] as const;

export function TopNav() {
  const { isMobile, contentMaxWidth } = useLayout();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  if (isMobile) return null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
        <Link href="/" asChild>
          <Pressable style={styles.brand}>
            <View style={styles.logoMark}>
              <Ionicons name="diamond" size={16} color={colors.navy} />
            </View>
            <View>
              <Text style={styles.brandText}>{BRAND.name}</Text>
              <Text style={styles.brandSub}>EST. MMXXVI</Text>
            </View>
          </Pressable>
        </Link>

        <View style={styles.links}>
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href as never} asChild>
                <Pressable style={styles.linkBtn}>
                  <Text style={[styles.linkText, active && styles.linkActive]}>{l.label}</Text>
                  {active && <View style={styles.linkUnderline} />}
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View style={styles.right}>
          {user ? (
            <Pressable style={styles.avatarBtn} onPress={() => router.push("/profile")}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{user.name.split(" ")[0]}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.signInBtn} onPress={() => router.push("/profile")}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderGold, alignItems: "center", ...shadow.soft, zIndex: 10 },
  inner: { width: "100%", flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, height: 80, gap: spacing.lg },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoMark: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", ...shadow.gold },
  brandText: { fontSize: fontSize.xl, fontFamily: fonts.serif, color: colors.navy, letterSpacing: 1.5 },
  brandSub: { fontSize: 9, fontFamily: fonts.sansSemi, color: colors.textFaint, letterSpacing: tracking.wide, marginTop: -2 },
  links: { flexDirection: "row", alignItems: "center", flex: 1, marginLeft: spacing.xxl, gap: spacing.xl },
  linkBtn: { paddingVertical: 8 },
  linkText: { fontSize: fontSize.md, color: colors.textMuted, fontFamily: fonts.sansMed },
  linkActive: { color: colors.navy, fontFamily: fonts.sansSemi },
  linkUnderline: { height: 1.5, backgroundColor: colors.gold, marginTop: 7, borderRadius: 2 },
  right: { flexDirection: "row", alignItems: "center" },
  signInBtn: { paddingHorizontal: spacing.lg, height: 44, justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.navy, ...shadow.soft },
  signInText: { color: colors.surface, fontFamily: fonts.sansBold, fontSize: fontSize.md },
  avatarBtn: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderGold },
  avatarText: { color: colors.gold, fontFamily: fonts.serif, fontSize: fontSize.md },
  userName: { fontFamily: fonts.sansSemi, color: colors.text, fontSize: fontSize.md },
});
