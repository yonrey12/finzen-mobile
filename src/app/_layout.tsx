import "@/global.css";

import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";

import { supabase } from "@/lib/supabase";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function RootLayout() {
  useEffect(() => {
    supabase.auth.startAutoRefresh();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
