import { useCallback, useState } from "react";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { todayInHonduras, addDaysToDateString, formatDateEs } from "@/lib/date";

type Transaction = {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string | null;
  occurred_on: string;
  account_id: string;
  category_id: string | null;
  transfer_account_id: string | null;
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: txs }, { data: accounts }, { data: categories }] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, type, amount, description, occurred_on, account_id, category_id, transfer_account_id"
        )
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("accounts").select("id, name"),
      supabase.from("categories").select("id, name"),
    ]);

    setTransactions(txs ?? []);
    setAccountNames(Object.fromEntries((accounts ?? []).map((a) => [a.id, a.name])));
    setCategoryNames(Object.fromEntries((categories ?? []).map((c) => [c.id, c.name])));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = todayInHonduras();
  const yesterday = addDaysToDateString(today, -1);

  function dateLabel(dateStr: string) {
    if (dateStr === today) return `Hoy, ${formatDateEs(dateStr)}`;
    if (dateStr === yesterday) return `Ayer, ${formatDateEs(dateStr)}`;
    return formatDateEs(dateStr);
  }

  const groups: { date: string; items: Transaction[] }[] = [];
  for (const t of transactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.occurred_on) {
      last.items.push(t);
    } else {
      groups.push({ date: t.occurred_on, items: [t] });
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-ink dark:text-white">Historial</Text>
        <Pressable
          onPress={() => router.push("/transactions/new")}
          className="rounded-full bg-accent px-4 py-2 active:bg-accent-hover"
        >
          <Text className="text-sm font-medium text-white">+ Agregar</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF7900" />
      ) : groups.length > 0 ? (
        <View className="gap-6">
          {groups.map((group) => (
            <View key={group.date} className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {dateLabel(group.date)}
              </Text>
              <View className="gap-2">
                {group.items.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() =>
                      router.push({ pathname: "/transactions/[id]", params: { id: t.id } })
                    }
                    className="flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="font-medium text-ink dark:text-white">
                        {t.type === "transfer"
                          ? `${accountNames[t.account_id] ?? "?"} → ${
                              accountNames[t.transfer_account_id ?? ""] ?? "?"
                            }`
                          : t.description ||
                            categoryNames[t.category_id ?? ""] ||
                            "Sin categoría"}
                      </Text>
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        {accountNames[t.account_id] ?? ""}
                        {t.type !== "transfer" && categoryNames[t.category_id ?? ""]
                          ? ` · ${categoryNames[t.category_id ?? ""]}`
                          : ""}
                      </Text>
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
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 dark:border-zinc-700">
          <Text className="font-medium text-ink dark:text-white">Sin movimientos todavía</Text>
          <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Registra tu primer ingreso o gasto para empezar.
          </Text>
          <Link href="/transactions/new" asChild>
            <Pressable className="rounded-full bg-accent px-4 py-2 active:bg-accent-hover">
              <Text className="text-sm font-medium text-white">+ Agregar movimiento</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </ScrollView>
  );
}
