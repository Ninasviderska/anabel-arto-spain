import { useMemo } from "react";
import { X } from "lucide-react";
import { fmt, useI18n } from "@/i18n";
import { isVariantAvailable, type Category, type Product } from "@/lib/catalog.types";
import { ProductCard } from "./ProductCard";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { displaySize } from "@/lib/sizes";

export type CatalogFilters = {
  category?: string | undefined;
  color?: string | undefined;
  size?: string | undefined;
};

type Props = {
  lang: string;
  categories: Category[];
  products: Product[];
  filters: CatalogFilters;
  onFiltersChange: (f: CatalogFilters) => void;
  showCategoryFilter?: boolean;
  title?: string;
  description?: string | null;
  seoText?: string | null;
  bannerImage?: string;
  crumbs?: Crumb[];
};

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
    return a.localeCompare(b, "es");
  });
}

export function CatalogView({
  lang,
  categories,
  products,
  filters,
  onFiltersChange,
  showCategoryFilter = false,
  title,
  description,
  seoText,
  bannerImage,
  crumbs,
}: Props) {
  const { d } = useI18n();

  const scoped = useMemo(
    () => (filters.category ? products.filter((p) => p.category.slug === filters.category) : products),
    [products, filters.category],
  );

  const colorOptions = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; hex: string }>();
    for (const p of scoped) for (const c of p.colors) if (!map.has(c.slug)) map.set(c.slug, c);
    return [...map.values()];
  }, [scoped]);

  const sizeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of scoped) for (const v of p.variants) if (isVariantAvailable(v)) set.add(displaySize(v.size, p.category.size_type));
    return sortSizes([...set]);
  }, [scoped]);

  const filtered = useMemo(
    () =>
      scoped.filter((p) => {
        if (filters.color && !p.colors.some((c) => c.slug === filters.color)) return false;
        if (filters.size) {
          const colorIds = filters.color
            ? p.colors.filter((c) => c.slug === filters.color).map((c) => c.id)
            : null;
          const ok = p.variants.some(
            (v) =>
              displaySize(v.size, p.category.size_type) === filters.size &&
              isVariantAvailable(v) &&
              (colorIds === null || colorIds.includes(v.color_id)),
          );
          if (!ok) return false;
        }
        return true;
      }),
    [scoped, filters.color, filters.size],
  );

  const hasFilters = Boolean(filters.color || filters.size || (showCategoryFilter && filters.category));
  const set = (patch: Partial<CatalogFilters>) => onFiltersChange({ ...filters, ...patch });

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-foreground hover:border-primary/60"
    }`;

  const home: Crumb = { name: d.product.breadcrumbHome, path: `/${lang}` };
  const allCrumbs = crumbs ?? [home, { name: d.catalog.title, path: `/${lang}/catalogo` }];

  return (
    <div className="container-shop py-10 md:py-14">
      <Breadcrumbs crumbs={allCrumbs} />
      {bannerImage ? (
        <header className="relative mt-6 overflow-hidden rounded-sm bg-cream-deep">
          <img
            src={bannerImage}
            alt={title ?? ""}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/25 to-transparent" aria-hidden />
          <div className="relative flex min-h-[16rem] max-w-2xl flex-col justify-end p-6 text-background md:min-h-[22rem] md:p-10">
            <h1 className="font-display text-4xl leading-tight md:text-5xl">{title ?? d.catalog.title}</h1>
            {description && <p className="mt-3 text-base text-background/90">{description}</p>}
          </div>
        </header>
      ) : (
        <header className="mt-6 max-w-2xl">
          <h1 className="font-display text-4xl leading-tight md:text-5xl">{title ?? d.catalog.title}</h1>
          {description && <p className="mt-3 text-base text-muted-foreground">{description}</p>}
        </header>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_1fr]">
        <aside aria-label={d.catalog.filters} className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {showCategoryFilter && (
            <fieldset>
              <legend className="eyebrow mb-3">{d.catalog.category}</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={pill(!filters.category)} onClick={() => set({ category: undefined, size: undefined })}>
                  {d.catalog.all}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={pill(filters.category === c.slug)}
                    aria-pressed={filters.category === c.slug}
                    onClick={() => set({ category: c.slug, size: undefined })}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="eyebrow mb-3">{d.catalog.color}</legend>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => {
                const active = filters.color === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={active}
                    title={c.name}
                    onClick={() => set({ color: active ? undefined : c.slug })}
                    className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition-colors ${
                      active ? "border-primary" : "border-border hover:border-primary/60"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full border border-border/70" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-3">{d.catalog.size}</legend>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((s) => {
                const active = filters.size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    className={pill(active)}
                    onClick={() => set({ size: active ? undefined : s })}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {hasFilters && (
            <button
              type="button"
              onClick={() => onFiltersChange(showCategoryFilter ? {} : { category: filters.category })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <X className="size-3.5" /> {d.catalog.clear}
            </button>
          )}
        </aside>

        <section aria-live="polite">
          <p className="mb-6 text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {filtered.length === 1 ? d.catalog.resultsOne : fmt(d.catalog.results, { count: filtered.length })}
          </p>
          {filtered.length === 0 ? (
            <p className="rounded-sm bg-cream-deep p-10 text-center text-sm text-muted-foreground">{d.catalog.empty}</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          )}
          {seoText && (
            <div className="mt-12 max-w-3xl border-t pt-8 text-sm leading-relaxed text-muted-foreground lg:mt-16 lg:pt-10">
              <p>{seoText}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
