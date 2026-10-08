export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
  }).format(amount);
}
