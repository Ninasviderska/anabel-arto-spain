import { createContext, useContext } from "react";
import { es } from "./es";
import { defaultLocale, type Locale } from "./config";

export type Dictionary = typeof es;
export type LegalSlug = keyof Dictionary["legal"]["pages"];

const dictionaries: Record<Locale, Dictionary> = { es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export const legalSlugs = Object.keys(es.legal.pages) as LegalSlug[];

/** Tiny interpolation helper: fmt("Hola {name}", { name: "Ana" }) */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export const I18nContext = createContext<{ locale: Locale; d: Dictionary }>({
  locale: defaultLocale,
  d: es,
});

export function useI18n() {
  return useContext(I18nContext);
}

export { locales, defaultLocale, isLocale, localeTags } from "./config";
export type { Locale } from "./config";
