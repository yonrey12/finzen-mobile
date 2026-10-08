import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { TextField } from "@/components/text-field";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "income" | "expense" };
type TransactionType = "expense" | "income" | "transfer";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
];

export type TransactionPayload = {
  type: TransactionType;
  amount: number;
  account_id: string;
  category_id?: string | null;
  transfer_account_id?: string | null;
  occurred_on: string;
  description?: string | null;
};

export type TransactionDefaultValues = TransactionPayload;

function ChipPicker({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          onPress={() => onChange(opt.id)}
          className={
            value === opt.id
              ? "rounded-full bg-accent px-3 py-1.5"
              : "rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
          }
        >
          <Text
            className={
              value === opt.id
                ? "text-xs font-semibold text-white"
                : "text-xs font-medium text-zinc-600 dark:text-zinc-400"
            }
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function TransactionForm({
  accounts,
  categories,
  today,
  defaultValues,
  submitLabel = "Guardar",
  onSubmit,
}: {
  accounts: Account[];
  categories: Category[];
  today: string;
  defaultValues?: TransactionDefaultValues;
  submitLabel?: string;
  onSubmit: (payload: TransactionPayload) => Promise<{ error?: string } | void>;
}) {
  const [type, setType] = useState<TransactionType>(defaultValues?.type ?? "expense");
  const [amount, setAmount] = useState(
    defaultValues?.amount ? String(defaultValues.amount) : ""
  );
  const [accountId, setAccountId] = useState(defaultValues?.account_id ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(
    defaultValues?.category_id ??
      categories.find((c) => c.kind === (defaultValues?.type ?? "expense"))?.id ??
      ""
  );
  const [transferAccountId, setTransferAccountId] = useState(
    defaultValues?.transfer_account_id ?? ""
  );
  const [occurredOn, setOccurredOn] = useState(defaultValues?.occurred_on ?? today);
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [noteOpen, setNoteOpen] = useState(Boolean(defaultValues?.description));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.kind === type);
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);
  const isOtros = selectedCategory?.name === "Otros";
  const showNote = type !== "transfer" && (isOtros || noteOpen);

  function handleTypeChange(newType: TransactionType) {
    setType(newType);
    const cats = categories.filter((c) => c.kind === newType);
    setCategoryId(cats[0]?.id ?? "");
    setNoteOpen(false);
  }

  async function handleSubmit() {
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
    if (type === "transfer" && !transferAccountId) {
      setError("Selecciona la cuenta destino.");
      return;
    }
    if (type !== "transfer" && !categoryId) {
      setError("Selecciona una categoría.");
      return;
    }
    if (isOtros && !description.trim()) {
      setError('"Otros" necesita una nota que explique qué fue el gasto.');
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      type,
      amount: amountNumber,
      account_id: accountId,
      category_id: type === "transfer" ? null : categoryId,
      transfer_account_id: type === "transfer" ? transferAccountId : null,
      occurred_on: occurredOn,
      description: description.trim() || null,
    });
    setSubmitting(false);
    if (result?.error) setError(result.error);
  }

  return (
    <View className="gap-5">
      <ChipPicker
        options={TYPE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
        value={type}
        onChange={(v) => handleTypeChange(v as TransactionType)}
      />

      <TextField
        label="Monto"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        autoFocus
      />

      {type === "transfer" ? (
        <>
          <View className="gap-1">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Desde</Text>
            <ChipPicker
              options={accounts.map((a) => ({ id: a.id, label: a.name }))}
              value={accountId}
              onChange={setAccountId}
            />
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hacia</Text>
            <ChipPicker
              options={accounts.map((a) => ({ id: a.id, label: a.name }))}
              value={transferAccountId}
              onChange={setTransferAccountId}
            />
          </View>
        </>
      ) : (
        <>
          <View className="gap-1">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Categoría
            </Text>
            <ChipPicker
              options={filteredCategories.map((c) => ({ id: c.id, label: c.name }))}
              value={categoryId}
              onChange={setCategoryId}
            />
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cuenta</Text>
            <ChipPicker
              options={accounts.map((a) => ({ id: a.id, label: a.name }))}
              value={accountId}
              onChange={setAccountId}
            />
          </View>
        </>
      )}

      <TextField label="Fecha (AAAA-MM-DD)" value={occurredOn} onChangeText={setOccurredOn} />

      {type !== "transfer" && !showNote && (
        <Pressable onPress={() => setNoteOpen(true)} className="self-start">
          <Text className="text-sm font-medium text-accent">+ Agregar nota</Text>
        </Pressable>
      )}

      {showNote && (
        <TextField
          label={
            isOtros ? "Nota (obligatoria) — especifica qué fue este gasto" : "Nota (opcional)"
          }
          value={description}
          onChangeText={setDescription}
          placeholder="Ej: Coca-Cola, Transporte"
          hint={isOtros ? '"Otros" solo sirve si sabemos qué fue.' : undefined}
        />
      )}

      {error ? (
        <View className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
          <Text className="text-sm text-danger">{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        className="items-center rounded-full bg-accent px-4 py-3 active:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}
