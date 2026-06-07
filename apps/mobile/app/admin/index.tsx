import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, ActivityIndicator, Modal, Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchAdminStats, fetchAdminBookings } from "@/lib/api";
import { colors, spacing, radius, fontSize, webNoOutline, useLayout, formatPrice, formatPriceCompact, fonts, tracking } from "@/lib/theme";
import { ADMIN_EMAIL } from "@/lib/config";
import { useAdmin } from "@/store/admin";
import { useBookings } from "@/store/bookings";
import { useCatalog, buildCatalog, type NewHotelInput } from "@/store/catalog";
import { CATEGORIES, REGIONS, type AdminStats, type Booking, type Hotel } from "@aurelia/data";

type Tab = "overview" | "properties" | "bookings";

export default function Admin() {
  const authed = useAdmin((s) => s.authed);
  // Admin does writes -> web-only, no offline fallback (playbook §4/§20).
  if (Platform.OS !== "web") return <NativeBlocked />;
  return authed ? <Console /> : <StaffLogin />;
}

function NativeBlocked() {
  return (
    <SafeAreaView style={styles.darkSafe}>
      <View style={styles.blocked}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.gold} />
        <Text style={styles.blockedText}>The admin console is available on the web only.</Text>
      </View>
    </SafeAreaView>
  );
}

