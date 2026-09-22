export const locales = ["es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** BCP-47 tags used for <html lang>, Intl formatting and og:locale. */
export const localeTags: Record<Locale, string> = {
  es: "es-ES",
};
