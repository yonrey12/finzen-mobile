import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { todayInHonduras } from "@/lib/date";
import { TransactionForm, type TransactionPayload } from "@/components/transaction-form";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "income" | "expense" };

export default function NewTransactionScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        supabase.from("accounts").select("id, name").order("created_at", { ascending: true }),
        supabase.from("categories").select("id, name, kind"),
      ]).then(([{ data: accs }, { data: cats }]) => {
        if (!active) return;
        setAccounts(accs ?? []);
        setCategories(cats ?? []);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  async function handleSubmit(payload: TransactionPayload) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No se pudo identificar tu sesión." };

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      ...payload,
    });
    if (error) return { error: error.message };

    router.back();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-ink">
        <ActivityIndicator color="#FF7900" />
      </View>
    );
  }

  if (accounts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-white px-6 dark:bg-ink">
        <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Necesitas crear al menos una cuenta antes de registrar movimientos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-semibold text-ink dark:text-white">Nuevo movimiento</Text>
      <TransactionForm
        accounts={accounts}
        categories={categories}
        today={todayInHonduras()}
        submitLabel="Guardar"
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}
