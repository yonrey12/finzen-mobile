import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [debt, setDebt] = useState<Debt | null>(null);
  const [loading, setLoading] = useState(true);

  const [personOrEntity, setPersonOrEntity] = useState("");
  const [direction, setDirection] = useState("i_owe");
  const [totalAmount, setTotalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      supabase
        .from("debts")
        .select(
          "id, person_or_entity, direction, total_amount, paid_amount, interest_rate, due_date, status"
        )
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (!active || !data) return;
          setDebt(data);
          setPersonOrEntity(data.person_or_entity);
          setDirection(data.direction);
          setTotalAmount(String(data.total_amount));
          setInterestRate(String(data.interest_rate));
          setDueDate(data.due_date ?? "");
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id])
  );

  async function handleRecordPayment() {
    if (!debt) return;
    setError(null);
    const amount = Number(paymentAmount);
    const remaining = debt.total_amount - debt.paid_amount;
    if (!amount || amount <= 0 || amount > remaining) {
      setError(`Ingresa un abono entre 0.01 y ${formatCurrency(remaining)}.`);
      return;
    }

    setPaying(true);
    const newPaidAmount = debt.paid_amount + amount;
    const status = newPaidAmount >= debt.total_amount ? "paid" : "active";

    const { error } = await supabase
      .from("debts")
      .update({ paid_amount: newPaidAmount, status })
      .eq("id", id);

    setPaying(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.back();
  }

  async function handleSave() {
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
    const { error } = await supabase
      .from("debts")
      .update({
        person_or_entity: personOrEntity.trim(),
        direction,
        total_amount: amount,
        interest_rate: Number(interestRate) || 0,
        due_date: dueDate || null,
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
    const { error } = await supabase.from("debts").delete().eq("id", id);
    setSaving(false);
    if (!error) router.back();
  }

  if (loading || !debt) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-ink">
        <ActivityIndicator color="#FF7900" />
      </View>
    );
  }

  const remaining = debt.total_amount - debt.paid_amount;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-ink"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-semibold text-ink dark:text-white">Editar deuda</Text>

      {debt.status !== "paid" && (
        <View className="gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            Saldo pendiente:{" "}
            <Text className="font-semibold text-ink dark:text-white">
              {formatCurrency(remaining)}
            </Text>
          </Text>
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <TextField
                label="Registrar abono"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
            <Pressable
              onPress={handleRecordPayment}
              disabled={paying}
              className="items-center rounded-full bg-accent px-4 py-2.5 active:bg-accent-hover disabled:opacity-50"
            >
              {paying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-sm font-semibold text-white">Abonar</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      <View className="gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <TextField label="Persona o entidad" value={personOrEntity} onChangeText={setPersonOrEntity} />

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
        <Text className="text-sm font-medium text-danger">Eliminar esta deuda</Text>
      </Pressable>
    </ScrollView>
  );
}
