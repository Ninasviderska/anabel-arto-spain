import { localeTags, type Locale } from "@/i18n/config";

export function formatPrice(cents: number, locale: Locale = "es"): string {
  return new Intl.NumberFormat(localeTags[locale], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}
