import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/accounts";
import { formatCurrency } from "@/lib/format";
import { TextField } from "@/components/text-field";

type Account = {
  id: string;
  name: string;
  type: string;
  initial_balance: number;
};

export default function AccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [initialBalance, setInitialBalance] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    const { data } = await supabase
      .from("accounts")
      .select("id, name, type, initial_balance")
      .order("created_at", { ascending: true });
    setAccounts(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts])
  );

  async function handleCreate() {
    setError(null);
    if (!name.trim()) {
      setError("Ponle un nombre a la cuenta.");
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

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: name.trim(),
      type,
      initial_balance: Number(initialBalance) || 0,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    setType("cash");
    setInitialBalance("0");
    loadAccounts();
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-semibold text-ink dark:text-white">Tus cuentas</Text>

      <View className="gap-2">
        {loading ? (
          <ActivityIndicator color="#FF7900" />
        ) : accounts.length > 0 ? (
          accounts.map((account) => (
            <Pressable
              key={account.id}
              onPress={() =>
                router.push({ pathname: "/accounts/[id]", params: { id: account.id } })
              }
              className="flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
            >
              <View>
                <Text className="font-medium text-ink dark:text-white">{account.name}</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                </Text>
              </View>
              <Text className="font-medium text-ink dark:text-white">
                {formatCurrency(account.initial_balance)}
              </Text>
            </Pressable>
          ))
        ) : (
          <View className="items-center gap-1 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 dark:border-zinc-700">
            <Text className="font-medium text-ink dark:text-white">Sin cuentas todavía</Text>
            <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Crea la primera abajo — Efectivo, tu banco o cooperativa.
            </Text>
          </View>
        )}
      </View>

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Text className="text-sm font-semibold text-ink dark:text-white">Agregar cuenta</Text>

        <TextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Ej: BAC, Efectivo, Cooperativa"
        />

        <View className="gap-1">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</Text>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                className={
                  type === t.value
                    ? "rounded-full bg-accent px-3 py-1.5"
                    : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                }
              >
                <Text
                  className={
                    type === t.value
                      ? "text-xs font-semibold text-white"
                      : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField
          label="Saldo inicial"
          value={initialBalance}
          onChangeText={setInitialBalance}
          keyboardType="decimal-pad"
          hint='Si no sabes el monto exacto, pon tu mejor estimado — lo puedes corregir después tocando la cuenta.'
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
            <Text className="text-sm font-semibold text-white">Guardar cuenta</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
