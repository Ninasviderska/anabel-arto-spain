import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { pageMeta, canonical } from "@/lib/seo";
import { homeContentQuery } from "@/lib/catalog.queries";
import { alignClass, resolveHome } from "@/lib/home-content";

export const Route = createFileRoute("/$lang/sobre-nosotros")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeContentQuery()),
  head: ({ params }) => ({
    meta: pageMeta({
      title: "Sobre nosotros — Anabel Arto",
      description:
        "La historia de Anabel Arto: lencería femenina de diseño europeo confeccionada en Ucrania desde 1998, disponible online en España.",
      path: `/${params.lang}/sobre-nosotros`,
    }),
    links: [{ rel: "canonical", href: `/${params.lang}/sobre-nosotros` }],
  }),
  component: SobreNosotrosPage,
});

function SobreNosotrosPage() {
  const { data: rows } = useSuspenseQuery(homeContentQuery());
  const h = resolveHome(rows);
  return (
    <article className="container-shop max-w-3xl py-14 md:py-20">
      <p className="eyebrow">Empresa</p>
      <h1 className={`mt-3 font-display text-4xl md:text-5xl ${alignClass(h.align("aboutTitle"))}`}>{h.text("aboutTitle")}</h1>
      <div className="mt-10 space-y-8">
        {(["aboutText1", "aboutText2"] as const).map((k) => (
          <p key={k} className={`whitespace-pre-line text-sm leading-relaxed text-foreground/80 md:text-base ${alignClass(h.align(k))}`}>
            {h.text(k)}
          </p>
        ))}
      </div>
    </article>
  );
}
