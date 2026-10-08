import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState<string>("Sin probar");

  async function testConnection() {
    setStatus("Probando...");
    const { error } = await supabase.from("categories").select("id").limit(1);
    setStatus(error ? `Error: ${error.message}` : "Conexión OK");
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-6 dark:bg-ink">
      <Text className="text-3xl font-bold text-ink dark:text-white">
        Fin<Text className="text-accent">Zen</Text>
      </Text>
      <Text className="text-center text-base text-zinc-500 dark:text-zinc-400">
        Proyecto React Native listo. Conectado al mismo Supabase de la app web.
      </Text>
      <Pressable
        onPress={testConnection}
        className="rounded-xl bg-accent px-6 py-3 active:bg-accent-hover"
      >
        <Text className="font-semibold text-white">Probar conexión a Supabase</Text>
      </Pressable>
      <Text className="text-sm text-zinc-500 dark:text-zinc-400">{status}</Text>
    </View>
  );
}
