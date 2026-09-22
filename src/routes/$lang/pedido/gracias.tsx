import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Heart } from "lucide-react";
import { getDictionary, useI18n } from "@/i18n";
import { pageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$lang/pedido/gracias")({
  validateSearch: (s) => z.object({ n: z.string().optional() }).parse(s),
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
  const { n } = Route.useSearch();

  return (
    <div className="container-shop flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-lg text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <Heart className="size-5" strokeWidth={1.4} />
        </span>
        <h1 className="font-display text-4xl md:text-5xl">{d.thanks.title}</h1>
        {n && (
          <p className="mt-5 text-xs tracking-[0.2em] uppercase text-muted-foreground">
            {d.thanks.orderNumber}: <span className="text-foreground">{n}</span>
          </p>
        )}
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{d.thanks.text}</p>
        <p className="mt-3 rounded-sm bg-cream-deep p-4 text-sm text-muted-foreground">{d.thanks.paymentPending}</p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/$lang" params={{ lang: locale }}>
            {d.thanks.backHome}
          </Link>
        </Button>
      </div>
    </div>
  );
}
