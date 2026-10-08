import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/use-session";

export default function DashboardScreen() {
  const { session } = useSession();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-ink">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-2xl font-bold text-ink dark:text-white">
          Fin<Text className="text-accent">Zen</Text>
        </Text>
        <Text className="text-center text-base text-zinc-500 dark:text-zinc-400">
          Sesión iniciada como{"\n"}
          {session?.user.email}
        </Text>

        <Pressable
          onPress={() => supabase.auth.signOut()}
          className="mt-4 rounded-full border border-zinc-300 px-6 py-2.5 active:bg-zinc-100 dark:border-zinc-700 dark:active:bg-zinc-800"
        >
          <Text className="font-medium text-zinc-700 dark:text-zinc-300">Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
