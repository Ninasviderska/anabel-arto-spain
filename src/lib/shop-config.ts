/**
 * Shop-wide configuration. All monetary values are integer cents (EUR, IVA incl.).
 * PLACEHOLDER values — replace with real figures before launch.
 */
export const shopConfig = {
  brandName: "Anabel Arto",
  /** Production domain (used for JSON-LD / sitemap when no request origin is available). */
  siteUrl: "https://anabelarto.es",
  currency: "EUR",
  shippingCents: 495,
  freeShippingThresholdCents: 6000,
  shippingCountries: ["ES"] as const,
  contactEmail: "info@anabelarto.es",
  /** Escalation address used by the shopping assistant for order questions. */
  ordersEmail: "orders@anabelarto.es",
  /** Placeholder stock behaviour: variants with stock === null are considered in stock. */
  treatNullStockAsAvailable: true,
} as const;

export function shippingFor(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= shopConfig.freeShippingThresholdCents ? 0 : shopConfig.shippingCents;
}
