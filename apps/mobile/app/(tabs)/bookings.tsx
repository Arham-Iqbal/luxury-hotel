import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Page } from "@/components/Page";
import { Button } from "@/components/ui";
import { colors, spacing, radius, fontSize, formatPrice, shadow, useLayout, fonts, tracking } from "@/lib/theme";
import { Kicker } from "@/components/ui";
import { useBookings } from "@/store/bookings";
import { useFavorites } from "@/store/favorites";
import { HotelCard } from "@/components/HotelCard";
import { useQuery } from "@tanstack/react-query";
import { fetchHotels } from "@/lib/api";
import type { BookingStatus } from "@aurelia/data";

export default function Bookings() {
  const router = useRouter();
  const { isMobile } = useLayout();
  const bookings = useBookings((s) => s.bookings);
  const cancelBooking = useBookings((s) => s.cancelBooking);
  const favIds = useFavorites((s) => s.ids);
  const [tab, setTab] = useState<"trips" | "saved">("trips");

  const allHotels = useQuery({ queryKey: ["hotels", "all"], queryFn: () => fetchHotels() });
  const savedHotels = (allHotels.data ?? []).filter((h) => favIds.includes(h.id));

  return (
    <Page scroll>
      <View style={{ marginTop: spacing.md }}>
        <Kicker label="Your account" />
        <Text style={styles.title}>My journeys</Text>
      </View>

      <View style={styles.tabs}>
        <TabBtn label={`Trips (${bookings.length})`} active={tab === "trips"} onPress={() => setTab("trips")} />
        <TabBtn label={`Saved (${favIds.length})`} active={tab === "saved"} onPress={() => setTab("saved")} />
      </View>

      {tab === "trips" ? (
        bookings.length === 0 ? (
          <Empty
            icon="airplane-outline"
            title="No trips yet"
            sub="When you book a stay, it'll appear here with your confirmation details."
            cta="Explore stays"
            onCta={() => router.push("/explore")}
          />
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            {bookings.map((b) => (
              <View key={b.id} style={styles.tripCard}>
                <Image source={{ uri: b.hotelImage }} style={styles.tripImg} contentFit="cover" />
                <View style={styles.tripBody}>
                  <View style={styles.tripHead}>
                    <Text style={styles.tripHotel} numberOfLines={1}>{b.hotelName}</Text>
                    <StatusPill status={b.status} />
                  </View>
                  <Text style={styles.tripLoc}>{b.city}, {b.country}</Text>
                  <Text style={styles.tripRoom} numberOfLines={1}>{b.roomName}</Text>
                  <View style={styles.tripDates}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.tripDateText}>
                      {fmt(b.checkIn)} → {fmt(b.checkOut)} · {b.nights} {b.nights === 1 ? "night" : "nights"}
                    </Text>
                  </View>
                  <View style={styles.tripFooter}>
                    <View>
                      <Text style={styles.tripCode}>{b.confirmationCode}</Text>
                      <Text style={styles.tripTotal}>{formatPrice(b.total, b.currency)}</Text>
                    </View>
                    <View style={styles.tripActions}>
                      <Button label="View" variant="outline" style={{ height: 38 }} onPress={() => router.push(`/hotel/${b.hotelId}`)} />
                      {b.status === "confirmed" && (
                        <Pressable onPress={() => cancelBooking(b.id)} style={styles.cancelBtn} hitSlop={6}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )
      ) : savedHotels.length === 0 ? (
        <Empty
          icon="heart-outline"
          title="No saved stays"
          sub="Tap the heart on any property to save it for later."
          cta="Browse hotels"
          onCta={() => router.push("/explore")}
        />
      ) : (
        <View style={[styles.grid, { marginTop: spacing.sm }]}>
          {savedHotels.map((h) => (
            <HotelCard key={h.id} hotel={h} width={isMobile ? "100%" : 300} />
          ))}
        </View>
      )}
    </Page>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const map = {
    confirmed: { bg: "#E7F1EC", fg: colors.success, label: "Confirmed" },
    completed: { bg: colors.surfaceAlt, fg: colors.textMuted, label: "Completed" },
    cancelled: { bg: "#F6E9E8", fg: colors.danger, label: "Cancelled" },
  }[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: map.bg }]}>
      <Text style={[styles.statusText, { color: map.fg }]}>{map.label}</Text>
    </View>
  );
}

function Empty({ icon, title, sub, cta, onCta }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={36} color={colors.gold} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
      <Button label={cta} variant="primary" onPress={onCta} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.display, fontFamily: fonts.serifBold, color: colors.text, letterSpacing: tracking.tight, marginTop: 2 },
  tabs: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  tabBtn: { paddingHorizontal: spacing.lg, height: 42, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  tabBtnActive: { backgroundColor: colors.navy },
  tabText: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: "700" },
  tabTextActive: { color: colors.surface },
  tripCard: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", ...shadow.soft },
  tripImg: { width: 110, minHeight: 170, backgroundColor: colors.surfaceAlt },
  tripBody: { flex: 1, padding: spacing.md, gap: 3, minWidth: 0 },
  tripHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  tripHotel: { fontSize: fontSize.lg, fontFamily: fonts.serifSemi, color: colors.text, flex: 1 },
  tripLoc: { fontSize: fontSize.sm, color: colors.textMuted },
  tripRoom: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
  tripDates: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  tripDateText: { fontSize: fontSize.sm, color: colors.text },
  tripFooter: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.sm, flexWrap: "wrap", gap: spacing.sm },
  tripCode: { fontSize: fontSize.xs, color: colors.gold, fontWeight: "700", letterSpacing: 1 },
  tripTotal: { fontSize: fontSize.lg, fontWeight: "800", color: colors.navy },
  tripActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cancelBtn: { paddingHorizontal: spacing.md, height: 38, justifyContent: "center" },
  cancelText: { color: colors.danger, fontWeight: "700", fontSize: fontSize.sm },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontSize: fontSize.xs, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  empty: { alignItems: "center", marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: spacing.md, ...shadow.soft },
  emptyTitle: { fontSize: fontSize.xl, fontFamily: fonts.serifSemi, color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, textAlign: "center", marginTop: 4, maxWidth: 340, lineHeight: 22 },
});
