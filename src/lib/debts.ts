export const DEBT_DIRECTIONS: { value: string; label: string }[] = [
  { value: "i_owe", label: "Yo debo" },
  { value: "owed_to_me", label: "Me deben" },
];

export const DEBT_DIRECTION_LABELS: Record<string, string> = Object.fromEntries(
  DEBT_DIRECTIONS.map((d) => [d.value, d.label])
);
