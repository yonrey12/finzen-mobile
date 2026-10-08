import { Pressable, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";

export function AppHeader() {
  const { session } = useSession();

  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Text className="text-lg font-bold text-ink dark:text-white">
        Fin<Text className="text-accent">Zen</Text>
      </Text>
      <View className="flex-row items-center gap-3">
        <Text
          numberOfLines={1}
          className="max-w-[140px] text-xs text-zinc-500 dark:text-zinc-400"
        >
          {session?.user.email}
        </Text>
        <Pressable
          onPress={() => supabase.auth.signOut()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 active:bg-zinc-100 dark:border-zinc-700 dark:active:bg-zinc-800"
        >
          <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Salir</Text>
        </Pressable>
      </View>
    </View>
  );
}
