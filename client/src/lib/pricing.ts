export const PRICE_REGULAR = 45;
export const PRICE_PREMIUM = 65;

export function getPriceForHall(hallName?: string | null, rawPrice?: number | null) {
  if (rawPrice && typeof rawPrice === 'number' && rawPrice > 0) return rawPrice;
  if (!hallName) return PRICE_REGULAR;
  const lower = hallName.toLowerCase();
  if (lower.includes('vip')) return PRICE_PREMIUM;
  if (lower.includes('sala 1') || lower.includes('principal') || lower.includes('sala 1 - principal')) return PRICE_REGULAR;
  return PRICE_REGULAR;
}
