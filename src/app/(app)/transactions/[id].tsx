import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { todayInHonduras } from "@/lib/date";
import {
  TransactionForm,
  type TransactionDefaultValues,
  type TransactionPayload,
} from "@/components/transaction-form";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "income" | "expense" };

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultValues, setDefaultValues] = useState<TransactionDefaultValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        supabase.from("accounts").select("id, name").order("created_at", { ascending: true }),
        supabase.from("categories").select("id, name, kind"),
        supabase
          .from("transactions")
          .select(
            "type, amount, account_id, category_id, transfer_account_id, occurred_on, description"
          )
          .eq("id", id)
          .single(),
      ]).then(([{ data: accs }, { data: cats }, { data: tx }]) => {
        if (!active) return;
        setAccounts(accs ?? []);
        setCategories(cats ?? []);
        if (tx) setDefaultValues(tx);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  async function handleSubmit(payload: TransactionPayload) {
    const { error } = await supabase.from("transactions").update(payload).eq("id", id);
    if (error) return { error: error.message };
    router.back();
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    setDeleting(false);
    if (!error) router.back();
  }

  if (loading || !defaultValues) {
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
      <Text className="text-xl font-semibold text-ink dark:text-white">Editar movimiento</Text>
      <TransactionForm
        accounts={accounts}
        categories={categories}
        today={todayInHonduras()}
        defaultValues={defaultValues}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
      <Pressable onPress={handleDelete} disabled={deleting} className="items-center py-2">
        <Text className="text-sm font-medium text-danger">Eliminar este movimiento</Text>
      </Pressable>
    </ScrollView>
  );
}
