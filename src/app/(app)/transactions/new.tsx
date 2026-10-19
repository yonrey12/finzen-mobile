import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import { supabase } from "@/lib/supabase";
import { todayInHonduras } from "@/lib/date";
import { addPendingTransaction } from "@/lib/offline-queue";
import { TransactionForm, type TransactionPayload } from "@/components/transaction-form";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "income" | "expense" };

const ACCOUNTS_CACHE_KEY = "finzen_cached_accounts";
const CATEGORIES_CACHE_KEY = "finzen_cached_categories";

export default function NewTransactionScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const [cachedAccountsRaw, cachedCategoriesRaw] = await Promise.all([
          AsyncStorage.getItem(ACCOUNTS_CACHE_KEY),
          AsyncStorage.getItem(CATEGORIES_CACHE_KEY),
        ]);
        if (!active) return;
        if (cachedAccountsRaw) setAccounts(JSON.parse(cachedAccountsRaw));
        if (cachedCategoriesRaw) setCategories(JSON.parse(cachedCategoriesRaw));
        if (cachedAccountsRaw || cachedCategoriesRaw) setLoading(false);

        try {
          const [{ data: accs }, { data: cats }] = await Promise.all([
            supabase.from("accounts").select("id, name").order("created_at", { ascending: true }),
            supabase.from("categories").select("id, name, kind"),
          ]);
          if (!active) return;
          if (accs) {
            setAccounts(accs);
            AsyncStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(accs));
          }
          if (cats) {
            setCategories(cats);
            AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(cats));
          }
        } catch {
          // Offline and nothing cached yet — handled by the empty-state below.
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  async function handleSubmit(payload: TransactionPayload) {
    const netState = await NetInfo.fetch();

    if (netState.isConnected === false) {
      await addPendingTransaction(payload);
      return { queued: true as const };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No se pudo identificar tu sesión." };

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        ...payload,
      });
      if (error) return { error: error.message };
    } catch {
      await addPendingTransaction(payload);
      return { queued: true as const };
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

  if (accounts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-white px-6 dark:bg-ink">
        <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Necesitas crear al menos una cuenta antes de registrar movimientos. Si ya tienes una
          pero estás sin conexión, abre esta pantalla una vez con internet para guardarla en el
          celular.
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
