import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { fmt, getDictionary, useI18n } from "@/i18n";
import { originQuery, productQuery, productsQuery } from "@/lib/catalog.queries";
import { isVariantAvailable, primaryImage } from "@/lib/catalog.types";
import { useCart } from "@/lib/cart";
import { discountPercent, formatPrice } from "@/lib/format";
import { shopConfig } from "@/lib/shop-config";
import { breadcrumbJsonLd, jsonLdScript, pageMeta, productJsonLd } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { ProductCard } from "@/components/shop/ProductCard";
import { SizeGuide } from "@/components/shop/SizeGuide";
import { displaySize, manufacturerSizeLabel, parseBraSize } from "@/lib/sizes";

export const Route = createFileRoute("/$lang/ropa-interior/$category/$product")({
  loader: async ({ context, params }) => {
    const [product, origin] = await Promise.all([
      context.queryClient.ensureQueryData(productQuery(params.product)),
      context.queryClient.ensureQueryData(originQuery()),
      context.queryClient.ensureQueryData(productsQuery()),
    ]);
    if (!product || product.category.slug !== params.category) throw notFound();
    return { product, origin };
  },
  head: ({ params, loaderData }) => {
    const d = getDictionary("es");
    if (!loaderData) {
      return { meta: [{ title: d.common.notFoundTitle }, { name: "robots", content: "noindex" }] };
    }
    const { product, origin } = loaderData;
    const base = origin ?? shopConfig.siteUrl;
    const path = `/${params.lang}/ropa-interior/${product.category.slug}/${product.slug}`;
    const image = primaryImage(product);
    return {
      meta: [
        ...pageMeta({
          title: product.seo_title ?? `${product.name} — ${product.category.name} | ${d.brand.name}`,
          description:
            product.seo_description ??
            product.short_description ??
            `${product.name}. ${d.brand.tagline}. ${formatPrice(product.price_cents)} IVA incluido.`,
          path,
          type: "product",
          image: image ? (image.url.startsWith("https://") ? image.url : `${base}${image.url}`) : undefined,
        }),
        { property: "product:price:amount", content: (product.price_cents / 100).toFixed(2) },
        { property: "product:price:currency", content: "EUR" },
      ],
      links: [{ rel: "canonical", href: path }],
      scripts: [
        jsonLdScript(productJsonLd(base, product, path)),
        jsonLdScript(
          breadcrumbJsonLd(base, [
            { name: d.product.breadcrumbHome, path: `/${params.lang}` },
            { name: "Ropa interior", path: `/${params.lang}/ropa-interior` },
            { name: product.category.name, path: `/${params.lang}/ropa-interior/${product.category.slug}` },
            { name: product.name, path },
          ]),
        ),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { lang, product: slug } = Route.useParams();
  const { locale, d } = useI18n();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useSuspenseQuery(productsQuery());
  const cart = useCart();

  if (!product) throw notFound();

  const [colorId, setColorId] = useState(product.colors[0]?.id ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [cup, setCup] = useState<string | null>(null);
  const [band, setBand] = useState<string | null>(null);

  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.color_id === colorId);
    return forColor.length ? forColor : product.images;
  }, [product.images, colorId]);
  const [activeImage, setActiveImage] = useState(0);

  const sizes = product.variants.filter((v) => v.color_id === colorId);
  const isOneSize = product.category.size_type === "one_size";
  const isBra = product.category.size_type === "bra";
  const selectedVariant = isOneSize
    ? sizes[0]
    : isBra
      ? sizes.find((v) => { const parsed = parseBraSize(v.size); return parsed?.cup === cup && displaySize(v.size, "bra").endsWith(` ${band}`); })
      : sizes.find((v) => v.size === size);
  const canAdd = Boolean(selectedVariant && isVariantAvailable(selectedVariant));
  const discount = discountPercent(product.price_cents, product.compare_at_price_cents);
  const related = all.filter((p) => p.id !== product.id && p.category.id !== product.category.id).slice(0, 4);

  const onAdd = () => {
    if (!selectedVariant || !color) return;
    cart.add({
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      categorySlug: product.category.slug,
      name: product.name,
      colorName: color.name,
      size: displaySize(selectedVariant.size, product.category.size_type),
      sku: selectedVariant.variant_sku,
      unitPriceCents: selectedVariant.price_override_cents ?? product.price_cents,
      imageUrl: primaryImage(product, color.id)?.url ?? null,
    });
    toast.success(d.product.added, { description: `${product.name} · ${color.name} · ${displaySize(selectedVariant.size, product.category.size_type)}` });
  };

  const crumbs = [
    { name: d.product.breadcrumbHome, path: `/${lang}` },
    { name: "Ropa interior", path: `/${lang}/ropa-interior` },
    { name: product.category.name, path: `/${lang}/ropa-interior/${product.category.slug}` },
    { name: product.name, path: `/${lang}/ropa-interior/${product.category.slug}/${product.slug}` },
  ];

  return (
    <div className="container-shop py-8 md:py-12">
      <Breadcrumbs crumbs={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        {/* Gallery */}
        <div className={`grid gap-3 ${images.length > 1 ? "md:grid-cols-[4.5rem_1fr]" : ""}`}>
          {images.length > 1 && (
            <ul className="order-2 flex gap-2 md:order-1 md:flex-col">
              {images.map((img, i) => (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`block aspect-[4/5] w-16 overflow-hidden rounded-sm border md:w-full ${
                      i === activeImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img.url} alt="" width={128} height={160} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="order-1 aspect-[4/5] overflow-hidden rounded-sm bg-cream-deep md:order-2">
            {images[activeImage] && (
              <img
                key={images[activeImage].id}
                src={images[activeImage].url}
                alt={images[activeImage].alt ?? `${product.name} — ${color?.name ?? ""}`}
                width={images[activeImage].width ?? 1024}
                height={images[activeImage].height ?? 1280}
                fetchPriority="high"
                decoding="async"
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="h-full w-full object-cover animate-in fade-in duration-500"
              />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
          {product.short_description && (
            <p className="mt-3 text-base text-muted-foreground">{product.short_description}</p>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-normal">{formatPrice(product.price_cents, locale)}</span>
            {product.compare_at_price_cents && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(product.compare_at_price_cents, locale)}
              </span>
            )}
            {discount && (
              <span className="rounded-sm bg-accent px-2 py-0.5 text-[0.65rem] tracking-[0.18em] uppercase text-accent-foreground">
                {fmt(d.product.save, { percent: discount })}
              </span>
            )}
            <span className="w-full text-xs text-muted-foreground">{d.product.ivaIncluded}</span>
          </div>

          {/* Colour */}
          <fieldset className="mt-8">
            <legend className="mb-3 text-xs tracking-[0.18em] uppercase">
              {d.product.color}: <span className="normal-case tracking-normal text-muted-foreground">{color?.name}</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => {
                const active = c.id === colorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={active}
                    onClick={() => {
                      setColorId(c.id);
                      setActiveImage(0);
                      setSize(null);
                      setCup(null);
                      setBand(null);
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                      active ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                  >
                    <span className="h-6 w-6 rounded-full border border-border/70" style={{ backgroundColor: c.hex }} />
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Size */}
          <fieldset className="mt-7">
            <legend className="mb-3 flex w-full items-center justify-between text-xs tracking-[0.18em] uppercase">
              <span>
                {d.product.size}
                {isOneSize && <span className="normal-case tracking-normal text-muted-foreground">: {d.product.oneSize}</span>}
              </span>
              {!isOneSize && <SizeGuide bra={isBra} />}
            </legend>
            {!isOneSize && (
              <p className="-mt-1 mb-3 text-xs text-muted-foreground">
                ¿No sabes tu talla?{" "}
                <Link to="/$lang/guia-de-tallas" params={{ lang: locale }} className="link-underline text-primary">
                  Consulta la guía de tallas →
                </Link>
              </p>
            )}
            {isBra && (
              <div className="space-y-4">
                <div><p className="mb-2 text-xs text-muted-foreground">{d.product.cup}</p><div className="flex gap-2">{[...new Set(sizes.map((v)=>parseBraSize(v.size)?.cup).filter(Boolean))].map((value)=><Button key={value} type="button" variant={cup===value?"default":"outline"} size="sm" onClick={()=>{setCup(value ?? null);setBand(null)}}>{value}</Button>)}</div></div>
                <div><p className="mb-2 text-xs text-muted-foreground">{d.product.band}</p><div className="flex flex-wrap gap-2">{[...new Set(sizes.filter((v)=>parseBraSize(v.size)?.cup===cup).map((v)=>displaySize(v.size,"bra").split(" ")[1]).filter(Boolean))].map((value)=>{const variant=sizes.find((v)=>parseBraSize(v.size)?.cup===cup&&displaySize(v.size,"bra").endsWith(` ${value}`));const available=variant?isVariantAvailable(variant):false;return <Button key={value} type="button" variant={band===value?"default":"outline"} size="sm" disabled={!available} onClick={()=>setBand(value ?? null)}>{value}</Button>})}</div></div>
              </div>
            )}
            {!isOneSize && !isBra && (
              <div className="flex flex-wrap gap-2">
                {sizes.map((v) => {
                  const available = isVariantAvailable(v);
                  const active = size === v.size;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!available}
                      aria-pressed={active}
                      onClick={() => setSize(v.size)}
                      className={`min-w-12 rounded-sm border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
                      }`}
                    >
                      {displaySize(v.size, product.category.size_type)}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" variant="hero" disabled={!canAdd} onClick={onAdd} className="w-full">
              {!isOneSize && !(isBra ? cup && band : size) ? d.product.selectSize : d.product.addToCart}
            </Button>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="size-3.5 text-primary" />
              {canAdd || (!size && !isOneSize) ? d.product.inStock : d.product.outOfStock} · {d.product.sku}:{" "}
              {selectedVariant?.variant_sku ?? product.sku}
            </p>
            {selectedVariant && <p className="text-xs text-muted-foreground">{d.product.manufacturerSize}: {manufacturerSizeLabel(selectedVariant.size).replace("Fabricante: ", "")}</p>}
          </div>

          <Accordion type="single" collapsible className="mt-10 border-t">
            <AccordionItem value="desc">
              <AccordionTrigger className="text-xs tracking-[0.18em] uppercase">{d.product.description}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-xs tracking-[0.18em] uppercase">{d.product.details}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {d.product.detailsText}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ship">
              <AccordionTrigger className="text-xs tracking-[0.18em] uppercase">{d.product.shipping}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {fmt(d.product.shippingText, {
                  shipping: formatPrice(shopConfig.shippingCents, locale),
                  threshold: formatPrice(shopConfig.freeShippingThresholdCents, locale),
                })}{" "}
                <span className="mt-2 block">{d.product.hygiene}</span>{" "}
                <Link to={`/$lang/politica-de-devoluciones`} params={{ lang: locale }} className="underline underline-offset-4">
                  {d.legal.pages["politica-de-devoluciones"].title}
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-3xl">{d.product.related}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      {product.seo_text && <section className="mt-16 max-w-3xl border-t pt-10 text-sm leading-relaxed text-muted-foreground"><p>{product.seo_text}</p></section>}
    </div>
  );
}
