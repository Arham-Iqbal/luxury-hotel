// Standard screen wrapper: SafeAreaView (top only), centered max-width content,
// scroll container with the bottom-padding FLOOR rule (playbook §15).
import React from "react";
import { ScrollView, View, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/lib/theme";
import { useLayout } from "@/lib/theme";

export function Page({
  children,
  scroll = true,
  padded = true,
  onRefresh,
  refreshing,
  maxWidth,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  maxWidth?: number;
}) {
  const insets = useSafeAreaInsets();
  const { isMobile, contentMaxWidth } = useLayout();
  const bottomPad = 80 + Math.max(insets.bottom, 12); // floor of 12 (§14/§15)
  const hPad = padded ? (isMobile ? spacing.md : spacing.xl) : 0;

  const inner = (
    <View style={[styles.inner, { maxWidth: maxWidth ?? contentMaxWidth, paddingHorizontal: hPad }]}>
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.center}>{inner}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
          ) : undefined
        }
      >
        <View style={styles.center}>{inner}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: "hidden", // kill accidental horizontal scroll on web (§15)
  },
  scrollContent: { flexGrow: 1 },
  center: { width: "100%", alignItems: "center" },
  inner: { width: "100%" },
});
