import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { colors } from "@/lib/theme";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

export default function RootLayout() {
  // Load fonts from local .ttf assets (hoisting-proof in the monorepo).
  // The family-name keys match the tokens in lib/theme.ts `fonts`.
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold: require("../assets/fonts/PlayfairDisplay_600SemiBold.ttf"),
    PlayfairDisplay_700Bold: require("../assets/fonts/PlayfairDisplay_700Bold.ttf"),
    PlayfairDisplay_800ExtraBold: require("../assets/fonts/PlayfairDisplay_800ExtraBold.ttf"),
    CormorantGaramond_500Medium: require("../assets/fonts/CormorantGaramond_500Medium.ttf"),
    CormorantGaramond_600SemiBold: require("../assets/fonts/CormorantGaramond_600SemiBold.ttf"),
    Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
    Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
    Inter_600SemiBold: require("../assets/fonts/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("../assets/fonts/Inter_700Bold.ttf"),
  });

  // Avoid a flash of unstyled text — render the brand background until fonts load.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "fade",
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="hotel/[id]" />
            <Stack.Screen name="admin" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
