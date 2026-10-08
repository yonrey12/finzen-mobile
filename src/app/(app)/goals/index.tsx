import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { TextField } from "@/components/text-field";

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
};

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("financial_goals")
      .select("id, name, target_amount, current_amount, target_date")
      .order("created_at", { ascending: true });
    setGoals(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCreate() {
    setError(null);
    if (!name.trim()) {
      setError("Ponle un nombre a la meta.");
      return;
    }
    const amount = Number(targetAmount);
    if (!amount || amount <= 0) {
      setError("Ingresa un monto meta válido.");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("No se pudo identificar tu sesión.");
      return;
    }

    const { error } = await supabase.from("financial_goals").insert({
      user_id: user.id,
      name: name.trim(),
      target_amount: amount,
      target_date: targetDate || null,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    setTargetAmount("");
    setTargetDate("");
    load();
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-semibold text-ink dark:text-white">Metas de ahorro</Text>

      {loading ? (
        <ActivityIndicator color="#FF7900" />
      ) : goals.length > 0 ? (
        <View className="gap-2">
          {goals.map((g) => {
            const progress =
              g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0;
            const reached = g.current_amount >= g.target_amount;

            return (
              <Pressable
                key={g.id}
                onPress={() => router.push({ pathname: "/goals/[id]", params: { id: g.id } })}
                className="gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-medium text-ink dark:text-white">{g.name}</Text>
                    {g.target_date ? (
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        Meta: {g.target_date}
                      </Text>
                    ) : null}
                  </View>
                  {reached ? (
                    <Text className="text-sm font-medium text-income">¡Lograda!</Text>
                  ) : (
                    <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatCurrency(g.current_amount)} de {formatCurrency(g.target_amount)}
                    </Text>
                  )}
                </View>
                <View className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <View className="h-2 rounded-full bg-income" style={{ width: `${progress}%` }} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="items-center gap-1 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 dark:border-zinc-700">
          <Text className="font-medium text-ink dark:text-white">Sin metas todavía</Text>
          <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Crea la primera abajo: un carro, un viaje, un fondo de emergencia...
          </Text>
        </View>
      )}

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Text className="text-sm font-semibold text-ink dark:text-white">Agregar meta</Text>

        <TextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Fondo de emergencia, Viaje, Carro"
        />
        <TextField
          label="Monto meta"
          value={targetAmount}
          onChangeText={setTargetAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <TextField
          label="Fecha objetivo (AAAA-MM-DD, opcional)"
          value={targetDate}
          onChangeText={setTargetDate}
        />

        {error ? (
          <View className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleCreate}
          disabled={saving}
          className="items-center rounded-full bg-accent px-4 py-2.5 active:bg-accent-hover disabled:opacity-50"
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-sm font-semibold text-white">Guardar meta</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
