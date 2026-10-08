import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { currentMonthRangeInHonduras, currentYearMonthInHonduras, MONTH_NAMES_ES } from "@/lib/date";
import { FREQUENCY_LABELS } from "@/lib/recurring";
import { processDueRecurringTransactions } from "@/lib/recurring-processing";

type Transaction = {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string | null;
  occurred_on: string;
  category_id: string | null;
};

type Recurring = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  category_id: string | null;
  frequency: string;
  next_occurrence: string;
};

const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [topCategories, setTopCategories] = useState<{ name: string; amount: number }[]>([]);
  const [upcomingRecurring, setUpcomingRecurring] = useState<Recurring[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    await processDueRecurringTransactions();

    const { start: monthStart, nextMonthStart } = currentMonthRangeInHonduras();

    const [
      { data: accounts },
      { data: allTransactions },
      { data: categories },
      { data: recent },
      { data: upcoming },
    ] = await Promise.all([
      supabase.from("accounts").select("id, initial_balance"),
      supabase.from("transactions").select("type, amount, category_id, occurred_on"),
      supabase.from("categories").select("id, name"),
      supabase
        .from("transactions")
        .select("id, type, amount, description, occurred_on, category_id")
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("recurring_transactions")
        .select("id, type, amount, description, category_id, frequency, next_occurrence")
        .eq("is_active", true)
        .order("next_occurrence", { ascending: true })
        .limit(3),
    ]);

    const catNames = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));
    setCategoryNames(catNames);

    const txns = allTransactions ?? [];
    const totalIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const startingBalance = (accounts ?? []).reduce((s, a) => s + a.initial_balance, 0);
    setTotalBalance(startingBalance + totalIncome - totalExpense);

    const monthTxns = txns.filter((t) => t.occurred_on >= monthStart && t.occurred_on < nextMonthStart);
    setMonthIncome(monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
    setMonthExpense(monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));

    const categoryTotals = new Map<string, number>();
    for (const t of monthTxns) {
      if (t.type !== "expense" || !t.category_id) continue;
      categoryTotals.set(t.category_id, (categoryTotals.get(t.category_id) ?? 0) + t.amount);
    }
    const top = Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => ({ name: catNames[categoryId] ?? "Sin categoría", amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    setTopCategories(top);

    setRecentTransactions(recent ?? []);
    setUpcomingRecurring(upcoming ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const { year, month } = currentYearMonthInHonduras();
  const maxCategoryAmount = topCategories[0]?.amount ?? 0;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-ink">
        <ActivityIndicator color="#FF7900" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-ink" contentContainerClassName="gap-8 px-4 py-6">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-semibold text-ink dark:text-white">Hola 👋</Text>
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            Tu resumen de {MONTH_NAMES_ES[month - 1]} {year}
          </Text>
        </View>
        <Link href="/transactions/new" asChild>
          <Pressable className="rounded-full bg-accent px-4 py-2.5 active:bg-accent-hover">
            <Text className="text-sm font-semibold text-white">+ Agregar</Text>
          </Pressable>
        </Link>
      </View>

      <View className={cardClass}>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">Balance disponible</Text>
        <Text
          className={
            totalBalance < 0
              ? "mt-3 text-4xl font-semibold text-danger"
              : "mt-3 text-4xl font-semibold text-ink dark:text-white"
          }
        >
          {formatCurrency(totalBalance)}
        </Text>
      </View>

      <View className="flex-row gap-4">
        <View className={`flex-1 ${cardClass}`}>
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">Ingresos este mes</Text>
          <Text className="text-2xl font-semibold text-income">{formatCurrency(monthIncome)}</Text>
        </View>
        <View className={`flex-1 ${cardClass}`}>
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">Gastos este mes</Text>
          <Text className="text-2xl font-semibold text-expense">{formatCurrency(monthExpense)}</Text>
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-sm font-semibold text-ink dark:text-white">
          En qué se fue tu dinero este mes
        </Text>
        {topCategories.length > 0 ? (
          <View className={`gap-3 ${cardClass}`}>
            {topCategories.map((c) => (
              <View key={c.name} className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-zinc-700 dark:text-zinc-300">{c.name}</Text>
                  <Text className="text-sm font-medium text-ink dark:text-white">
                    {formatCurrency(c.amount)}
                  </Text>
                </View>
                <View className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <View
                    className="h-2.5 rounded-full bg-accent"
                    style={{
                      width: `${maxCategoryAmount > 0 ? (c.amount / maxCategoryAmount) * 100 : 0}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center rounded-2xl border border-dashed border-zinc-300 px-4 py-5 dark:border-zinc-700">
            <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Sin gastos este mes. En cuanto registres uno, aquí verás en qué se te va el dinero.
            </Text>
          </View>
        )}
      </View>

      {upcomingRecurring.length > 0 ? (
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink dark:text-white">Próximos pagos</Text>
            <Link href="/recurring/index" className="text-sm font-medium text-accent">
              Ver todo
            </Link>
          </View>
          <View className="gap-2">
            {upcomingRecurring.map((r) => (
              <View key={r.id} className={`flex-row items-center justify-between ${cardClass}`}>
                <View className="flex-1 pr-3">
                  <Text className="font-medium text-ink dark:text-white">
                    {r.description || categoryNames[r.category_id ?? ""] || "Sin categoría"}
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                    {r.next_occurrence} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency}
                  </Text>
                </View>
                <Text className={r.type === "income" ? "font-semibold text-income" : "font-semibold text-expense"}>
                  {r.type === "income" ? "+" : "-"}
                  {formatCurrency(r.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-ink dark:text-white">Últimos movimientos</Text>
          <Link href="/transactions/index" className="text-sm font-medium text-accent">
            Ver todo
          </Link>
        </View>

        {recentTransactions.length > 0 ? (
          <View className="gap-2">
            {recentTransactions.map((t) => (
              <View key={t.id} className={`flex-row items-center justify-between ${cardClass}`}>
                <View className="flex-1 pr-3">
                  <Text className="font-medium text-ink dark:text-white">
                    {t.description ||
                      categoryNames[t.category_id ?? ""] ||
                      (t.type === "transfer" ? "Transferencia" : "Sin categoría")}
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400">{t.occurred_on}</Text>
                </View>
                <Text
                  className={
                    t.type === "income"
                      ? "font-semibold text-income"
                      : t.type === "expense"
                        ? "font-semibold text-expense"
                        : "font-semibold text-ink dark:text-white"
                  }
                >
                  {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                  {formatCurrency(t.amount)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 dark:border-zinc-700">
            <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Sin movimientos todavía. Registra tu primer ingreso o gasto para empezar a ver tu
              resumen.
            </Text>
            <Link href="/transactions/new" asChild>
              <Pressable className="rounded-full bg-accent px-4 py-2 active:bg-accent-hover">
                <Text className="text-sm font-medium text-white">+ Agregar movimiento</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
