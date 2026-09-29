import { getDictionary } from "@/i18n";

export type Align = "left" | "center" | "right";
export type HomeBlockKey =
  | "heroEyebrow" | "heroTitle" | "heroText" | "categoriesTitle"
  | "storyTitle" | "storyText" | "seoText1" | "seoText2"
  | "aboutTitle" | "aboutText1" | "aboutText2";

/** Editable home blocks. `alignable` = headings/paragraphs that support text alignment. */
export const HOME_BLOCKS: { key: HomeBlockKey; label: string; alignable: boolean; multiline: boolean }[] = [
  { key: "heroEyebrow", label: "Герой — надзаголовок", alignable: false, multiline: false },
  { key: "heroTitle", label: "Герой — заголовок", alignable: true, multiline: false },
  { key: "heroText", label: "Герой — текст", alignable: true, multiline: true },
  { key: "categoriesTitle", label: "Категории — заголовок", alignable: true, multiline: false },
  { key: "storyTitle", label: "«La casa» — заголовок", alignable: true, multiline: false },
  { key: "storyText", label: "«La casa» — текст", alignable: true, multiline: true },
  { key: "seoText1", label: "«Nuestra historia» — абзац 1", alignable: true, multiline: true },
  { key: "seoText2", label: "«Nuestra historia» — абзац 2", alignable: true, multiline: true },
  { key: "aboutTitle", label: "Sobre nosotros — заголовок", alignable: true, multiline: false },
  { key: "aboutText1", label: "Sobre nosotros — абзац 1", alignable: true, multiline: true },
  { key: "aboutText2", label: "Sobre nosotros — абзац 2", alignable: true, multiline: true },
];

export function homeDefaults(): Record<HomeBlockKey, string> {
  const h = getDictionary("es").home;
  return {
    heroEyebrow: h.heroEyebrow,
    heroTitle: h.heroTitle,
    heroText: h.heroText,
    categoriesTitle: h.categoriesTitle,
    storyTitle: h.storyTitle,
    storyText: h.storyText,
    seoText1: h.seoText[0] ?? "",
    seoText2: h.seoText[1] ?? "",
    aboutTitle: "Sobre nosotros",
    aboutText1:
      "Anabel Arto es una casa de lencería femenina de diseño europeo. Cada prenda se confecciona en nuestro taller de Ucrania con encajes, tules y tejidos seleccionados, cuidando el patronaje y los acabados como en la alta costura.",
    aboutText2:
      "Hoy ofrecemos en España la liquidación de nuestra colección a través de nuestro showroom: piezas de calidad europea en existencias limitadas, a precios especiales y con envío a toda la España peninsular.",
  };
}

export type HomeRow = { key: string; content: string; align: string | null };

export function resolveHome(rows: HomeRow[]) {
  const defs = homeDefaults();
  const map = new Map(rows.map((r) => [r.key, r]));
  const text = (k: HomeBlockKey) => map.get(k)?.content?.trim() || defs[k];
  const align = (k: HomeBlockKey): Align | undefined => {
    const a = map.get(k)?.align;
    return a === "left" || a === "center" || a === "right" ? a : undefined;
  };
  return { text, align };
}

export const alignClass = (a: Align | undefined) =>
  a === "center" ? "text-center" : a === "right" ? "text-right" : a === "left" ? "text-left" : "";
