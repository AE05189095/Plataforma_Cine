export function formatCurrency(amount: number | string | undefined | null) {
  const n = Number(amount) || 0;
  return `Q. ${n.toFixed(2)}`;
}
