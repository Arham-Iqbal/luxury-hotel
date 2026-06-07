import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Hotel } from "@aurelia/data";
import { colors, spacing, radius, fontSize, formatPrice, useLayout, shadow, fonts, tracking } from "@/lib/theme";
import { Rating } from "./ui";
import { useFavorites } from "@/store/favorites";

export function HotelCard({ hotel, width }: { hotel: Hotel; width?: number | string }) {
  const router = useRouter();
  const { isMobile, isDesktop } = useLayout();
  const isFav = useFavorites((s) => s.ids.includes(hotel.id));
  const toggle = useFavorites((s) => s.toggle);

  // Explicit width — flex inside flexWrap wraps badly (playbook §16).
  const cardWidth = width ?? (isMobile ? "100%" : isDesktop ? 308 : 348);

  return (
    <Pressable style={[styles.card, { width: cardWidth as never }]} onPress={() => router.push(`/hotel/${hotel.slug}`)}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: hotel.heroImage }} style={styles.image} contentFit="cover" transition={300} />
        <LinearGradient colors={["rgba(7,13,24,0.30)", "transparent", "transparent"]} style={styles.imgGrad} />
        {hotel.featured && (
          <View style={styles.featuredTag}>
            <Ionicons name="diamond" size={9} color={colors.navy} />
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}
        <Pressable style={styles.favBtn} onPress={(e) => { e.stopPropagation?.(); toggle(hotel.id); }} hitSlop={8}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#E2867F" : colors.surface} />
        </Pressable>
        <View style={styles.starStrip}>
          {Array.from({ length: hotel.starRating }).map((_, i) => (
            <Ionicons key={i} name="star" size={10} color={colors.goldSoft} />
          ))}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.location} numberOfLines={1}>{hotel.city}, {hotel.country}</Text>
          <Rating value={hotel.rating} />
        </View>
        <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
        <Text style={styles.tagline} numberOfLines={2}>{hotel.tagline}</Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceFrom}>FROM</Text>
            <Text style={styles.price}>
              {formatPrice(hotel.pricePerNight, hotel.currency)}
              <Text style={styles.priceNight}> / night</Text>
            </Text>
          </View>
          <View style={styles.catChip}>
            <Text style={styles.catText}>{hotel.category}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", ...shadow.card },
  imageWrap: { width: "100%", aspectRatio: 4 / 3, backgroundColor: colors.surfaceAlt },
  image: { width: "100%", height: "100%" },
  imgGrad: { position: "absolute", left: 0, right: 0, top: 0, height: "40%" },
  featuredTag: { position: "absolute", top: spacing.sm, left: spacing.sm, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.goldSoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  featuredText: { fontSize: 9, fontFamily: fonts.sansBold, color: colors.navy, letterSpacing: tracking.wide },
  favBtn: { position: "absolute", top: spacing.sm, right: spacing.sm, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(7,13,24,0.42)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  starStrip: { position: "absolute", bottom: spacing.sm, left: spacing.sm, flexDirection: "row", gap: 2 },
  body: { padding: spacing.md, gap: 5 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  location: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: fonts.sansSemi, letterSpacing: 0.3, flex: 1, textTransform: "uppercase" },
  name: { fontSize: fontSize.lg, fontFamily: fonts.serifSemi, color: colors.text },
  tagline: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 19, minHeight: 38, fontFamily: fonts.sans },
  footer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.sm },
  priceFrom: { fontSize: 9, color: colors.textFaint, letterSpacing: tracking.wide, fontFamily: fonts.sansSemi },
  price: { fontSize: fontSize.lg, fontFamily: fonts.serifSemi, color: colors.navy },
  priceNight: { fontSize: fontSize.xs, fontFamily: fonts.sans, color: colors.textMuted },
  catChip: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.pill },
  catText: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: fonts.sansMed },
});
