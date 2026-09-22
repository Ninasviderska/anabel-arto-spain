import { shopConfig } from "./shop-config";
import type { Product } from "./catalog.types";

type Meta = Record<string, string>;

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "product" | "article";
  noindex?: boolean;
}): Meta[] {
  const meta: Meta[] = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:url", content: opts.path },
    { property: "og:site_name", content: shopConfig.brandName },
    { property: "og:locale", content: "es_ES" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
  ];
  if (opts.image) {
    meta.push({ property: "og:image", content: opts.image }, { name: "twitter:image", content: opts.image });
  }
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, nofollow" });
  return meta;
}

export function organizationJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shopConfig.brandName,
    url: origin,
    email: shopConfig.contactEmail,
    logo: `${origin}/favicon.ico`,
  };
}

export function breadcrumbJsonLd(origin: string, crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${origin}${c.path}`,
    })),
  };
}

export function productJsonLd(origin: string, product: Product, path: string) {
  const available = product.variants.some((v) => v.is_active && (v.stock === null || v.stock > 0));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.short_description ?? product.description ?? undefined,
    image: product.images.map((i) => `${origin}${i.url}`),
    brand: { "@type": "Brand", name: shopConfig.brandName },
    category: product.category.name,
    color: product.colors.map((c) => c.name).join(", "),
    offers: {
      "@type": "Offer",
      url: `${origin}${path}`,
      priceCurrency: "EUR",
      price: (product.price_cents / 100).toFixed(2),
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "ES" },
        shippingRate: {
          "@type": "MonetaryAmount",
          value: (shopConfig.shippingCents / 100).toFixed(2),
          currency: "EUR",
        },
      },
    },
  };
}

export function jsonLdScript(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}
