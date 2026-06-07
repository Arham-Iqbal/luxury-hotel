import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { RoomType, Booking } from "@aurelia/data";
import { fetchHotel } from "@/lib/api";
import { colors, spacing, radius, fontSize, useLayout, formatPrice, shadow, fonts, tracking } from "@/lib/theme";
import { Rating, Badge, Button } from "@/components/ui";
import { TopNav } from "@/components/TopNav";
import { BookingModal } from "@/components/BookingModal";
import { useFavorites } from "@/store/favorites";

export default function HotelDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isMobile, isDesktop, contentMaxWidth } = useLayout();
  const insets = useSafeAreaInsets();

  const { data: hotel, isLoading } = useQuery({
    queryKey: ["hotel", id],
    queryFn: () => fetchHotel(String(id)),
    enabled: !!id,
  });

  const isFav = useFavorites((s) => (hotel ? s.ids.includes(hotel.id) : false));
  const toggleFav = useFavorites((s) => s.toggle);

  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }
  if (!hotel) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.nfTitle}>Stay not found</Text>
          <Button label="Back to explore" onPress={() => router.replace("/explore")} />
        </View>
      </SafeAreaView>
    );
  }

  const stickyPad = Math.max(insets.bottom, 8); // floor of 8 for sticky bar (§14)
  const fromRoom = hotel.rooms.reduce((a, b) => (a.pricePerNight < b.pricePerNight ? a : b), hotel.rooms[0]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopNav />
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + Math.max(insets.bottom, 12) }}
        >
          {/* hero gallery */}
          <View style={[styles.hero, { height: isMobile ? 320 : 460 }]}>
            <Pressable onPress={() => setGalleryIndex(0)} style={StyleSheet.absoluteFill}>
              <Image source={{ uri: hotel.gallery[galleryIndex] ?? hotel.heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
            </Pressable>
            <LinearGradient colors={["rgba(10,19,32,0.35)", "transparent", "rgba(10,19,32,0.25)"]} style={StyleSheet.absoluteFill} />
            <SafeAreaView edges={["top"]} style={styles.heroBarWrap}>
              <View style={[styles.heroBar, { maxWidth: contentMaxWidth }]}>
                <Pressable style={styles.circleBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/explore")}>
                  <Ionicons name="arrow-back" size={20} color={colors.surface} />
                </Pressable>
                <Pressable style={styles.circleBtn} onPress={() => toggleFav(hotel.id)}>
                  <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? colors.danger : colors.surface} />
                </Pressable>
              </View>
            </SafeAreaView>
            {/* gallery thumbnails */}
            <View style={styles.thumbStrip}>
              {hotel.gallery.slice(0, 4).map((g, i) => (
                <Pressable key={g} onPress={() => setGalleryIndex(i)} style={[styles.thumb, galleryIndex === i && styles.thumbActive]}>
                  <Image source={{ uri: g }} style={styles.thumbImg} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.bodyCenter}>
            <View style={[styles.body, { maxWidth: contentMaxWidth }]}>
              <View style={isDesktop ? styles.twoCol : undefined}>
                {/* main column */}
                <View style={isDesktop ? { flex: 1, paddingRight: spacing.xl } : undefined}>
                  <View style={styles.titleRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.location}>{hotel.city}, {hotel.country}</Text>
                      <Text style={styles.name}>{hotel.name}</Text>
                      <Text style={styles.tagline}>{hotel.tagline}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Rating value={hotel.rating} count={hotel.reviewCount} />
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.starRow}>
                      {Array.from({ length: hotel.starRating }).map((_, i) => (
                        <Ionicons key={i} name="star" size={13} color={colors.gold} />
                      ))}
                    </View>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaText}>{hotel.category}</Text>
                  </View>

                  <View style={styles.badgeRow}>
                    {hotel.badges.map((b) => (
                      <Badge key={b} label={b} tone="neutral" />
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>About this stay</Text>
                  <Text style={styles.desc}>{hotel.description}</Text>

                  <Text style={styles.sectionTitle}>Highlights</Text>
                  <View style={styles.highlightGrid}>
                    {hotel.highlights.map((h) => (
                      <View key={h} style={styles.highlight}>
                        <Ionicons name="sparkles" size={15} color={colors.gold} />
                        <Text style={styles.highlightText}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Amenities</Text>
                  <View style={styles.amenityGrid}>
                    {hotel.amenities.map((a) => (
                      <View key={a} style={styles.amenity}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={styles.amenityText}>{a}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Choose your room</Text>
                  <View style={{ gap: spacing.md }}>
                    {hotel.rooms.map((room) => (
                      <View key={room.id} style={styles.roomCard}>
                        <Image source={{ uri: room.image }} style={styles.roomImg} contentFit="cover" transition={200} />
                        <View style={styles.roomBody}>
                          <Text style={styles.roomName}>{room.name}</Text>
                          <Text style={styles.roomDesc} numberOfLines={2}>{room.description}</Text>
                          <View style={styles.roomMeta}>
                            <RoomChip icon="people-outline" label={`${room.maxGuests} guests`} />
                            <RoomChip icon="bed-outline" label={room.beds} />
                            <RoomChip icon="resize-outline" label={`${room.sizeSqm} m²`} />
                          </View>
                          <View style={styles.roomFooter}>
                            <Text style={styles.roomPrice}>
                              {formatPrice(room.pricePerNight, hotel.currency)}
                              <Text style={styles.roomNight}> / night</Text>
                            </Text>
                            <Button label="Reserve" variant="primary" onPress={() => setSelectedRoom(room)} style={{ height: 42 }} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Guest reviews</Text>
                  <View style={{ gap: spacing.md }}>
                    {hotel.reviews.map((r) => (
                      <View key={r.id} style={styles.review}>
                        <View style={styles.reviewHead}>
                          <View style={styles.reviewAvatar}>
                            <Text style={styles.reviewInitial}>{r.author.charAt(0)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.reviewAuthor}>{r.author}</Text>
                            <Text style={styles.reviewMeta}>{r.country} · {new Date(r.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</Text>
                          </View>
                          <Rating value={r.rating} />
                        </View>
                        <Text style={styles.reviewTitle}>{r.title}</Text>
                        <Text style={styles.reviewBody}>{r.body}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* desktop side booking card */}
                {isDesktop && (
                  <View style={styles.sideCard}>
                    <Text style={styles.sideFrom}>From</Text>
                    <Text style={styles.sidePrice}>
                      {formatPrice(fromRoom.pricePerNight, hotel.currency)}
                      <Text style={styles.sideNight}> / night</Text>
                    </Text>
                    <Rating value={hotel.rating} count={hotel.reviewCount} />
                    <View style={{ height: spacing.md }} />
                    <Button label="Check availability" variant="gold" full onPress={() => setSelectedRoom(fromRoom)} />
                    <Text style={styles.sideFine}>Free cancellation · No booking fees</Text>
                    <View style={styles.sideDivider} />
                    <View style={styles.sideAddress}>
                      <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.sideAddressText}>{hotel.address}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* mobile sticky CTA bar (floor 8 — §14) */}
        {!isDesktop && (
          <View style={[styles.stickyBar, { paddingBottom: stickyPad }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stickyFrom}>From</Text>
              <Text style={styles.stickyPrice}>
                {formatPrice(fromRoom.pricePerNight, hotel.currency)}
                <Text style={styles.stickyNight}> / night</Text>
              </Text>
            </View>
            <Button label="Reserve" variant="gold" onPress={() => setSelectedRoom(fromRoom)} style={{ minWidth: 140 }} />
          </View>
        )}
      </SafeAreaView>

      {selectedRoom && (
        <BookingModal
          visible={!!selectedRoom}
          hotel={hotel}
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onConfirmed={(b) => {
            setSelectedRoom(null);
            setConfirmed(b);
          }}
        />
      )}

      <ConfirmedModal
        booking={confirmed}
        onClose={() => setConfirmed(null)}
        onViewTrips={() => {
          setConfirmed(null);
          router.push("/bookings");
        }}
      />
    </View>
  );
}

function RoomChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.roomChip}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.roomChipText}>{label}</Text>
    </View>
  );
}

function ConfirmedModal({ booking, onClose, onViewTrips }: { booking: Booking | null; onClose: () => void; onViewTrips: () => void }) {
  if (!booking) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.confirmBackdrop}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIcon}>
            <Ionicons name="checkmark" size={36} color={colors.surface} />
          </View>
          <Text style={styles.confirmTitle}>Booking confirmed</Text>
          <Text style={styles.confirmSub}>
            {booking.nights} {booking.nights === 1 ? "night" : "nights"} at {booking.hotelName}
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Confirmation code</Text>
            <Text style={styles.codeValue}>{booking.confirmationCode}</Text>
          </View>
          <Text style={styles.confirmTotal}>Total {formatPrice(booking.total, booking.currency)}</Text>
          <Button label="View my trips" variant="primary" full onPress={onViewTrips} style={{ marginTop: spacing.md }} />
          <Pressable onPress={onClose} style={{ marginTop: spacing.sm }}>
            <Text style={styles.confirmClose}>Keep browsing</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  nfTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  hero: { width: "100%", backgroundColor: colors.surfaceAlt },
  heroBarWrap: { width: "100%", alignItems: "center" },
  heroBar: { width: "100%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(14,26,43,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  thumbStrip: { position: "absolute", bottom: spacing.md, left: spacing.md, flexDirection: "row", gap: spacing.sm },
  thumb: { width: 52, height: 40, borderRadius: radius.sm, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  thumbActive: { borderColor: colors.gold },
  thumbImg: { width: "100%", height: "100%" },
  bodyCenter: { width: "100%", alignItems: "center" },
  body: { width: "100%", padding: spacing.md },
  twoCol: { flexDirection: "row", alignItems: "flex-start" },
  titleRow: { flexDirection: "row", marginTop: spacing.sm },
  location: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
  name: { fontSize: fontSize.display, fontFamily: fonts.serifBold, color: colors.text, letterSpacing: tracking.tight, marginTop: 4 },
  tagline: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" },
  metaItem: {},
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textFaint },
  starRow: { flexDirection: "row", gap: 1 },
  metaText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fonts.serifSemi, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  desc: { fontSize: fontSize.md, color: colors.textMuted, lineHeight: 24 },
  highlightGrid: { gap: spacing.sm },
  highlight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  highlightText: { fontSize: fontSize.md, color: colors.text, flex: 1 },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  amenity: { flexDirection: "row", alignItems: "center", gap: 6, width: "47%", minWidth: 150 },
  amenityText: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  roomCard: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", ...shadow.soft },
  roomImg: { width: 120, height: "100%", minHeight: 150, backgroundColor: colors.surfaceAlt },
  roomBody: { flex: 1, padding: spacing.md, gap: 4, minWidth: 0 },
  roomName: { fontSize: fontSize.lg, fontFamily: fonts.serifSemi, color: colors.text },
  roomDesc: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19 },
  roomMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 4 },
  roomChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  roomChipText: { fontSize: fontSize.xs, color: colors.textMuted },
  roomFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm, flexWrap: "wrap", gap: spacing.sm },
  roomPrice: { fontSize: fontSize.lg, fontWeight: "800", color: colors.navy },
  roomNight: { fontSize: fontSize.xs, fontWeight: "500", color: colors.textMuted },
  review: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  reviewInitial: { color: colors.gold, fontWeight: "800", fontSize: fontSize.md },
  reviewAuthor: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  reviewMeta: { fontSize: fontSize.xs, color: colors.textFaint },
  reviewTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, marginTop: 2 },
  reviewBody: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 21 },
  sideCard: {
    width: 320, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginTop: spacing.sm, ...shadow.card,
  },
  sideFrom: { fontSize: fontSize.sm, color: colors.textMuted },
  sidePrice: { fontSize: fontSize.xxl, fontFamily: fonts.serifBold, color: colors.navy, marginVertical: 2 },
  sideNight: { fontSize: fontSize.md, fontWeight: "500", color: colors.textMuted },
  sideFine: { fontSize: fontSize.xs, color: colors.textFaint, textAlign: "center", marginTop: spacing.sm },
  sideDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  sideAddress: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  sideAddressText: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1, lineHeight: 20 },
  stickyBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.md, paddingTop: spacing.md, ...shadow.card,
  },
  stickyFrom: { fontSize: fontSize.xs, color: colors.textMuted },
  stickyPrice: { fontSize: fontSize.xl, fontWeight: "800", color: colors.navy },
  stickyNight: { fontSize: fontSize.xs, fontWeight: "500", color: colors.textMuted },
  confirmBackdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  confirmCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, width: "100%", maxWidth: 420, alignItems: "center" },
  confirmIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  confirmTitle: { fontSize: fontSize.xxl, fontFamily: fonts.serifBold, color: colors.text },
  confirmSub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4, textAlign: "center" },
  codeBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: "center", marginTop: spacing.lg },
  codeLabel: { fontSize: fontSize.xs, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  codeValue: { fontSize: fontSize.xl, fontWeight: "800", color: colors.navy, letterSpacing: 2, marginTop: 2 },
  confirmTotal: { fontSize: fontSize.md, color: colors.text, fontWeight: "700", marginTop: spacing.md },
  confirmClose: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: "600" },
});
