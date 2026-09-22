import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { discountPercent, formatPrice } from "@/lib/format";
import { primaryImage, type Product } from "@/lib/catalog.types";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { locale, d } = useI18n();
  const image = primaryImage(product);
  const discount = discountPercent(product.price_cents, product.compare_at_price_cents);

  return (
    <article className="group">
      <Link
        to="/$lang/$category/$product"
        params={{ lang: locale, category: product.category.slug, product: product.slug }}
        className="block"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cream-deep">
          {image && (
            <img
              src={image.url}
              alt={image.alt ?? product.name}
              width={image.width ?? 1024}
              height={image.height ?? 1280}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          )}
          {discount && (
            <span className="absolute left-3 top-3 rounded-sm bg-background/90 px-2 py-1 text-[0.62rem] tracking-[0.2em] uppercase text-primary">
              −{discount} %
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <p className="text-[0.62rem] tracking-[0.22em] uppercase text-muted-foreground">{product.category.name}</p>
          <h3 className="font-display text-xl leading-tight text-foreground">{product.name}</h3>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-medium text-foreground">{formatPrice(product.price_cents, locale)}</span>
            {product.compare_at_price_cents && (
              <span className="text-muted-foreground line-through">
                {formatPrice(product.compare_at_price_cents, locale)}
              </span>
            )}
          </div>
          {product.colors.length > 0 && (
            <ul className="mt-1 flex items-center gap-1.5" aria-label={d.product.color}>
              {product.colors.map((c) => (
                <li
                  key={c.id}
                  title={c.name}
                  className="h-3.5 w-3.5 rounded-full border border-border/80"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </ul>
          )}
        </div>
      </Link>
    </article>
  );
}
