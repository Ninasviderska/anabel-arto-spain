import { fmt, useI18n, type LegalSlug } from "@/i18n";
import { getDictionary } from "@/i18n";
import { pageMeta } from "@/lib/seo";

export function legalHead(slug: LegalSlug, lang: string) {
  const d = getDictionary("es");
  const page = d.legal.pages[slug];
  return {
    meta: pageMeta({
      title: `${page.title} — ${d.brand.name}`,
      description: page.description,
      path: `/${lang}/${slug}`,
    }),
    links: [{ rel: "canonical", href: `/${lang}/${slug}` }],
  };
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const { d } = useI18n();
  const page = d.legal.pages[slug];

  return (
    <article className="container-shop max-w-3xl py-14 md:py-20">
      <p className="eyebrow">{d.footer.legal}</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{page.title}</h1>
      <p className="mt-3 text-xs text-muted-foreground">{fmt(d.legal.updated, { date: "2026" })}</p>
      <p className="mt-8 rounded-sm border border-gold/40 bg-cream-deep p-4 text-sm text-muted-foreground">
        {d.legal.placeholderNotice}
      </p>
      <div className="mt-10 space-y-8">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-2xl">{s.heading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80 md:text-base">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
