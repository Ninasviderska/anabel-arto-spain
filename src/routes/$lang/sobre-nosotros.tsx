import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/$lang/sobre-nosotros")({
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
  return (
    <article className="container-shop max-w-3xl py-14 md:py-20">
      <p className="eyebrow">Empresa</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Sobre nosotros</h1>
      <div className="mt-10 space-y-8">
        <p className="text-sm leading-relaxed text-foreground/80 md:text-base">Contenido en preparación.</p>
      </div>
    </article>
  );
}
