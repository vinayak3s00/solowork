// Currency formatting, configurable via NEXT_PUBLIC_CURRENCY (ISO 4217, e.g. "USD", "EUR", "INR").
// NEXT_PUBLIC_ vars are inlined at build time, so this is safe on the client.

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'USD'
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || undefined // undefined = user's locale

let formatter
try {
  formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })
} catch {
  formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD' })
}

/** Formats a numeric amount as a localized currency string. */
export function formatCurrency(amount) {
  const n = Number(amount)
  return formatter.format(Number.isFinite(n) ? n : 0)
}

export const currencyCode = CURRENCY
