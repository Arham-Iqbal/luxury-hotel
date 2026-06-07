import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchHotels, fetchDestinations, fetchExperiences } from "@/lib/api";
import { colors, spacing, radius, fontSize, useLayout, formatPrice, shadow, fonts, tracking, gradients } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { SearchBar } from "@/components/SearchBar";
import { HotelCard } from "@/components/HotelCard";
import { SectionHeader, Kicker, Hairline, Display } from "@/components/ui";
import { CATEGORIES } from "@aurelia/data";

const HERO = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=85";
const BANNER = "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1920&q=85";

const STATS = [
  { value: "120+", label: "Curated estates" },
  { value: "48", label: "Countries" },
  { value: "4.9", label: "Guest rating", star: true },
  { value: "24/7", label: "Private concierge" },
];

const WHY = [
  { icon: "shield-checkmark-outline", title: "Hand-vetted estates", body: "Every property is personally inspected against our standard of the extraordinary." },
  { icon: "pricetags-outline", title: "Member rates, no fees", body: "Preferred pricing and complimentary upgrades, never a booking fee." },
  { icon: "headset-outline", title: "Concierge on call", body: "A dedicated travel designer for every journey, around the clock." },
  { icon: "sparkles-outline", title: "Access, curated", body: "Private dinners, sunset sails, and doors that rarely open to others." },
];

const PRESS = ["CONDÉ NAST", "TRAVEL + LEISURE", "FORBES", "ROBB REPORT", "THE ROBB"];

