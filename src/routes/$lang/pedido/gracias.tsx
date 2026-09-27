import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Heart, AlertCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { getDictionary, useI18n } from "@/i18n";
import { pageMeta } from "@/lib/seo";
import { verifyCheckoutSession } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$lang/pedido/gracias")({
  validateSearch: (s) => z.object({ n: z.string().optional(), session_id: z.string().optional() }).parse(s),
  head: ({ params }) => {
    const d = getDictionary("es");
    return {
      meta: pageMeta({
        title: `${d.thanks.title} — ${d.brand.name}`,
        description: d.thanks.text,
        path: `/${params.lang}/pedido/gracias`,
        noindex: true,
      }),
    };
  },
  component: ThanksPage,
});

function ThanksPage() {
  const { locale, d } = useI18n();
  const { n, session_id } = Route.useSearch();
  const cart = useCart();
  const verify = useServerFn(verifyCheckoutSession);
  const { data: result, isLoading } = useQuery({
    queryKey: ["checkout-session", session_id],
    queryFn: () => verify({ data: { sessionId: session_id! } }),
    enabled: Boolean(session_id),
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 3000 : false),
  });
  const paid = result?.status === "paid";

  useEffect(() => {
    if (paid && cart.hydrated) cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid, cart.hydrated]);

  const back = (
    <Button asChild variant="outline" className="mt-8">
      <Link to="/$lang" params={{ lang: locale }}>
        {d.thanks.backHome}
      </Link>
    </Button>
  );

  if (session_id && (isLoading || result?.status === "pending")) {
    return (
      <div className="container-shop flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Estamos confirmando tu pago…</p>
      </div>
    );
  }

  if (session_id && !paid) {
    return (
      <div className="container-shop flex min-h-[60vh] items-center justify-center py-20">
        <div className="max-w-lg text-center">
          <AlertCircle className="mx-auto mb-6 size-8 text-destructive" strokeWidth={1.4} />
          <h1 className="font-display text-4xl">No hemos podido confirmar el pago</h1>
          <p className="mt-5 text-muted-foreground">
            Tu pedido no se ha completado. Puedes volver a intentarlo o escribirnos a orders@anabelarto.es.
          </p>
          <Button asChild variant="hero" className="mt-8">
            <Link to="/$lang/pedido" params={{ lang: locale }}>
              Volver al pedido
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const orderNumber = paid ? result.orderNumber : n;
  return (
    <div className="container-shop flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-lg text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <Heart className="size-5" strokeWidth={1.4} />
        </span>
        <h1 className="font-display text-4xl md:text-5xl">{d.thanks.title}</h1>
        {orderNumber && (
          <p className="mt-5 text-xs tracking-[0.2em] uppercase text-muted-foreground">
            {d.thanks.orderNumber}: <span className="text-foreground">{orderNumber}</span>
          </p>
        )}
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{d.thanks.text}</p>
        {!paid && <p className="mt-3 rounded-sm bg-cream-deep p-4 text-sm text-muted-foreground">{d.thanks.paymentPending}</p>}
        {back}
      </div>
    </div>
  );
}
