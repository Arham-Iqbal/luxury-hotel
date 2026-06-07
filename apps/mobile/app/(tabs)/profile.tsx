import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Page } from "@/components/Page";
import { Button } from "@/components/ui";
import { colors, spacing, radius, fontSize, webNoOutline, shadow, fonts } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { useAuth } from "@/store/auth";
import { useBookings } from "@/store/bookings";
import { useFavorites } from "@/store/favorites";
import type { User } from "@aurelia/data";

export default function Profile() {
  const user = useAuth((s) => s.user);
  return <Page scroll>{user ? <Account user={user} /> : <AuthForm />}</Page>;
}

function AuthForm() {
  const login = useAuth((s) => s.login);
  const signup = useAuth((s) => s.signup);
  const [mode, setMode] = useState<"login" | "signup">("login");
  // Public roles only — never expose Admin here (playbook §20).
  const [role, setRole] = useState<User["role"]>("traveler");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 4) return setError("Password must be at least 4 characters.");
    if (mode === "signup" && name.trim().length < 2) return setError("Please enter your name.");
    setError("");
    if (mode === "signup") signup(name.trim(), email.trim(), role);
    else login(email.trim());
  };

  return (
    <View style={styles.authWrap}>
      <View style={styles.authCard}>
        <View style={styles.logoMark}>
          <Ionicons name="diamond" size={20} color={colors.navy} />
        </View>
        <Text style={styles.authTitle}>{mode === "login" ? "Welcome back" : "Join Aurelia"}</Text>
        <Text style={styles.authSub}>
          {mode === "login" ? "Sign in to manage your trips and saved stays." : "Create a free account to book and save extraordinary stays."}
        </Text>

        {mode === "signup" && (
          <>
            <Text style={styles.label}>I'm a…</Text>
            <View style={styles.roleRow}>
              <RolePick label="Traveler" icon="airplane-outline" active={role === "traveler"} onPress={() => setRole("traveler")} />
              <RolePick label="Property host" icon="business-outline" active={role === "host"} onPress={() => setRole("host")} />
            </View>
            <Field label="Full name">
              <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textFaint} style={[styles.input, webNoOutline]} />
            </Field>
          </>
        )}
        <Field label="Email">
          <TextInput value={email} onChangeText={setEmail} placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textFaint} style={[styles.input, webNoOutline]} />
        </Field>
        <Field label="Password">
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry placeholderTextColor={colors.textFaint} style={[styles.input, webNoOutline]} />
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label={mode === "login" ? "Sign in" : "Create account"} variant="primary" full onPress={submit} style={{ marginTop: spacing.sm }} />

        <Pressable onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ marginTop: spacing.md }}>
          <Text style={styles.switchText}>
            {mode === "login" ? "New here? " : "Already a member? "}
            <Text style={styles.switchLink}>{mode === "login" ? "Create an account" : "Sign in"}</Text>
          </Text>
        </Pressable>

        <Text style={styles.demoHint}>Demo: any email + password works.</Text>
      </View>
    </View>
  );
}

function Account({ user }: { user: User }) {
  const logout = useAuth((s) => s.logout);
  const bookingCount = useBookings((s) => s.bookings.length);
  const savedCount = useFavorites((s) => s.ids.length);

  const menu: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: "person-outline", label: "Personal information" },
    { icon: "card-outline", label: "Payment methods" },
    { icon: "notifications-outline", label: "Notifications" },
    { icon: "ribbon-outline", label: `Membership · ${user.memberTier}` },
    { icon: "headset-outline", label: "Contact concierge" },
    { icon: "shield-checkmark-outline", label: "Privacy & security" },
  ];

  return (
    <View>
      <View style={styles.profileHead}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.profileName} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
          <View style={styles.tierPill}>
            <Ionicons name="ribbon" size={12} color={colors.navy} />
            <Text style={styles.tierText}>{user.memberTier} member</Text>
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        <Stat value={bookingCount} label="Trips" />
        <Stat value={savedCount} label="Saved" />
        <Stat value={user.role === "host" ? "Host" : "Traveler"} label="Account" />
      </View>

      <View style={styles.menu}>
        {menu.map((m, i) => (
          <Pressable key={m.label} style={[styles.menuRow, i < menu.length - 1 && styles.menuBorder]}>
            <Ionicons name={m.icon} size={20} color={colors.textMuted} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
        ))}
      </View>

      <Button label="Sign out" variant="outline" full onPress={logout} style={{ marginTop: spacing.lg }} />
      <Text style={styles.version}>{BRAND.full} · v1.0.0 — demo portfolio build</Text>
    </View>
  );
}

function RolePick({ label, icon, active, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.rolePick, active && styles.rolePickActive]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? colors.navy : colors.textMuted} />
      <Text style={[styles.roleText, active && styles.roleTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  authWrap: { alignItems: "center", marginTop: spacing.xl },
  authCard: { width: "100%", maxWidth: 440, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  logoMark: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  authTitle: { fontSize: fontSize.xxl, fontFamily: fonts.serifBold, color: colors.text },
  authSub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4, lineHeight: 21 },
  label: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text, marginBottom: 6, marginTop: spacing.md },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  rolePick: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 46, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  rolePickActive: { borderColor: colors.navy, backgroundColor: colors.surfaceAlt },
  roleText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "700" },
  roleTextActive: { color: colors.navy },
  input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: fontSize.md, color: colors.text },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: "600" },
  switchText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: "center" },
  switchLink: { color: colors.navy, fontWeight: "800" },
  demoHint: { fontSize: fontSize.xs, color: colors.textFaint, textAlign: "center", marginTop: spacing.md },
  profileHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.lg },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  bigAvatarText: { color: colors.gold, fontSize: fontSize.xxl, fontFamily: fonts.serif },
  profileName: { fontSize: fontSize.xxl, fontFamily: fonts.serifSemi, color: colors.text },
  profileEmail: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 2 },
  tierPill: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: colors.goldSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: 6 },
  tierText: { fontSize: fontSize.xs, fontWeight: "800", color: colors.navy },
  statRow: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg, ...shadow.soft },
  stat: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  statValue: { fontSize: fontSize.xl, fontFamily: fonts.serifSemi, color: colors.navy },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  menu: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, height: 56 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: "600" },
  version: { fontSize: fontSize.xs, color: colors.textFaint, textAlign: "center", marginTop: spacing.lg },
});
