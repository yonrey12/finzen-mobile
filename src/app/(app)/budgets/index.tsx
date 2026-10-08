import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { currentYearMonthInHonduras, currentMonthRangeInHonduras, MONTH_NAMES_ES } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { TextField } from "@/components/text-field";

type Category = { id: string; name: string };
type Budget = { id: string; category_id: string; limit_amount: number };

function BudgetRow({
  category,
  budget,
  spent,
  onSaved,
}: {
  category: Category;
  budget?: Budget;
  spent: number;
  onSaved: () => void;
}) {
  const [limitInput, setLimitInput] = useState(budget ? String(budget.limit_amount) : "");
  const [saving, setSaving] = useState(false);

  const limit = budget?.limit_amount;
  const percent = limit ? Math.min((spent / limit) * 100, 100) : 0;
  const isOver = limit != null && spent > limit;
  const barColorClass = isOver ? "bg-danger" : percent >= 80 ? "bg-warning" : "bg-income";

  async function handleSet() {
    const amount = Number(limitInput);
    if (!amount || amount <= 0) return;

    setSaving(true);
    const { year, month } = currentYearMonthInHonduras();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await supabase.from("budgets").upsert(
      {
        user_id: user.id,
        category_id: category.id,
        month,
        year,
        limit_amount: amount,
      },
      { onConflict: "user_id,category_id,month,year" }
    );
    setSaving(false);
    onSaved();
  }

  async function handleRemove() {
    if (!budget) return;
    setSaving(true);
    await supabase.from("budgets").delete().eq("id", budget.id);
    setSaving(false);
    setLimitInput("");
    onSaved();
  }

  return (
    <View className="gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-ink dark:text-white">{category.name}</Text>
        {limit != null ? (
          <Text className={isOver ? "text-sm font-medium text-danger" : "text-sm text-zinc-500 dark:text-zinc-400"}>
            {formatCurrency(spent)} de {formatCurrency(limit)}
            {isOver ? " · excedido" : ` · ${Math.round(percent)}%`}
          </Text>
        ) : (
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatCurrency(spent)} gastado · sin presupuesto
          </Text>
        )}
      </View>

      {limit != null ? (
        <View className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
          <View className={`h-2 rounded-full ${barColorClass}`} style={{ width: `${percent}%` }} />
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <TextField
            label="Límite mensual"
            value={limitInput}
            onChangeText={setLimitInput}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        <Pressable
          onPress={handleSet}
          disabled={saving}
          className="rounded-full bg-accent px-3 py-2 active:bg-accent-hover disabled:opacity-50"
        >
          <Text className="text-sm font-medium text-white">
            {limit != null ? "Actualizar" : "Fijar"}
          </Text>
        </Pressable>
        {budget ? (
          <Pressable onPress={handleRemove} disabled={saving} className="px-2 py-2">
            <Text className="text-sm font-medium text-danger">Quitar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function BudgetsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const { year, month } = currentYearMonthInHonduras();
  const { start, nextMonthStart } = currentMonthRangeInHonduras();

  const load = useCallback(async () => {
    const [{ data: cats }, { data: bgts }, { data: txs }] = await Promise.all([
      supabase.from("categories").select("id, name").eq("kind", "expense").order("name", { ascending: true }),
      supabase.from("budgets").select("id, category_id, limit_amount").eq("year", year).eq("month", month),
      supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("type", "expense")
        .gte("occurred_on", start)
        .lt("occurred_on", nextMonthStart),
    ]);

    setCategories(cats ?? []);
    setBudgets(bgts ?? []);

    const spent: Record<string, number> = {};
    for (const t of txs ?? []) {
      if (!t.category_id) continue;
      spent[t.category_id] = (spent[t.category_id] ?? 0) + t.amount;
    }
    setSpentByCategory(spent);
    setLoading(false);
  }, [year, month, start, nextMonthStart]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const budgetByCategory = Object.fromEntries(budgets.map((b) => [b.category_id, b]));

  return (
    <ScrollView className="flex-1 bg-white dark:bg-ink" contentContainerClassName="gap-6 px-4 py-6">
      <View>
        <Text className="text-xl font-semibold text-ink dark:text-white">Presupuesto</Text>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">
          {MONTH_NAMES_ES[month - 1]} {year} · cuánto puedes gastar por categoría
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF7900" />
      ) : (
        <View className="gap-3">
          {categories.map((cat) => (
            <BudgetRow
              key={cat.id}
              category={cat}
              budget={budgetByCategory[cat.id]}
              spent={spentByCategory[cat.id] ?? 0}
              onSaved={load}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