export default function Home() {
  const router = useRouter();
  const { isMobile, isDesktop, contentMaxWidth } = useLayout();
  const insets = useSafeAreaInsets();

  const featured = useQuery({ queryKey: ["hotels", "featured"], queryFn: () => fetchHotels({ sort: "rating" }) });
  const destinations = useQuery({ queryKey: ["destinations"], queryFn: fetchDestinations });
  const experiences = useQuery({ queryKey: ["experiences"], queryFn: fetchExperiences });

  const goSearch = (q: string) => router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");

  const all = featured.data ?? [];
  const featuredHotels = all.filter((h) => h.featured).slice(0, 6);
  const spotlight = all.find((h) => h.featured) ?? all[0];

  return (
    <SafeAreaView edges={[]} style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 + Math.max(insets.bottom, 12) }}
      >
        {/* ---- HERO ---- */}
        <View style={[styles.hero, { height: isMobile ? 600 : 720 }]}>
          <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
          {/* gold corner frame accent (offset below the status bar on mobile) */}
          <View pointerEvents="none" style={[styles.frameTL, { top: 18 + (isMobile ? Math.max(insets.top, 12) : 0) }]} />
          <View pointerEvents="none" style={styles.frameBR} />

          <View style={[styles.heroContent, { maxWidth: contentMaxWidth, paddingTop: isMobile ? Math.max(insets.top, 12) + spacing.md : 0 }]}>
            <View style={styles.heroKicker}>
              <View style={styles.heroKickerLine} />
              <Text style={styles.heroKickerText}>{BRAND.full.toUpperCase()}</Text>
              <View style={styles.heroKickerLine} />
            </View>
            <Text style={[styles.heroTitle, { fontSize: isMobile ? fontSize.hero : fontSize.giant }]}>
              The world's most{"\n"}
              <Text style={styles.heroTitleItalic}>extraordinary</Text> stays
            </Text>
            <Text style={styles.heroSub}>
              A private collection of legendary hotels, villas and lodges — reserved with a concierge who knows them by name.
            </Text>
            <View style={{ marginTop: spacing.xl, width: "100%" }}>
              <SearchBar onSearch={goSearch} variant="hero" />
            </View>
            <View style={styles.quickChips}>
              <Text style={styles.quickLabel}>Popular</Text>
              {["Maldives", "Santorini", "Bali", "Safari", "Alps"].map((c) => (
                <Pressable key={c} style={styles.chip} onPress={() => goSearch(c)}>
                  <Text style={styles.chipText}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* press strip at hero base */}
          <View style={styles.pressStrip}>
            <View style={[styles.pressInner, { maxWidth: contentMaxWidth }]}>
              {PRESS.slice(0, isMobile ? 3 : 5).map((p) => (
                <Text key={p} style={styles.pressItem}>{p}</Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.section, { maxWidth: contentMaxWidth }]}>
            {/* ---- TRUST STATS ---- */}
            <View style={styles.statsRow}>
              {STATS.map((s, i) => (
                <React.Fragment key={s.label}>
                  <View style={styles.stat}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{s.value}</Text>
                      {s.star && <Ionicons name="star" size={14} color={colors.gold} style={{ marginLeft: 2, marginTop: 6 }} />}
                    </View>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                  {i < STATS.length - 1 && <View style={styles.statDivider} />}
                </React.Fragment>
              ))}
            </View>

            {/* ---- CATEGORIES ---- */}
            <View style={styles.block}>
              <SectionHeader kicker="Curated journeys" title="Find your kind of escape" subtitle="Defined by the way you like to travel" />
              <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable key={cat} style={styles.catCard} onPress={() => router.push(`/explore?category=${encodeURIComponent(cat)}`)}>
                    <View style={styles.catIcon}>
                      <Ionicons name={categoryIcon(cat)} size={24} color={colors.gold} />
                    </View>
                    <Text style={styles.catLabel}>{cat}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ---- FEATURED ---- */}
            <View style={styles.block}>
              <SectionHeader
                kicker="The collection"
                title="Featured estates"
                subtitle="Hand-selected by our travel editors"
                action={
                  <Pressable onPress={() => router.push("/explore")} style={styles.seeAllBtn}>
                    <Text style={styles.seeAll}>View all</Text>
                    <Ionicons name="arrow-forward" size={15} color={colors.gold} />
                  </Pressable>
                }
              />
              <View style={styles.grid}>
                {featuredHotels.map((h) => (
                  <HotelCard key={h.id} hotel={h} />
                ))}
              </View>
            </View>
          </View>

          {/* ---- CINEMATIC SPOTLIGHT BANNER (full-bleed) ---- */}
          {spotlight && (
            <Pressable style={[styles.spotlight, { height: isMobile ? 460 : 540 }]} onPress={() => router.push(`/hotel/${spotlight.slug}`)}>
              <Image source={{ uri: BANNER }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={["rgba(7,13,24,0.25)", "rgba(7,13,24,0.55)", "rgba(7,13,24,0.85)"]} style={StyleSheet.absoluteFill} />
              <View style={[styles.spotlightContent, { maxWidth: contentMaxWidth }]}>
                <Kicker label="Editor's spotlight" />
                <Text style={[styles.spotlightTitle, { fontSize: isMobile ? fontSize.display : fontSize.hero }]}>
                  Wake to manta rays{"\n"}beneath your floor
                </Text>
                <Text style={styles.spotlightSub}>
                  Overwater villas in the UNESCO Biosphere of Baa Atoll — seaplane arrival, private butler, one of the healthiest reefs on Earth.
                </Text>
                <View style={styles.spotlightCta}>
                  <Text style={styles.spotlightFrom}>From {formatPrice(spotlight.pricePerNight, spotlight.currency)} / night</Text>
                  <View style={styles.spotlightBtn}>
                    <Text style={styles.spotlightBtnText}>Discover the estate</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.navy} />
                  </View>
                </View>
              </View>
            </Pressable>
          )}

          <View style={[styles.section, { maxWidth: contentMaxWidth }]}>
            {/* ---- DESTINATIONS ---- */}
            <View style={styles.block}>
              <SectionHeader kicker="Where to next" title="Iconic destinations" subtitle="Where our members are headed this season" />
              <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.destRow, !isMobile && styles.destWrap]}>
                {(destinations.data ?? []).map((d) => (
                  <Pressable key={d.id} style={[styles.destCard, { width: isMobile ? 230 : isDesktop ? 282 : 250 }]} onPress={() => router.push(`/explore?q=${encodeURIComponent(d.name)}`)}>
                    <Image source={{ uri: d.image }} style={styles.destImg} contentFit="cover" transition={300} />
                    <LinearGradient colors={gradients.cardOverlay} style={styles.destOverlay} />
                    <View style={styles.destText}>
                      <Text style={styles.destCountry}>{d.country.toUpperCase()}</Text>
                      <Text style={styles.destName}>{d.name}</Text>
                      <Text style={styles.destTagline} numberOfLines={1}>{d.tagline}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ---- WHY US ---- */}
            <View style={styles.block}>
              <SectionHeader kicker="The Aurelia difference" title="Why discerning travelers choose us" center={!isMobile} />
              <View style={styles.whyGrid}>
                {WHY.map((w) => (
                  <View key={w.title} style={[styles.whyCard, { width: isMobile ? "100%" : isDesktop ? 282 : "47%" }]}>
                    <View style={styles.whyIcon}>
                      <Ionicons name={w.icon as never} size={24} color={colors.gold} />
                    </View>
                    <Text style={styles.whyTitle}>{w.title}</Text>
                    <Text style={styles.whyBody}>{w.body}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ---- EXPERIENCES ---- */}
            <View style={styles.block}>
              <SectionHeader kicker="Beyond the stay" title="Signature experiences" subtitle="Make the journey unforgettable" />
              <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.destRow, !isMobile && styles.destWrap]}>
                {(experiences.data ?? []).map((x) => (
                  <View key={x.id} style={[styles.expCard, { width: isMobile ? 270 : isDesktop ? 282 : 258 }]}>
                    <Image source={{ uri: x.image }} style={styles.expImg} contentFit="cover" transition={300} />
                    <View style={styles.expBody}>
                      <Text style={styles.expCat}>{x.category.toUpperCase()}</Text>
                      <Text style={styles.expTitle} numberOfLines={2}>{x.title}</Text>
                      <Text style={styles.expLoc} numberOfLines={1}>{x.location}</Text>
                      <Hairline style={{ marginVertical: 10 }} />
                      <Text style={styles.expPrice}>{formatPrice(x.price)} · {x.durationHours}h</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* ---- MEMBERSHIP CTA (full-bleed midnight) ---- */}
          <View style={[styles.ctaBanner, { minHeight: isMobile ? 340 : 320 }]}>
            <LinearGradient colors={gradients.midnight} style={StyleSheet.absoluteFill} />
            <View style={styles.ctaGlow} pointerEvents="none" />
            <View style={[styles.ctaContent, { maxWidth: contentMaxWidth }]}>
              <Kicker label="By invitation" center />
              <Text style={[styles.ctaTitle, { fontSize: isMobile ? fontSize.xxl : fontSize.display }]}>
                Become an Aurelia member
              </Text>
              <Text style={styles.ctaSub}>
                Unlock preferred rates, suite upgrades, and first access to the estates the world hasn't discovered yet.
              </Text>
              <Pressable style={styles.ctaBtn} onPress={() => router.push("/profile")}>
                <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaBtnGrad}>
                  <Text style={styles.ctaBtnText}>Request your invitation</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* ---- FOOTER ---- */}
          <View style={styles.footerWrap}>
            <View style={[styles.footer, { maxWidth: contentMaxWidth }]}>
              <View style={styles.footerBrandRow}>
                <View style={styles.footerLogo}>
                  <Ionicons name="diamond" size={16} color={colors.navy} />
                </View>
                <Text style={styles.footerBrand}>{BRAND.name}</Text>
              </View>
              <Text style={styles.footerTag}>{BRAND.tagline}</Text>
              <View style={styles.footerLinks}>
                {["The Collection", "Destinations", "Experiences", "Membership", "Journal", "Contact"].map((l) => (
                  <Text key={l} style={styles.footerLink}>{l}</Text>
                ))}
              </View>
              <Hairline style={{ maxWidth: 280, marginVertical: spacing.md }} />
              <Text style={styles.footerFine}>© 2026 {BRAND.full}. All rights reserved.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function categoryIcon(cat: string): keyof typeof Ionicons.glyphMap {
  switch (cat) {
    case "Beach Resort": return "umbrella-outline";
    case "City Hotel": return "business-outline";
    case "Mountain Lodge": return "snow-outline";
    case "Boutique": return "diamond-outline";
    case "Safari Lodge": return "leaf-outline";
    case "Villa": return "home-outline";
    default: return "bed-outline";
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  hero: { width: "100%", justifyContent: "center", alignItems: "center" },
  frameTL: { position: "absolute", top: 18, left: 18, width: 54, height: 54, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: colors.borderGold },
  frameBR: { position: "absolute", bottom: 70, right: 18, width: 54, height: 54, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: colors.borderGold },
  heroContent: { width: "100%", paddingHorizontal: spacing.lg, alignItems: "center" },
  heroKicker: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg },
  heroKickerLine: { width: 32, height: 1, backgroundColor: colors.gold },
  heroKickerText: { color: colors.goldSoft, fontFamily: fonts.sansSemi, letterSpacing: tracking.wider, fontSize: fontSize.xs },
  heroTitle: { color: colors.surface, fontFamily: fonts.serifBold, textAlign: "center", letterSpacing: tracking.tighter, lineHeight: undefined },
  heroTitleItalic: { color: colors.goldSoft, fontFamily: fonts.serifLight, fontStyle: "italic" },
  heroSub: { color: colors.textOnDarkMuted, fontSize: fontSize.lg, textAlign: "center", marginTop: spacing.lg, maxWidth: 560, lineHeight: 26, fontFamily: fonts.sans },
  quickChips: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, flexWrap: "wrap", justifyContent: "center", alignItems: "center" },
  quickLabel: { color: colors.textOnDarkMuted, fontSize: fontSize.xs, fontFamily: fonts.sansSemi, letterSpacing: 1.5, marginRight: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(231,207,148,0.35)", backgroundColor: "rgba(255,255,255,0.06)" },
  chipText: { color: colors.surface, fontFamily: fonts.sansMed, fontSize: fontSize.sm },
  pressStrip: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: "rgba(231,207,148,0.18)", backgroundColor: "rgba(7,13,24,0.4)" },
  pressInner: { width: "100%", flexDirection: "row", justifyContent: "space-around", paddingHorizontal: spacing.lg, flexWrap: "wrap", gap: spacing.md },
  pressItem: { color: "rgba(231,207,148,0.7)", fontFamily: fonts.serifSemi, letterSpacing: tracking.wide, fontSize: fontSize.xs },
  body: { width: "100%", alignItems: "center", backgroundColor: colors.bg },
  section: { width: "100%", paddingHorizontal: spacing.md },
  statsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, marginTop: -44, borderWidth: 1, borderColor: colors.borderGold, ...shadow.lift },
  stat: { alignItems: "center", paddingHorizontal: spacing.md, minWidth: 78 },
  statValueRow: { flexDirection: "row", alignItems: "flex-start" },
  statValue: { fontSize: fontSize.xxl, fontFamily: fonts.serifBold, color: colors.navy },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4, fontFamily: fonts.sansMed, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 34, backgroundColor: colors.border },
  block: { marginTop: spacing.xxxl },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  seeAll: { color: colors.gold, fontFamily: fonts.sansBold, fontSize: fontSize.md },
  catRow: { gap: spacing.md, paddingVertical: 4, flexDirection: "row", flexWrap: "wrap" },
  catCard: { alignItems: "center", gap: 10, width: 104 },
  catIcon: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGold, alignItems: "center", justifyContent: "center", ...shadow.soft },
  catLabel: { fontSize: fontSize.sm, color: colors.text, fontFamily: fonts.sansSemi, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  spotlight: { width: "100%", marginTop: spacing.xxxl, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  spotlightContent: { width: "100%", paddingHorizontal: spacing.lg },
  spotlightTitle: { color: colors.surface, fontFamily: fonts.serifBold, letterSpacing: tracking.tight, marginTop: 4 },
  spotlightSub: { color: colors.textOnDarkMuted, fontSize: fontSize.md, marginTop: spacing.md, maxWidth: 520, lineHeight: 24, fontFamily: fonts.sans },
  spotlightCta: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.lg, flexWrap: "wrap" },
  spotlightFrom: { color: colors.goldSoft, fontFamily: fonts.serifSemi, fontSize: fontSize.lg },
  spotlightBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, height: 50, borderRadius: radius.md, ...shadow.card },
  spotlightBtnText: { color: colors.navy, fontFamily: fonts.sansBold, fontSize: fontSize.md },
  destRow: { gap: spacing.lg, paddingVertical: 4 },
  destWrap: { flexDirection: "row", flexWrap: "wrap" },
  destCard: { height: 320, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  destImg: { width: "100%", height: "100%" },
  destOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: "70%" },
  destText: { position: "absolute", left: spacing.md, bottom: spacing.md, right: spacing.md },
  destCountry: { color: colors.goldSoft, fontSize: 10, fontFamily: fonts.sansSemi, letterSpacing: tracking.wide, marginBottom: 2 },
  destName: { color: colors.surface, fontSize: fontSize.xxl, fontFamily: fonts.serif },
  destTagline: { color: colors.textOnDarkMuted, fontSize: fontSize.sm, marginTop: 3, fontFamily: fonts.sans },
  whyGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, justifyContent: "center" },
  whyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 10, ...shadow.soft },
  whyIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  whyTitle: { fontSize: fontSize.lg, fontFamily: fonts.serifSemi, color: colors.text },
  whyBody: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 21, fontFamily: fonts.sans },
  expCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  expImg: { width: "100%", height: 160 },
  expBody: { padding: spacing.md },
  expCat: { fontSize: 10, color: colors.gold, fontFamily: fonts.sansSemi, letterSpacing: tracking.wide },
  expTitle: { fontSize: fontSize.md, fontFamily: fonts.serifSemi, color: colors.text, minHeight: 40, marginTop: 4 },
  expLoc: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: fonts.sans },
  expPrice: { fontSize: fontSize.sm, fontFamily: fonts.sansBold, color: colors.navy },
  ctaBanner: { marginTop: spacing.xxxl, overflow: "hidden", justifyContent: "center", alignItems: "center", width: "100%" },
  ctaGlow: { position: "absolute", top: -120, alignSelf: "center", width: 360, height: 360, borderRadius: 180, backgroundColor: "rgba(201,162,75,0.12)" },
  ctaContent: { padding: spacing.xl, alignItems: "center", gap: spacing.sm, width: "100%" },
  ctaTitle: { color: colors.surface, fontFamily: fonts.serifBold, textAlign: "center", letterSpacing: tracking.tight },
  ctaSub: { color: colors.textOnDarkMuted, fontSize: fontSize.md, textAlign: "center", maxWidth: 460, lineHeight: 24, fontFamily: fonts.sans },
  ctaBtn: { marginTop: spacing.md, borderRadius: radius.md, overflow: "hidden", ...shadow.gold },
  ctaBtnGrad: { paddingHorizontal: spacing.xl, height: 54, alignItems: "center", justifyContent: "center" },
  ctaBtnText: { color: colors.navy, fontFamily: fonts.sansBold, fontSize: fontSize.md, letterSpacing: 0.3 },
  footerWrap: { width: "100%", alignItems: "center", backgroundColor: colors.bgWarm, borderTopWidth: 1, borderTopColor: colors.border },
  footer: { width: "100%", paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, alignItems: "center", gap: spacing.sm },
  footerBrandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  footerLogo: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  footerBrand: { fontSize: fontSize.xxl, fontFamily: fonts.serif, color: colors.navy, letterSpacing: 1 },
  footerTag: { fontSize: fontSize.md, color: colors.textMuted, fontFamily: fonts.serifLightMed, fontStyle: "italic" },
  footerLinks: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, justifyContent: "center", marginVertical: spacing.md },
  footerLink: { fontSize: fontSize.sm, color: colors.textMuted, fontFamily: fonts.sansMed },
  footerFine: { fontSize: fontSize.xs, color: colors.textFaint, textAlign: "center", fontFamily: fonts.sans },
});
