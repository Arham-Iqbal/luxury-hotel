import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Page } from "@/components/Page";
import { SearchBar } from "@/components/SearchBar";
import { HotelCard } from "@/components/HotelCard";
import { FilterSheet, type Filters } from "@/components/FilterSheet";
import { fetchHotels } from "@/lib/api";
import { colors, spacing, radius, fontSize, useLayout, formatPrice, fonts, tracking } from "@/lib/theme";
import { Kicker } from "@/components/ui";
import { CATEGORIES, type HotelQuery } from "@aurelia/data";

const SORTS: { key: NonNullable<HotelQuery["sort"]>; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price-asc", label: "Price: Low" },
  { key: "price-desc", label: "Price: High" },
  { key: "rating", label: "Top rated" },
];

export default function Explore() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { isMobile } = useLayout();

  const [q, setQ] = useState(params.q ?? "");
  const [filters, setFilters] = useState<Filters>({
    category: params.category,
    sort: "recommended",
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  const query: HotelQuery = useMemo(
    () => ({
      q,
      region: filters.region,
      category: filters.category,
      maxPrice: filters.maxPrice,
      minRating: filters.minRating,
      sort: filters.sort,
    }),
    [q, filters],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["hotels", query],
    queryFn: () => fetchHotels(query),
  });

  const results = data ?? [];

  // Active filter pills (removable) — playbook §19.
  const activePills = useMemo(() => {
    const pills: { key: keyof Filters; label: string }[] = [];
    if (filters.region) pills.push({ key: "region", label: filters.region });
    if (filters.category) pills.push({ key: "category", label: filters.category });
    if (filters.maxPrice) pills.push({ key: "maxPrice", label: `≤ ${formatPrice(filters.maxPrice)}` });
    if (filters.minRating) pills.push({ key: "minRating", label: `${filters.minRating}+ rating` });
    return pills;
  }, [filters]);

  const removePill = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: undefined }));

  return (
    <Page scroll>
      <View style={styles.head}>
        <Kicker label="The Collection" />
        <Text style={styles.title}>Explore extraordinary stays</Text>
        <Text style={styles.sub}>{results.length} hand-vetted estates across 48 countries</Text>
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <SearchBar variant="compact" initialValue={q} onSearch={setQ} />
      </View>

      {/* quick category chips on the page */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
        <Pressable
          style={[styles.quickChip, !filters.category && styles.quickChipActive]}
          onPress={() => setFilters((f) => ({ ...f, category: undefined }))}
        >
          <Text style={[styles.quickText, !filters.category && styles.quickTextActive]}>All</Text>
        </Pressable>
        {CATEGORIES.map((c) => {
          const active = filters.category === c;
          return (
            <Pressable
              key={c}
              style={[styles.quickChip, active && styles.quickChipActive]}
              onPress={() => setFilters((f) => ({ ...f, category: active ? undefined : c }))}
            >
              <Text style={[styles.quickText, active && styles.quickTextActive]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* sort + filter row */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORTS.map((s) => {
            const active = filters.sort === s.key;
            return (
              <Pressable
                key={s.key}
                style={[styles.sortChip, active && styles.sortChipActive]}
                onPress={() => setFilters((f) => ({ ...f, sort: s.key }))}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={styles.filterBtn} onPress={() => setSheetOpen(true)}>
          <Ionicons name="options-outline" size={18} color={colors.navy} />
          <Text style={styles.filterBtnText}>Filters</Text>
          {activePills.length > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activePills.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* active filter pills */}
      {activePills.length > 0 && (
        <View style={styles.pillRow}>
          {activePills.map((p) => (
            <Pressable key={p.key} style={styles.pill} onPress={() => removePill(p.key)}>
              <Text style={styles.pillText}>{p.label}</Text>
              <Ionicons name="close" size={13} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      {/* results */}
      {isLoading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xxl }} />
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="telescope-outline" size={42} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>No stays match those filters</Text>
          <Text style={styles.emptySub}>Try widening your search or clearing a filter.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {results.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </View>
      )}

      <FilterSheet
        visible={sheetOpen}
        initial={filters}
        resultCount={results.length}
        onClose={() => setSheetOpen(false)}
        onApply={(f) => {
          setFilters((prev) => ({ ...f, sort: prev.sort }));
          setSheetOpen(false);
        }}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: fontSize.display, fontFamily: fonts.serifBold, color: colors.text, letterSpacing: tracking.tight },
  sub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 6, fontFamily: fonts.sans },
  quickRow: { gap: spacing.sm, paddingVertical: 4, marginBottom: spacing.sm },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  quickChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  quickText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
  quickTextActive: { color: colors.navy, fontWeight: "700" },
  toolbar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  sortRow: { gap: spacing.sm, flex: 1 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  sortChipActive: { backgroundColor: colors.navy },
  sortText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
  sortTextActive: { color: colors.surface },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, height: 40, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.navy,
  },
  filterBtnText: { fontWeight: "700", color: colors.navy, fontSize: fontSize.sm },
  filterCount: {
    backgroundColor: colors.gold, minWidth: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 10, fontWeight: "800", color: colors.navy },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  pillText: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm },
  empty: { alignItems: "center", gap: spacing.sm, marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, textAlign: "center" },
});