function StaffLogin() {
  const signIn = useAdmin((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!signIn(email, password)) setError("Invalid staff credentials.");
  };

  return (
    <SafeAreaView style={styles.darkSafe}>
      <View style={styles.loginWrap}>
        <View style={styles.loginCard}>
          <View style={styles.staffMark}>
            <Ionicons name="shield-checkmark" size={24} color={colors.navy} />
          </View>
          <Text style={styles.loginTitle}>Aurelia Operations</Text>
          <Text style={styles.loginSub}>Authorized personnel only</Text>

          <Text style={styles.darkLabel}>Staff email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="staff@aurelia.travel" placeholderTextColor="#5C6B82" autoCapitalize="none" keyboardType="email-address" style={[styles.darkInput, webNoOutline]} />
          <Text style={styles.darkLabel}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry placeholderTextColor="#5C6B82" onSubmitEditing={submit} style={[styles.darkInput, webNoOutline]} />

          {error ? <Text style={styles.loginError}>{error}</Text> : null}

          <Pressable style={styles.loginBtn} onPress={submit}>
            <Text style={styles.loginBtnText}>Sign in</Text>
          </Pressable>
          <Text style={styles.loginHint}>Demo · {ADMIN_EMAIL} / aurelia-admin</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Console() {
  const router = useRouter();
  const signOut = useAdmin((s) => s.signOut);
  const [tab, setTab] = useState<Tab>("overview");

  // Select stable slices (never a freshly-allocated array — playbook §10),
  // then derive the effective catalog with useMemo.
  const patches = useCatalog((s) => s.patches);
  const addedList = useCatalog((s) => s.added);
  const removedIds = useCatalog((s) => s.removedIds);
  const catalog = useMemo(
    () => buildCatalog({ patches, added: addedList, removedIds }),
    [patches, addedList, removedIds],
  );
  const added = addedList.length;
  const localBookings = useBookings((s) => s.bookings);

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "overview", label: "Overview", icon: "stats-chart-outline" },
    { key: "properties", label: "Properties", icon: "business-outline" },
    { key: "bookings", label: "Bookings", icon: "briefcase-outline" },
  ];

  return (
    <SafeAreaView style={styles.darkSafe} edges={["top"]}>
      <View style={styles.adminHeader}>
        <View style={styles.adminBrand}>
          <View style={styles.staffMarkSm}>
            <Ionicons name="shield-checkmark" size={16} color={colors.navy} />
          </View>
          <View>
            <Text style={styles.adminTitle}>Operations Console</Text>
            <Text style={styles.adminSub}>{ADMIN_EMAIL}</Text>
          </View>
        </View>
        <View style={styles.adminHeaderActions}>
          <Pressable style={styles.headerBtn} onPress={() => router.replace("/")}>
            <Ionicons name="open-outline" size={16} color={colors.textOnDark} />
            <Text style={styles.headerBtnText}>View site</Text>
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={signOut}>
            <Ionicons name="log-out-outline" size={16} color={colors.textOnDark} />
            <Text style={styles.headerBtnText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      {/* tab nav */}
      <View style={styles.tabNav}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
              <Ionicons name={t.icon} size={16} color={active ? colors.gold : colors.textOnDarkMuted} />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{t.label}</Text>
              {t.key === "properties" && <Badge n={catalog.length} />}
              {t.key === "bookings" && <Badge n={localBookings.length} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        {tab === "overview" && <Overview catalogCount={catalog.length} addedCount={added} />}
        {tab === "properties" && <Properties catalog={catalog} />}
        {tab === "bookings" && <BookingsManager />}
        <Text style={styles.adminFooter}>Aurelia Operations · internal demo console</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <View style={styles.tabBadge}>
      <Text style={styles.tabBadgeText}>{n}</Text>
    </View>
  );
}

/* ───────────────────────── OVERVIEW ───────────────────────── */

function Overview({ catalogCount, addedCount }: { catalogCount: number; addedCount: number }) {
  const { isMobile } = useLayout();
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchAdminStats });
  const localBookings = useBookings((s) => s.bookings);

  if (stats.isLoading || !stats.data) return <ActivityIndicator color={colors.gold} style={{ marginTop: 60 }} />;

  // Be defensive: a partial API response must never crash the dashboard.
  const s = stats.data;
  const revenueByMonth = s.revenueByMonth ?? [];
  const topDestinations = s.topDestinations ?? [];
  const bookingsByCategory = s.bookingsByCategory ?? [];
  const totalBookings = s.totalBookings ?? 0;
  const totalRevenue = s.totalRevenue ?? 0;
  const avgNightlyRate = s.avgNightlyRate ?? 0;
  const currency = s.currency ?? "INR";
  const liveRevenue = localBookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.total, 0);

  return (
    <View>
      <View style={styles.kpiRow}>
        <Kpi label="Total bookings" value={(totalBookings + localBookings.length).toLocaleString("en-IN")} icon="briefcase" delta="+12%" />
        <Kpi label="Revenue (6mo)" value={formatPriceCompact(totalRevenue + liveRevenue)} icon="cash" delta="+18%" />
        <Kpi label="Listed estates" value={String(catalogCount)} icon="business" delta={`+${addedCount} added`} />
        <Kpi label="Avg nightly" value={formatPrice(avgNightlyRate, currency)} icon="trending-up" delta="+6%" />
      </View>

      {revenueByMonth.length > 0 && (
        <View style={isMobile ? undefined : styles.chartsRow}>
          <Panel title="Revenue by month" style={isMobile ? undefined : { flex: 1.4 }}>
            <RevenueChart data={revenueByMonth} />
          </Panel>
          <Panel title="Top destinations" style={isMobile ? { marginTop: spacing.lg } : { flex: 1 }}>
            <BarList data={topDestinations.map((d) => ({ label: d.name, value: d.bookings }))} suffix=" bookings" />
          </Panel>
        </View>
      )}

      {bookingsByCategory.length > 0 && (
        <Panel title="Bookings by property type" style={{ marginTop: spacing.lg }}>
          <BarList data={bookingsByCategory.map((c) => ({ label: c.category, value: c.count }))} suffix="" tone="gold" />
        </Panel>
      )}
    </View>
  );
}

/* ───────────────────────── PROPERTIES (CRUD) ───────────────────────── */

