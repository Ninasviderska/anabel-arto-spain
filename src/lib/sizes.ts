import type { SizeType } from "./catalog.types";

export const numericSizeRows = [
  { maker: "36", es: "32", it: "34", uk: "6", us: "4", intl: "XS", de: "30" },
  { maker: "38", es: "34", it: "36", uk: "8", us: "6", intl: "XS/S", de: "32" },
  { maker: "40", es: "36", it: "38", uk: "8", us: "6", intl: "S", de: "34" },
  { maker: "42", es: "38", it: "40", uk: "10", us: "8", intl: "S", de: "36" },
  { maker: "44", es: "40", it: "42", uk: "12", us: "10", intl: "M", de: "38" },
  { maker: "46", es: "42", it: "44", uk: "14", us: "12", intl: "M", de: "40" },
] as const;

export const braBandRows = [
  { maker: "70", es: "85", it: "1", ukUs: "32" },
  { maker: "75", es: "90", it: "2", ukUs: "34" },
  { maker: "80", es: "95", it: "3", ukUs: "36" },
  { maker: "85", es: "100", it: "4", ukUs: "38" },
  { maker: "90", es: "105", it: "5", ukUs: "40" },
] as const;

export function parseBraSize(size: string) {
  const match = size.match(/^([A-Z]+)\s+(\d+)$/);
  return match ? { cup: match[1] ?? "", band: match[2] ?? "" } : null;
}

export function displaySize(size: string, type: SizeType): string {
  if (type === "bra") {
    const parsed = parseBraSize(size);
    const band = braBandRows.find((row) => row.maker === parsed?.band)?.es;
    return parsed && band ? `${parsed.cup} ${band}` : size;
  }
  if (type === "numeric") return numericSizeRows.find((row) => row.maker === size)?.es ?? size;
  return size;
}

export function manufacturerSizeLabel(size: string): string {
  return `Fabricante: ${size}`;
}