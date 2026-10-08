import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { FREQUENCY_OPTIONS } from "@/lib/recurring";
import { TextField } from "@/components/text-field";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "income" | "expense" };

export default function EditRecurringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextOccurrence, setNextOccurrence] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        supabase.from("accounts").select("id, name").order("created_at", { ascending: true }),
        supabase.from("categories").select("id, name, kind").order("name", { ascending: true }),
        supabase
          .from("recurring_transactions")
          .select(
            "type, account_id, category_id, amount, description, frequency, next_occurrence, is_active"
          )
          .eq("id", id)
          .single(),
      ]).then(([{ data: accs }, { data: cats }, { data: rec }]) => {
        if (!active) return;
        setAccounts(accs ?? []);
        setCategories(cats ?? []);
        if (rec) {
          setType(rec.type);
          setAccountId(rec.account_id);
          setCategoryId(rec.category_id ?? "");
          setAmount(String(rec.amount));
          setFrequency(rec.frequency);
          setNextOccurrence(rec.next_occurrence);
          setDescription(rec.description ?? "");
          setIsActive(rec.is_active);
        }
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  const filteredCategories = categories.filter((c) => c.kind === type);

  async function handleSave() {
    setError(null);
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("recurring_transactions")
      .update({
        type,
        account_id: accountId,
        category_id: categoryId || null,
        amount: amountNumber,
        description: description.trim() || null,
        frequency,
        next_occurrence: nextOccurrence,
        is_active: isActive,
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
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
    setSaving(false);
    if (!error) router.back();
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
      <Text className="text-xl font-semibold text-ink dark:text-white">Editar recurrente</Text>

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <View className="gap-1">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</Text>
          <View className="flex-row gap-2">
            {(["expense", "income"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  setType(t);
                  setCategoryId("");
                }}
                className={
                  type === t
                    ? "rounded-full bg-accent px-3 py-1.5"
                    : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                }
              >
                <Text
                  className={
                    type === t
                      ? "text-xs font-semibold text-white"
                      : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {t === "expense" ? "Gasto" : "Ingreso"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoría</Text>
          <View className="flex-row flex-wrap gap-2">
            {filteredCategories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                className={
                  categoryId === c.id
                    ? "rounded-full bg-accent px-3 py-1.5"
                    : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                }
              >
                <Text
                  className={
                    categoryId === c.id
                      ? "text-xs font-semibold text-white"
                      : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cuenta</Text>
          <View className="flex-row flex-wrap gap-2">
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setAccountId(a.id)}
                className={
                  accountId === a.id
                    ? "rounded-full bg-accent px-3 py-1.5"
                    : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                }
              >
                <Text
                  className={
                    accountId === a.id
                      ? "text-xs font-semibold text-white"
                      : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {a.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField label="Monto" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

        <View className="gap-1">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Frecuencia</Text>
          <View className="flex-row flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFrequency(f.value)}
                className={
                  frequency === f.value
                    ? "rounded-full bg-accent px-3 py-1.5"
                    : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                }
              >
                <Text
                  className={
                    frequency === f.value
                      ? "text-xs font-semibold text-white"
                      : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField
          label="Próxima fecha (AAAA-MM-DD)"
          value={nextOccurrence}
          onChangeText={setNextOccurrence}
        />

        <TextField label="Nota (opcional)" value={description} onChangeText={setDescription} />

        <View className="flex-row items-center justify-between">
          <Text className="flex-1 pr-3 text-sm text-zinc-700 dark:text-zinc-300">
            Activo (si lo desactivas, se pausa y no se generan movimientos)
          </Text>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: "#FF7900" }} />
        </View>

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
        <Text className="text-sm font-medium text-danger">Eliminar este recurrente</Text>
      </Pressable>
    </ScrollView>
  );
}
