import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { ACCOUNT_TYPES } from "@/lib/accounts";
import { TextField } from "@/components/text-field";

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [initialBalance, setInitialBalance] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      supabase
        .from("accounts")
        .select("name, type, initial_balance")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (!active || !data) return;
          setName(data.name);
          setType(data.type);
          setInitialBalance(String(data.initial_balance));
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id])
  );

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Ponle un nombre a la cuenta.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("accounts")
      .update({ name: name.trim(), type, initial_balance: Number(initialBalance) || 0 })
      .eq("id", id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.back();
  }

  async function handleDelete() {
    setSaving(true);
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.back();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-ink">
        <ActivityIndicator color="#FF7900" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-semibold text-ink dark:text-white">Editar cuenta</Text>

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <TextField label="Nombre" value={name} onChangeText={setName} />

        <View className="gap-1">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</Text>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                className={
                  type === t.value
                    ? "rounded-full bg-accent px-3 py-1.5"
                    : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                }
              >
                <Text
                  className={
                    type === t.value
                      ? "text-xs font-semibold text-white"
                      : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField
          label="Saldo inicial"
          value={initialBalance}
          onChangeText={setInitialBalance}
          keyboardType="decimal-pad"
          hint="Puedes corregirlo cuantas veces quieras, aunque ya hayas registrado movimientos."
        />

        {error ? (
          <View className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="items-center rounded-full bg-accent px-4 py-2.5 active:bg-accent-hover disabled:opacity-50"
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-sm font-semibold text-white">Guardar cambios</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={handleDelete} disabled={saving} className="items-center py-2">
        <Text className="text-sm font-medium text-danger">Eliminar esta cuenta</Text>
      </Pressable>
    </ScrollView>
  );
}
