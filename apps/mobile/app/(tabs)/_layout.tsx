import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, fontSize, useLayout, shadow } from "@/lib/theme";
import { TopNav } from "@/components/TopNav";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { on: "home", off: "home-outline", label: "Home" },
  explore: { on: "search", off: "search-outline", label: "Explore" },
  bookings: { on: "briefcase", off: "briefcase-outline", label: "Trips" },
  profile: { on: "person", off: "person-outline", label: "Account" },
};

// Custom tab bar that works on APK AND mobile browser (playbook §14).
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  if (!isMobile) return null; // desktop uses the top navbar
  const bottomPad = Math.max(insets.bottom, 12); // FLOOR of 12 even when inset=0

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const meta = ICONS[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} style={styles.tab} onPress={onPress} hitSlop={6}>
            <Ionicons
              name={focused ? meta.on : meta.off}
              size={23}
              color={focused ? colors.navy : colors.textFaint}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TopNav />
      <Tabs tabBar={(p) => <CustomTabBar {...p} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="bookings" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    ...shadow.soft,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 2 },
  label: { fontSize: 11, color: colors.textFaint, fontWeight: "600" },
  labelActive: { color: colors.navy, fontWeight: "700" },
});
