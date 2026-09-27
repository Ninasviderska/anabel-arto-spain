import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Clock, Minus, Plus, Trash2 } from "lucide-react";
import { fmt, getDictionary, useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { checkCartAvailability } from "@/lib/catalog.functions";
import { formatPrice } from "@/lib/format";
import { shopConfig } from "@/lib/shop-config";
import { pageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$lang/carrito")({
  head: ({ params }) => {
    const d = getDictionary("es");
    return {
      meta: pageMeta({
        title: `${d.cart.title} — ${d.brand.name}`,
        description: d.brand.description,
        path: `/${params.lang}/carrito`,
        noindex: true,
      }),
    };
  },
  component: CartPage,
});

function CartPage() {
  const { locale, d } = useI18n();
  const cart = useCart();
  const check = useServerFn(checkCartAvailability);
  const variantIds = cart.items.map((i) => i.variantId).sort();
  const availability = useQuery({
    queryKey: ["cart-availability", variantIds],
    queryFn: () => check({ data: { variantIds } }),
    enabled: cart.hydrated && variantIds.length > 0,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const unavailable = (variantId: string, qty: number) =>
    availability.data ? (availability.data[variantId] ?? 0) < qty : false;
  const blocked =
    !availability.data || cart.items.some((i) => unavailable(i.variantId, i.quantity));

  return (
    <div className="container-shop py-10 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl">{d.cart.title}</h1>
      {cart.items.length > 0 && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-xs text-accent-foreground">
          <Clock className="size-3.5" /> {d.cart.expiryNotice}
        </p>
      )}

      {cart.hydrated && cart.items.length === 0 ? (
        <div className="mt-12 rounded-sm bg-cream-deep px-6 py-20 text-center">
          <p className="text-muted-foreground">{d.cart.empty}</p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/$lang/catalogo" params={{ lang: locale }} search={{}}>
              {d.cart.emptyCta}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <ul className="divide-y">
            {cart.items.map((item) => (
              <li key={item.variantId} className="flex gap-5 py-6">
                <Link
                  to="/$lang/ropa-interior/$category/$product"
                  params={{ lang: locale, category: item.categorySlug, product: item.productSlug }}
                  className="block w-24 shrink-0 overflow-hidden rounded-sm bg-cream-deep sm:w-28"
                >
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} width={224} height={280} loading="lazy" className="aspect-[4/5] h-auto w-full object-cover" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl leading-tight">{item.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.colorName} · {item.size} · {item.sku}
                      </p>
                    </div>
                    <p className="text-sm">{formatPrice(item.unitPriceCents * item.quantity, locale)}</p>
                  </div>
                  {unavailable(item.variantId, item.quantity) && (
                    <div className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                      <p>
                        {(availability.data?.[item.variantId] ?? 0) > 0
                          ? fmt(d.cart.onlyLeft, { count: availability.data?.[item.variantId] ?? 0 })
                          : d.cart.unavailable}{" "}
                        <Link
                          to="/$lang/ropa-interior/$category"
                          params={{ lang: locale, category: item.categorySlug }}
                          className="underline underline-offset-4"
                        >
                          {d.cart.seeSimilar}
                        </Link>
                      </p>
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center rounded-sm border" aria-label={d.cart.quantity}>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center hover:bg-accent"
                        onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)}
                        aria-label="−1"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center hover:bg-accent"
                        onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)}
                        aria-label="+1"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(item.variantId)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> {d.cart.remove}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-sm bg-cream-deep p-6 lg:sticky lg:top-28">
            <h2 className="eyebrow mb-5">{d.checkout.summary}</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{d.cart.subtotal}</dt>
                <dd>{formatPrice(cart.subtotalCents, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{d.cart.shipping}</dt>
                <dd>{cart.shippingCents === 0 ? d.cart.shippingFree : formatPrice(cart.shippingCents, locale)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3 text-base">
                <dt>{d.cart.total}</dt>
                <dd className="font-medium">{formatPrice(cart.totalCents, locale)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              {cart.shippingCents === 0
                ? d.cart.freeShippingReached
                : fmt(d.cart.freeShippingHint, {
                    amount: formatPrice(shopConfig.freeShippingThresholdCents - cart.subtotalCents, locale),
                  })}
            </p>
            {blocked ? (
              <>
                <Button variant="hero" size="lg" className="mt-6 w-full" disabled>
                  {availability.isFetching || !availability.data ? d.cart.checking : d.cart.checkout}
                </Button>
                {availability.data && <p className="mt-3 text-xs text-destructive">{d.cart.fixUnavailable}</p>}
                {availability.isError && <p className="mt-3 text-xs text-destructive">{d.cart.checkError}</p>}
              </>
            ) : (
              <Button asChild variant="hero" size="lg" className="mt-6 w-full">
                <Link to="/$lang/pedido" params={{ lang: locale }}>
                  {d.cart.checkout}
                </Link>
              </Button>
            )}
            <Link
              to="/$lang/catalogo"
              params={{ lang: locale }}
              search={{}}
              className="link-underline mt-5 inline-block text-xs tracking-[0.18em] uppercase"
            >
              {d.cart.continue}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
