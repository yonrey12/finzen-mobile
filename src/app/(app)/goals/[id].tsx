import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      supabase
        .from("financial_goals")
        .select("id, name, target_amount, current_amount, target_date")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (!active || !data) return;
          setGoal(data);
          setName(data.name);
          setTargetAmount(String(data.target_amount));
          setTargetDate(data.target_date ?? "");
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id])
  );

  async function handleAddContribution() {
    if (!goal) return;
    setError(null);
    const amount = Number(contributionAmount);
    if (!amount || amount <= 0) {
      setError("Ingresa un aporte válido.");
      return;
    }

    setContributing(true);
    const { error } = await supabase
      .from("financial_goals")
      .update({ current_amount: goal.current_amount + amount })
      .eq("id", id);
    setContributing(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.back();
  }

  async function handleSave() {
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
    const { error } = await supabase
      .from("financial_goals")
      .update({
        name: name.trim(),
        target_amount: amount,
        target_date: targetDate || null,
      })
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
    const { error } = await supabase.from("financial_goals").delete().eq("id", id);
    setSaving(false);
    if (!error) router.back();
  }

  if (loading || !goal) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-ink">
        <ActivityIndicator color="#FF7900" />
      </View>
    );
  }

  const reached = goal.current_amount >= goal.target_amount;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-semibold text-ink dark:text-white">Editar meta</Text>

      {!reached && (
        <View className="gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            Llevas ahorrado:{" "}
            <Text className="font-semibold text-ink dark:text-white">
              {formatCurrency(goal.current_amount)}
            </Text>{" "}
            de {formatCurrency(goal.target_amount)}
          </Text>
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <TextField
                label="Registrar aporte"
                value={contributionAmount}
                onChangeText={setContributionAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
            <Pressable
              onPress={handleAddContribution}
              disabled={contributing}
              className="items-center rounded-full bg-accent px-4 py-2.5 active:bg-accent-hover disabled:opacity-50"
            >
              {contributing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-sm font-semibold text-white">Aportar</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <TextField label="Nombre" value={name} onChangeText={setName} />
        <TextField
          label="Monto meta"
          value={targetAmount}
          onChangeText={setTargetAmount}
          keyboardType="decimal-pad"
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
        <Text className="text-sm font-medium text-danger">Eliminar esta meta</Text>
      </Pressable>
    </ScrollView>
  );
}
