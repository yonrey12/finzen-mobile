export const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "bank", label: "Banco" },
  { value: "cooperative", label: "Cooperativa" },
  { value: "credit_card", label: "Tarjeta de crédito" },
  { value: "wallet", label: "Billetera digital" },
  { value: "receivable", label: "Por cobrar" },
];

export const ACCOUNT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ACCOUNT_TYPES.map((t) => [t.value, t.label])
);
