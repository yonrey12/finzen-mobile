import { useCallback, useState } from "react";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { FREQUENCY_OPTIONS, FREQUENCY_LABELS } from "@/lib/recurring";
import { formatCurrency } from "@/lib/format";
import { todayInHonduras } from "@/lib/date";
import { TextField } from "@/components/text-field";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "income" | "expense" };
type Recurring = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  frequency: string;
  next_occurrence: string;
  is_active: boolean;
  account_id: string;
  category_id: string | null;
};

export default function RecurringScreen() {
  const router = useRouter();
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextOccurrence, setNextOccurrence] = useState(todayInHonduras());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: rec }, { data: accs }, { data: cats }] = await Promise.all([
      supabase
        .from("recurring_transactions")
        .select(
          "id, type, amount, description, frequency, next_occurrence, is_active, account_id, category_id"
        )
        .order("next_occurrence", { ascending: true }),
      supabase.from("accounts").select("id, name").order("created_at", { ascending: true }),
      supabase.from("categories").select("id, name, kind").order("name", { ascending: true }),
    ]);

    setRecurring(rec ?? []);
    setAccounts(accs ?? []);
    setCategories(cats ?? []);
    if (accs && accs.length > 0 && !accountId) setAccountId(accs[0].id);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const filteredCategories = categories.filter((c) => c.kind === type);

  async function handleCreate() {
    setError(null);
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    if (!accountId) {
      setError("Selecciona una cuenta.");
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

    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId || null,
      type,
      amount: amountNumber,
      description: description.trim() || null,
      frequency,
      next_occurrence: nextOccurrence,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setAmount("");
    setDescription("");
    setNextOccurrence(todayInHonduras());
    load();
  }

  if (!loading && accounts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white px-6 dark:bg-ink">
        <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Necesitas al menos una cuenta antes de agregar un recurrente.
        </Text>
        <Link href="/accounts/index" asChild>
          <Pressable className="rounded-full bg-accent px-4 py-2 active:bg-accent-hover">
            <Text className="text-sm font-medium text-white">Ir a Cuentas</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text className="text-xl font-semibold text-ink dark:text-white">
          Gastos e ingresos recurrentes
        </Text>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">
          Cosas que se repiten solas (Internet, Agua, tu salario...) sin que tengas que
          registrarlas cada vez.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF7900" />
      ) : recurring.length > 0 ? (
        <View className="gap-2">
          {recurring.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push({ pathname: "/recurring/[id]", params: { id: r.id } })}
              className="flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
            >
              <View className="flex-1 pr-3">
                <Text className="font-medium text-ink dark:text-white">
                  {r.description || categoryNames[r.category_id ?? ""] || "Sin categoría"}
                  {!r.is_active ? (
                    <Text className="text-xs font-normal text-zinc-400"> (pausado)</Text>
                  ) : null}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  {accountNames[r.account_id] ?? ""} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency}{" "}
                  · próximo: {r.next_occurrence}
                </Text>
              </View>
              <Text className={r.type === "income" ? "font-semibold text-income" : "font-semibold text-expense"}>
                {r.type === "income" ? "+" : "-"}
                {formatCurrency(r.amount)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="items-center gap-1 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 dark:border-zinc-700">
          <Text className="font-medium text-ink dark:text-white">Sin recurrentes todavía</Text>
          <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Agrega abajo lo que pagas o recibes siempre, como Internet o tu salario.
          </Text>
        </View>
      )}

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Text className="text-sm font-semibold text-ink dark:text-white">Agregar recurrente</Text>

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

        <TextField
          label="Monto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

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

        <TextField
          label="Nota (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Ej: Internet, Salario"
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
            <Text className="text-sm font-semibold text-white">Guardar recurrente</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
