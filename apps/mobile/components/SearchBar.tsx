import React, { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize, webNoOutline, useLayout, shadow, fonts } from "@/lib/theme";

export function SearchBar({
  onSearch,
  initialValue = "",
  variant = "hero",
}: {
  onSearch: (q: string) => void;
  initialValue?: string;
  variant?: "hero" | "compact";
}) {
  const [value, setValue] = useState(initialValue);
  const { isMobile } = useLayout();
  const hero = variant === "hero";

  return (
    <View style={[styles.wrap, hero ? styles.hero : styles.compact, isMobile && hero && styles.heroMobile]}>
      <Ionicons name="search" size={20} color={colors.textMuted} style={{ marginLeft: 4 }} />
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={() => onSearch(value)}
        placeholder="Search destinations, hotels, experiences…"
        placeholderTextColor={colors.textFaint}
        returnKeyType="search"
        style={[styles.input, webNoOutline]}
      />
      <Pressable style={styles.btn} onPress={() => onSearch(value)}>
        <Text style={styles.btnText}>Search</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: spacing.md,
    paddingRight: 6,
    gap: spacing.sm,
    ...shadow.card,
  },
  hero: { height: 68, maxWidth: 680, width: "100%", alignSelf: "center", borderWidth: 1, borderColor: colors.borderGold, ...shadow.lift },
  heroMobile: { height: 60 },
  compact: { height: 54, borderWidth: 1, borderColor: colors.border },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 0,
    minWidth: 0,
    fontFamily: fonts.sans,
  },
  btn: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    height: "78%",
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: colors.surface, fontFamily: fonts.sansBold, fontSize: fontSize.md, letterSpacing: 0.3 },
});
