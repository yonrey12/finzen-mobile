import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/app-header";
import { NavBar } from "@/components/nav-bar";

export default function AppLayout() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-ink">
      <AppHeader />
      <NavBar />
      <Slot />
    </SafeAreaView>
  );
}
