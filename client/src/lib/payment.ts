export type RawCardInfo = { number: string; name: string; exp: string; cvc: string };
export type NormalizedCard = { number: string; last4: string; name: string; expMonth: string; expYear: string; cvc: string };
export type PaymentPayload = { method: 'card' | 'paypal'; card?: NormalizedCard; paypal?: { email: string } };

// Normalize raw card input into a stable structure suitable for backend storage
export function normalizeCard(raw: RawCardInfo): NormalizedCard {
  const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');
  const number = onlyDigits(raw.number).slice(0, 19); // keep up to 19 digits
  const last4 = number.slice(-4).padStart(4, '0');

  // exp can be MM/YY or MMYY or M/YY etc. Normalize to MM and 4-digit year
  const expDigits = onlyDigits(raw.exp);
  let expMonth = '';
  let expYear = '';
  if (expDigits.length === 4) {
    expMonth = expDigits.slice(0, 2);
    const yy = expDigits.slice(2);
    expYear = `20${yy}`;
  } else if (expDigits.length === 3) {
    // e.g., MYY -> 0M/YY
    expMonth = `0${expDigits.slice(0,1)}`;
    expYear = `20${expDigits.slice(1)}`;
  } else if (expDigits.length === 2) {
    expMonth = expDigits;
    // no year: leave blank
    expYear = '';
  } else {
    // fallback: try to parse first two as month
    expMonth = expDigits.slice(0,2);
    expYear = expDigits.length > 2 ? `20${expDigits.slice(2,4)}` : '';
  }

  // normalize cvc to digits (max 4)
  const cvc = onlyDigits(raw.cvc).slice(0, 4);

  return { number, last4, name: (raw.name || '').trim(), expMonth, expYear, cvc };
}

export function normalizePaymentPayload(input: { method: 'card' | 'paypal'; card?: RawCardInfo; paypal?: { email: string } }): PaymentPayload {
  if (input.method === 'card' && input.card) {
    return { method: 'card', card: normalizeCard(input.card) };
  }
  return { method: 'paypal', paypal: { email: input.paypal?.email || '' } };
}
