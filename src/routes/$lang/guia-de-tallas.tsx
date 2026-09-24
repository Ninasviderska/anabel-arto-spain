import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { braBandRows, numericSizeRows } from "@/lib/sizes";

export const Route = createFileRoute("/$lang/guia-de-tallas")({
  head: ({ params }) => ({
    meta: pageMeta({
      title: "Guía de tallas de lencería femenina — Anabel Arto España",
      description:
        "Convierte tu talla de ropa interior y sujetador del sistema ucraniano (RU/UA) a la talla española FR/ES, IT, UK, US y EU. Encuentra tu talla ideal en Anabel Arto.",
      path: `/${params.lang}/guia-de-tallas`,
    }),
    links: [{ rel: "canonical", href: `/${params.lang}/guia-de-tallas` }],
  }),
  component: SizeGuidePage,
});

function Table({ headers, rows, highlight }: { headers: string[]; rows: string[][]; highlight: number }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-border bg-background">
      <table className="w-full min-w-[34rem] border-collapse text-center text-sm">
        <thead className="bg-cream-deep">
          <tr>
            {headers.map((h, i) => (
              <th key={h} className={`px-3 py-3 text-xs font-medium tracking-[0.14em] uppercase ${i === highlight ? "text-primary" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-border">
              {row.map((v, i) => (
                <td key={i} className={`px-3 py-3 ${i === highlight ? "font-medium text-primary" : ""}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SizeGuidePage() {
  return (
    <article className="container-shop max-w-4xl py-14 md:py-20">
      <p className="eyebrow">Ayuda</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Guía de tallas</h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
        Nuestras prendas llevan la etiqueta con la talla del fabricante (sistema ucraniano, RU/UA). Esta guía te ayuda a
        encontrar la equivalencia con la talla española y europea que ya conoces. En la tienda mostramos siempre la talla
        FR/ES como referencia principal. Si aún tienes dudas, pregunta a nuestra asistente en el chat: estará encantada de ayudarte.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl md:text-3xl">Ropa interior</h2>
        <p className="mt-2 text-sm text-muted-foreground">Braguitas, picardías, camisones y batas.</p>
        <div className="mt-5">
          <Table
            headers={["RU/UA", "FR/ES", "IT", "UK", "US", "INT", "DE/EU"]}
            rows={numericSizeRows.map((r) => [r.maker, r.es, r.it, r.uk, r.us, r.intl, r.de])}
            highlight={1}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl md:text-3xl">Sujetadores</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Contorno de pecho. La letra de la copa (B, C, D…) es la misma en todos los sistemas.
        </p>
        <div className="mt-5">
          <Table
            headers={["RU/UA = DE/EU", "FR/ES", "IT (código)", "UK/US"]}
            rows={braBandRows.map((r) => [r.maker, r.es, r.it, r.ukUs])}
            highlight={1}
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Ejemplo: una etiqueta «C 75» corresponde a la talla española C 90.</p>
      </section>
    </article>
  );
}