function Properties({ catalog }: { catalog: Hotel[] }) {
  const toggleFeatured = useCatalog((s) => s.toggleFeatured);
  const removeHotel = useCatalog((s) => s.removeHotel);
  const resetAll = useCatalog((s) => s.resetAll);
  const [editor, setEditor] = useState<{ open: boolean; hotel?: Hotel }>({ open: false });
  const [search, setSearch] = useState("");

  const filtered = catalog.filter(
    (h) => h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View>
      <View style={styles.propToolbar}>
        <View style={styles.propSearch}>
          <Ionicons name="search" size={16} color={colors.textOnDarkMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search properties…" placeholderTextColor="#5C6B82" style={[styles.propSearchInput, webNoOutline]} />
        </View>
        <Pressable style={styles.addBtn} onPress={() => setEditor({ open: true })}>
          <Ionicons name="add" size={18} color={colors.navy} />
          <Text style={styles.addBtnText}>Add property</Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Text style={styles.propCount}>{filtered.length} {filtered.length === 1 ? "property" : "properties"}</Text>
        <Pressable onPress={resetAll} hitSlop={6}>
          <Text style={styles.resetText}>Reset all changes</Text>
        </Pressable>
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        {filtered.map((h) => (
          <View key={h.id} style={styles.propRow}>
            <Image source={{ uri: h.heroImage }} style={styles.propImg} contentFit="cover" />
            <View style={styles.propInfo}>
              <View style={styles.propTitleRow}>
                <Text style={styles.propName} numberOfLines={1}>{h.name}</Text>
                {h.id.startsWith("cust-") && <Text style={styles.propNew}>NEW</Text>}
              </View>
              <Text style={styles.propMeta} numberOfLines={1}>{h.city}, {h.country} · {h.category}</Text>
              <Text style={styles.propPrice}>{formatPrice(h.pricePerNight, h.currency)} / night · ★ {h.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.propActions}>
              <Pressable style={[styles.iconBtn, h.featured && styles.iconBtnGold]} onPress={() => toggleFeatured(h.id)} hitSlop={4}>
                <Ionicons name={h.featured ? "star" : "star-outline"} size={16} color={h.featured ? colors.navy : colors.textOnDarkMuted} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => setEditor({ open: true, hotel: h })} hitSlop={4}>
                <Ionicons name="create-outline" size={16} color={colors.textOnDark} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => removeHotel(h.id)} hitSlop={4}>
                <Ionicons name="trash-outline" size={16} color="#E2867F" />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {editor.open && <HotelEditor hotel={editor.hotel} onClose={() => setEditor({ open: false })} />}
    </View>
  );
}

function HotelEditor({ hotel, onClose }: { hotel?: Hotel; onClose: () => void }) {
  const { isMobile } = useLayout();
  const addHotel = useCatalog((s) => s.addHotel);
  const updateHotel = useCatalog((s) => s.updateHotel);
  const editing = !!hotel;

  const [name, setName] = useState(hotel?.name ?? "");
  const [city, setCity] = useState(hotel?.city ?? "");
  const [country, setCountry] = useState(hotel?.country ?? "");
  const [region, setRegion] = useState<Hotel["region"]>(hotel?.region ?? "Europe");
  const [category, setCategory] = useState<Hotel["category"]>(hotel?.category ?? "Boutique");
  const [stars, setStars] = useState(hotel?.starRating ?? 5);
  const [price, setPrice] = useState(String(hotel?.pricePerNight ?? 80000));
  const [image, setImage] = useState(hotel?.heroImage ?? "");
  const [tagline, setTagline] = useState(hotel?.tagline ?? "");
  const [featured, setFeatured] = useState(hotel?.featured ?? false);
  const [error, setError] = useState("");

  const save = () => {
    const p = parseInt(price.replace(/[^0-9]/g, ""), 10);
    if (name.trim().length < 2) return setError("Property name is required.");
    if (city.trim().length < 1 || country.trim().length < 1) return setError("City and country are required.");
    if (!p || p < 1000) return setError("Enter a valid nightly price (₹).");
    setError("");

    if (editing && hotel) {
      updateHotel(hotel.id, { name: name.trim(), city: city.trim(), country: country.trim(), region, category, starRating: stars, pricePerNight: p, heroImage: image.trim() || hotel.heroImage, tagline: tagline.trim(), featured });
    } else {
      const input: NewHotelInput = { name: name.trim(), city: city.trim(), country: country.trim(), region, category, starRating: stars, pricePerNight: p, heroImage: image.trim(), tagline: tagline.trim(), description: tagline.trim(), featured };
      addHotel(input);
    }
    onClose();
  };

  return (
    <Modal visible transparent animationType={isMobile ? "slide" : "fade"} onRequestClose={onClose}>
      <Pressable style={styles.editorBackdrop} onPress={onClose}>
        <Pressable style={[styles.editorSheet, isMobile ? styles.editorMobile : styles.editorDesktop]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.editorHead}>
            <Text style={styles.editorTitle}>{editing ? "Edit property" : "Add a new property"}</Text>
            <Pressable onPress={onClose} hitSlop={8}><Ionicons name="close" size={24} color={colors.textOnDark} /></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
            <DField label="Property name"><DInput value={name} onChange={setName} placeholder="e.g. Celestine Cliff Suites" /></DField>
            <View style={styles.editorRow}>
              <DField label="City" flex><DInput value={city} onChange={setCity} placeholder="Santorini" /></DField>
              <DField label="Country" flex><DInput value={country} onChange={setCountry} placeholder="Greece" /></DField>
            </View>

            <DField label="Region">
              <ChipRow options={REGIONS as unknown as string[]} value={region} onPick={(v) => setRegion(v as Hotel["region"])} />
            </DField>
            <DField label="Category">
              <ChipRow options={CATEGORIES as unknown as string[]} value={category} onPick={(v) => setCategory(v as Hotel["category"])} />
            </DField>

            <View style={styles.editorRow}>
              <DField label="Star rating" flex>
                <View style={styles.starPick}>
                  {[3, 4, 5].map((n) => (
                    <Pressable key={n} style={[styles.starOpt, stars === n && styles.starOptActive]} onPress={() => setStars(n)}>
                      <Text style={[styles.starOptText, stars === n && styles.starOptTextActive]}>{n}★</Text>
                    </Pressable>
                  ))}
                </View>
              </DField>
              <DField label="Nightly price (₹)" flex><DInput value={price} onChange={setPrice} placeholder="80000" keyboard="number-pad" /></DField>
            </View>

            <DField label="Tagline"><DInput value={tagline} onChange={setTagline} placeholder="Caldera-edge suites with private plunge pools" /></DField>
            <DField label="Hero image URL"><DInput value={image} onChange={setImage} placeholder="https://images.unsplash.com/…" /></DField>

            <Pressable style={styles.featureToggle} onPress={() => setFeatured((f) => !f)}>
              <View style={[styles.checkbox, featured && styles.checkboxOn]}>
                {featured && <Ionicons name="checkmark" size={14} color={colors.navy} />}
              </View>
              <Text style={styles.featureText}>Feature on the homepage</Text>
            </Pressable>

            {error ? <Text style={styles.loginError}>{error}</Text> : null}
          </ScrollView>

          <Pressable style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>{editing ? "Save changes" : "Add property"}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ───────────────────────── BOOKINGS MANAGER ───────────────────────── */

function BookingsManager() {
  const localBookings = useBookings((s) => s.bookings);
  const cancelBooking = useBookings((s) => s.cancelBooking);
  const remote = useQuery({ queryKey: ["admin", "bookings"], queryFn: fetchAdminBookings });
  const bookings: Booking[] = [...(remote.data ?? []), ...localBookings];

  return (
    <Panel title={`Bookings (${bookings.length})`}>
      {bookings.length === 0 ? (
        <Text style={styles.emptyTable}>No bookings yet. Make one on the site to manage it here.</Text>
      ) : (
        <View>
          {bookings.map((b, i) => (
            <View key={b.id + i} style={[styles.bkRow, i < bookings.length - 1 && styles.tableBorder]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.bkHotel} numberOfLines={1}>{b.hotelName}</Text>
                <Text style={styles.bkMeta} numberOfLines={1}>{b.guestName} · {b.confirmationCode} · {formatPrice(b.total, b.currency)}</Text>
              </View>
              <StatusTag status={b.status} />
              {b.status === "confirmed" && (
                <Pressable style={styles.bkCancel} onPress={() => cancelBooking(b.id)} hitSlop={4}>
                  <Text style={styles.bkCancelText}>Cancel</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </Panel>
  );
}

function StatusTag({ status }: { status: Booking["status"] }) {
  const map = {
    confirmed: { bg: "rgba(111,207,151,0.18)", fg: "#6FCF97", label: "Confirmed" },
    completed: { bg: "rgba(166,180,200,0.18)", fg: colors.textOnDarkMuted, label: "Completed" },
    cancelled: { bg: "rgba(226,134,127,0.18)", fg: "#E2867F", label: "Cancelled" },
  }[status];
  return (
    <View style={[styles.statusTag, { backgroundColor: map.bg }]}>
      <Text style={[styles.statusTagText, { color: map.fg }]}>{map.label}</Text>
    </View>
  );
}

/* ───────────────────────── SHARED BITS ───────────────────────── */

function Kpi({ label, value, icon, delta }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; delta: string }) {
  return (
    <View style={styles.kpi}>
      <View style={styles.kpiIcon}><Ionicons name={icon} size={18} color={colors.gold} /></View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiDelta}>{delta}</Text>
    </View>
  );
}

function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.panel, style]}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DField({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[{ marginTop: spacing.md }, flex && { flex: 1 }]}>
      <Text style={styles.darkLabel}>{label}</Text>
      {children}
    </View>
  );
}

function DInput({ value, onChange, placeholder, keyboard }: { value: string; onChange: (v: string) => void; placeholder?: string; keyboard?: "default" | "number-pad" }) {
  return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#5C6B82" keyboardType={keyboard ?? "default"} style={[styles.darkInput, { marginTop: 0 }, webNoOutline]} />;
}

function ChipRow({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable key={o} style={[styles.chip, active && styles.chipActive]} onPress={() => onPick(o)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RevenueChart({ data }: { data: AdminStats["revenueByMonth"] }) {
  const rows = data ?? [];
  if (!rows.length) return null;
  const max = Math.max(...rows.map((d) => d.revenue), 1);
  return (
    <View style={styles.revChart}>
      {rows.map((d) => (
        <View key={d.month} style={styles.revCol}>
          <Text style={styles.revValue}>{(d.revenue / 10000000).toFixed(1)}Cr</Text>
          <View style={styles.revBarTrack}><View style={[styles.revBar, { height: `${(d.revenue / max) * 100}%` }]} /></View>
          <Text style={styles.revMonth}>{d.month}</Text>
        </View>
      ))}
    </View>
  );
}

function BarList({ data, suffix, tone = "navy" }: { data: { label: string; value: number }[]; suffix: string; tone?: "navy" | "gold" }) {
  const rows = data ?? [];
  if (!rows.length) return null;
  const max = Math.max(...rows.map((d) => d.value), 1);
  return (
    <View style={{ gap: spacing.md }}>
      {rows.map((d) => (
        <View key={d.label}>
          <View style={styles.barHead}>
            <Text style={styles.barLabel}>{d.label}</Text>
            <Text style={styles.barValue}>{d.value.toLocaleString("en-IN")}{suffix}</Text>
          </View>
          <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(d.value / max) * 100}%`, backgroundColor: tone === "gold" ? colors.gold : "#3C5A82" }]} /></View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  darkSafe: { flex: 1, backgroundColor: colors.navyDeep },
  blocked: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  blockedText: { color: colors.textOnDark, fontSize: fontSize.lg, textAlign: "center", fontWeight: "600" },
  loginWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  loginCard: { width: "100%", maxWidth: 420, backgroundColor: colors.ink, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.borderDark },
  staffMark: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  loginTitle: { fontSize: fontSize.xxl, fontFamily: fonts.serifBold, color: colors.textOnDark },
  loginSub: { fontSize: fontSize.sm, color: colors.gold, marginTop: 2, letterSpacing: 1, textTransform: "uppercase", fontWeight: "700" },
  darkLabel: { fontSize: fontSize.sm, color: colors.textOnDarkMuted, fontFamily: fonts.sansSemi, marginBottom: 6 },
  darkInput: { height: 46, borderWidth: 1, borderColor: colors.borderDark, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: fontSize.md, color: colors.textOnDark, backgroundColor: colors.navyDeep, fontFamily: fonts.sans },
  loginError: { color: "#E2867F", fontSize: fontSize.sm, marginTop: spacing.md, fontWeight: "600" },
  loginBtn: { backgroundColor: colors.gold, height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
  loginBtnText: { color: colors.navy, fontFamily: fonts.sansBold, fontSize: fontSize.md },
  loginHint: { fontSize: fontSize.xs, color: colors.textOnDarkMuted, textAlign: "center", marginTop: spacing.md },
  adminHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderDark, gap: spacing.md, flexWrap: "wrap" },
  adminBrand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  staffMarkSm: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  adminTitle: { fontSize: fontSize.lg, fontFamily: fonts.serifSemi, color: colors.textOnDark },
  adminSub: { fontSize: fontSize.xs, color: colors.textOnDarkMuted },
  adminHeaderActions: { flexDirection: "row", gap: spacing.sm },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, height: 38, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderDark },
  headerBtnText: { color: colors.textOnDark, fontFamily: fonts.sansMed, fontSize: fontSize.sm },
  tabNav: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderDark, flexWrap: "wrap" },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: spacing.md, height: 40, borderRadius: radius.pill, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.borderDark },
  tabBtnActive: { backgroundColor: colors.inkSoft, borderColor: colors.borderGold },
  tabBtnText: { color: colors.textOnDarkMuted, fontFamily: fonts.sansSemi, fontSize: fontSize.sm },
  tabBtnTextActive: { color: colors.textOnDark },
  tabBadge: { backgroundColor: colors.borderDark, minWidth: 20, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  tabBadgeText: { color: colors.textOnDark, fontSize: 10, fontFamily: fonts.sansBold },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  kpi: { flexGrow: 1, flexBasis: 160, minWidth: 0, backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.borderDark },
  kpiIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: "rgba(201,162,75,0.15)", alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  kpiValue: { fontSize: fontSize.xxl, fontFamily: fonts.serifBold, color: colors.textOnDark },
  kpiLabel: { fontSize: fontSize.sm, color: colors.textOnDarkMuted, marginTop: 2 },
  kpiDelta: { fontSize: fontSize.xs, color: "#6FCF97", marginTop: 4, fontFamily: fonts.sansMed },
  chartsRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.lg },
  panel: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderDark },
  panelTitle: { fontSize: fontSize.lg, fontFamily: fonts.serifSemi, color: colors.textOnDark, marginBottom: spacing.md },
  revChart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 180, gap: spacing.sm },
  revCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 6 },
  revValue: { fontSize: fontSize.xs, color: colors.textOnDarkMuted, fontFamily: fonts.sansMed },
  revBarTrack: { width: "70%", flex: 1, justifyContent: "flex-end" },
  revBar: { width: "100%", backgroundColor: colors.gold, borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 4 },
  revMonth: { fontSize: fontSize.xs, color: colors.textOnDarkMuted },
  barHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  barLabel: { fontSize: fontSize.sm, color: colors.textOnDark, fontFamily: fonts.sansMed },
  barValue: { fontSize: fontSize.sm, color: colors.textOnDarkMuted },
  barTrack: { height: 10, backgroundColor: colors.navyDeep, borderRadius: 5, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 5 },
  // properties
  propToolbar: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  propSearch: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.borderDark, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46 },
  propSearchInput: { flex: 1, color: colors.textOnDark, fontSize: fontSize.md, fontFamily: fonts.sans, minWidth: 0 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.gold, paddingHorizontal: spacing.md, height: 46, borderRadius: radius.md },
  addBtnText: { color: colors.navy, fontFamily: fonts.sansBold, fontSize: fontSize.sm },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  propCount: { color: colors.textOnDarkMuted, fontSize: fontSize.sm, fontFamily: fonts.sansMed },
  resetText: { color: "#E2867F", fontSize: fontSize.sm, fontFamily: fonts.sansMed },
  propRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.ink, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderDark, padding: spacing.sm },
  propImg: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.navyDeep },
  propInfo: { flex: 1, minWidth: 0 },
  propTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  propName: { color: colors.textOnDark, fontFamily: fonts.serifSemi, fontSize: fontSize.md, flexShrink: 1 },
  propNew: { color: colors.gold, fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: tracking.wide, borderWidth: 1, borderColor: colors.borderGold, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.sm },
  propMeta: { color: colors.textOnDarkMuted, fontSize: fontSize.xs, marginTop: 2, fontFamily: fonts.sans },
  propPrice: { color: colors.goldSoft, fontSize: fontSize.xs, marginTop: 3, fontFamily: fonts.sansMed },
  propActions: { flexDirection: "row", gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderDark, alignItems: "center", justifyContent: "center", backgroundColor: colors.navyDeep },
  iconBtnGold: { backgroundColor: colors.gold, borderColor: colors.gold },
  // editor modal
  editorBackdrop: { flex: 1, backgroundColor: "rgba(7,13,24,0.78)", justifyContent: "flex-end" },
  editorSheet: { backgroundColor: colors.ink, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderDark },
  editorMobile: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "92%" },
  editorDesktop: { alignSelf: "center", marginVertical: "auto", width: 560, borderRadius: radius.xl, maxHeight: "90%" },
  editorHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  editorTitle: { fontSize: fontSize.xl, fontFamily: fonts.serifBold, color: colors.textOnDark },
  editorRow: { flexDirection: "row", gap: spacing.md },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderDark, backgroundColor: colors.navyDeep },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontSize: fontSize.xs, color: colors.textOnDarkMuted, fontFamily: fonts.sansMed },
  chipTextActive: { color: colors.navy, fontFamily: fonts.sansBold },
  starPick: { flexDirection: "row", gap: spacing.sm },
  starOpt: { flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderDark, alignItems: "center", justifyContent: "center", backgroundColor: colors.navyDeep },
  starOptActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  starOptText: { color: colors.textOnDarkMuted, fontFamily: fonts.sansSemi },
  starOptTextActive: { color: colors.navy },
  featureToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.lg },
  checkbox: { width: 24, height: 24, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.borderGold, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  featureText: { color: colors.textOnDark, fontFamily: fonts.sansMed, fontSize: fontSize.md },
  saveBtn: { backgroundColor: colors.gold, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  saveBtnText: { color: colors.navy, fontFamily: fonts.sansBold, fontSize: fontSize.md },
  // bookings
  bkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  bkHotel: { color: colors.textOnDark, fontFamily: fonts.sansSemi, fontSize: fontSize.sm },
  bkMeta: { color: colors.textOnDarkMuted, fontSize: fontSize.xs, marginTop: 1, fontFamily: fonts.sans },
  bkCancel: { paddingHorizontal: spacing.md, height: 34, borderRadius: radius.sm, borderWidth: 1, borderColor: "rgba(226,134,127,0.4)", alignItems: "center", justifyContent: "center" },
  bkCancelText: { color: "#E2867F", fontFamily: fonts.sansSemi, fontSize: fontSize.xs },
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusTagText: { fontSize: fontSize.xs, fontFamily: fonts.sansSemi },
  tableBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderDark },
  emptyTable: { color: colors.textOnDarkMuted, fontSize: fontSize.sm, textAlign: "center", paddingVertical: spacing.lg },
  adminFooter: { color: colors.textOnDarkMuted, fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.xl },
});
