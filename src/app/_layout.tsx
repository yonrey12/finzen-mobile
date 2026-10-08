import "@/global.css";

import { useEffect } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { Stack } from "expo-router";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function RootLayout() {
  const { session, loading } = useSession();

  useEffect(() => {
    supabase.auth.startAutoRefresh();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-ink">
        <ActivityIndicator color="#FF7900" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
