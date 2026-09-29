import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { pageMeta } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { formatSizeEs } from "@/lib/sizes";
import { checkOrderStatus, type OrderStatusResult } from "@/lib/storefront.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/$lang/estado-pedido")({
  head: ({ params }) => ({
    meta: [
      ...pageMeta({
        title: "Estado de tu pedido — Anabel Arto",
        description: "Consulta el estado de tu pedido de Anabel Arto con tu email y el número de pedido, sin necesidad de registrarte.",
        path: `/${params.lang}/estado-pedido`,
        noindex: true,
      }),
    ],
    links: [{ rel: "canonical", href: `/${params.lang}/estado-pedido` }],
  }),
  component: EstadoPedidoPage,
});

const STATUS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado — en preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

function EstadoPedidoPage() {
  const check = useServerFn(checkOrderStatus);
  const [email, setEmail] = useState("");
  const [num, setNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderStatusResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      const r = await check({ data: { email, orderNumber: num } });
      if (r) setOrder(r);
      else setError("No hemos encontrado ese pedido. Revisa el email y el número de pedido.");
    } catch {
      setError("No hemos encontrado ese pedido. Revisa el email y el número de pedido.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="container-shop max-w-3xl py-14 md:py-20">
      <p className="eyebrow">Atención al cliente</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Estado de tu pedido</h1>
      <p className="mt-4 text-sm text-foreground/80 md:text-base">
        Introduce el email con el que hiciste la compra y el número de pedido (por ejemplo, AA-1001). Lo encontrarás en el email de confirmación.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="num">Número de pedido</Label>
          <Input id="num" required value={num} onChange={(e) => setNum(e.target.value)} placeholder="AA-1001" />
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Buscando…" : "Consultar"}</Button>
      </form>

      {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}

      {order && (
        <section className="mt-10 space-y-6 border-t border-border pt-8" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">Pedido {order.order_number}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <p><span className="eyebrow mr-3">Estado</span>{STATUS[order.status] ?? order.status}</p>
          {order.tracking_number && (
            <p>
              <span className="eyebrow mr-3">Seguimiento</span>
              {order.tracking_url ? (
                <a href={order.tracking_url} target="_blank" rel="nofollow noreferrer" className="link-underline">{order.tracking_number}</a>
              ) : order.tracking_number}
            </p>
          )}
          <ul className="divide-y divide-border">
            {order.items.map((i, k) => (
              <li key={k} className="flex items-center gap-4 py-3 text-sm">
                <div className="h-16 w-12 shrink-0 overflow-hidden bg-muted">
                  {i.image_url && <img src={i.image_url} alt={i.product_name} loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p>{i.product_name}</p>
                  <p className="text-muted-foreground">{i.color_name} · Talla {formatSizeEs(i.size)} · × {i.quantity}</p>
                </div>
                <span>{formatPrice(i.unit_price_cents * i.quantity, "es")}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal_cents, "es")}</dd></div>
            <div className="flex justify-between"><dt>Envío</dt><dd>{order.shipping_cents ? formatPrice(order.shipping_cents, "es") : "Gratis"}</dd></div>
            <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatPrice(order.total_cents, "es")}</dd></div>
          </dl>
        </section>
      )}
    </article>
  );
}
