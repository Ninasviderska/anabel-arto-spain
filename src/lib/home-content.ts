import { getDictionary } from "@/i18n";

export type Align = "left" | "center" | "right";
export type HomeBlockKey =
  | "heroEyebrow" | "heroTitle" | "heroText" | "categoriesTitle"
  | "storyTitle" | "storyText" | "seoText1" | "seoText2";

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
