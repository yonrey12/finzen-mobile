import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { DEBT_DIRECTIONS } from "@/lib/debts";
import { formatCurrency } from "@/lib/format";
import { TextField } from "@/components/text-field";

type Debt = {
  id: string;
  person_or_entity: string;
  direction: string;
  total_amount: number;
  paid_amount: number;
  interest_rate: number;
  due_date: string | null;
  status: string;
};

function DebtCard({ debt, onPress }: { debt: Debt; onPress: () => void }) {
  const remaining = debt.total_amount - debt.paid_amount;
  const progress = debt.total_amount > 0 ? Math.min((debt.paid_amount / debt.total_amount) * 100, 100) : 0;

  return (
    <Pressable
      onPress={onPress}
      className="gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-medium text-ink dark:text-white">{debt.person_or_entity}</Text>
          {debt.due_date ? (
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              Vence: {debt.due_date}
              {debt.interest_rate > 0 ? ` · Interés: ${debt.interest_rate}%` : ""}
            </Text>
          ) : null}
        </View>
        {debt.status === "paid" ? (
          <Text className="text-sm font-medium text-income">Pagada</Text>
        ) : (
          <Text className="font-semibold text-ink dark:text-white">
            {formatCurrency(remaining)}
          </Text>
        )}
      </View>
      <View className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
        <View className="h-2 rounded-full bg-income" style={{ width: `${progress}%` }} />
      </View>
    </Pressable>
  );
}

export default function DebtsScreen() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const [personOrEntity, setPersonOrEntity] = useState("");
  const [direction, setDirection] = useState("i_owe");
  const [totalAmount, setTotalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("debts")
      .select(
        "id, person_or_entity, direction, total_amount, paid_amount, interest_rate, due_date, status"
      )
      .order("created_at", { ascending: true });
    setDebts(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCreate() {
    setError(null);
    if (!personOrEntity.trim()) {
      setError("Indica la persona o entidad.");
      return;
    }
    const amount = Number(totalAmount);
    if (!amount || amount <= 0) {
      setError("Ingresa un monto total válido.");
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

    const { error } = await supabase.from("debts").insert({
      user_id: user.id,
      person_or_entity: personOrEntity.trim(),
      direction,
      total_amount: amount,
      interest_rate: Number(interestRate) || 0,
      due_date: dueDate || null,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setPersonOrEntity("");
    setDirection("i_owe");
    setTotalAmount("");
    setInterestRate("0");
    setDueDate("");
    load();
  }

  const iOwe = debts.filter((d) => d.direction === "i_owe");
  const owedToMe = debts.filter((d) => d.direction === "owed_to_me");

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-8 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-semibold text-ink dark:text-white">Deudas</Text>

      {loading ? (
        <ActivityIndicator color="#FF7900" />
      ) : (
        <>
          <View className="gap-3">
            <Text className="text-sm font-semibold text-ink dark:text-white">Yo debo</Text>
            {iOwe.length > 0 ? (
              <View className="gap-2">
                {iOwe.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    onPress={() =>
                      router.push({ pathname: "/debts/[id]", params: { id: d.id } })
                    }
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-2xl border border-dashed border-zinc-300 px-4 py-5 dark:border-zinc-700">
                <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No debes nada registrado. Bien por ti.
                </Text>
              </View>
            )}
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-ink dark:text-white">Me deben</Text>
            {owedToMe.length > 0 ? (
              <View className="gap-2">
                {owedToMe.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    onPress={() =>
                      router.push({ pathname: "/debts/[id]", params: { id: d.id } })
                    }
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-2xl border border-dashed border-zinc-300 px-4 py-5 dark:border-zinc-700">
                <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Nadie te debe nada. Cuando alguien te quede debiendo, regístralo aquí.
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Text className="text-sm font-semibold text-ink dark:text-white">Agregar deuda</Text>

        <TextField
          label="Persona o entidad"
          value={personOrEntity}
          onChangeText={setPersonOrEntity}
          placeholder="Ej: CEUTEC, Zuri, David"
        />

        <View className="gap-1">
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ¿Quién le debe a quién?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DEBT_DIRECTIONS.map((d) => (
              <Pressable
                key={d.value}
                onPress={() => setDirection(d.value)}
                className={
                  direction === d.value
                    ? "rounded-full bg-accent px-3 py-1.5"
                    : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                }
              >
                <Text
                  className={
                    direction === d.value
                      ? "text-xs font-semibold text-white"
                      : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  }
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField
          label="Monto total"
          value={totalAmount}
          onChangeText={setTotalAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <View className="flex-row gap-4">
          <View className="flex-1">
            <TextField
              label="Interés % (opcional)"
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Vencimiento (AAAA-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="Opcional"
            />
          </View>
        </View>

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
            <Text className="text-sm font-semibold text-white">Guardar deuda</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
