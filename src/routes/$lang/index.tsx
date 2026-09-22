import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Gem, Package, RotateCcw, ShieldCheck } from "lucide-react";
import { fmt, getDictionary, useI18n } from "@/i18n";
import { categoriesQuery, originQuery, productsQuery } from "@/lib/catalog.queries";
import { formatPrice } from "@/lib/format";
import { shopConfig } from "@/lib/shop-config";
import { jsonLdScript, organizationJsonLd, pageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/shop/SectionHeading";

export const Route = createFileRoute("/$lang/")({
  loader: async ({ context }) => {
    const [origin] = await Promise.all([
      context.queryClient.ensureQueryData(originQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(productsQuery({ featured: true })),
    ]);
    return { origin };
  },
  head: ({ params, loaderData }) => {
    const d = getDictionary("es");
    const origin = loaderData?.origin ?? shopConfig.siteUrl;
    return {
      meta: pageMeta({
        title: `${d.brand.name} — ${d.brand.tagline} | Liquidación en España`,
        description: d.brand.description,
        path: `/${params.lang}`,
        image: `${origin}/images/hero.jpg`,
      }),
      links: [{ rel: "canonical", href: `/${params.lang}` }],
      scripts: [jsonLdScript(organizationJsonLd(origin))],
    };
  },
  component: HomePage,
});

const benefitIcons = [Package, Gem, ShieldCheck, RotateCcw];

function HomePage() {
  const { locale, d } = useI18n();
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: featured } = useSuspenseQuery(productsQuery({ featured: true }));
  const threshold = formatPrice(shopConfig.freeShippingThresholdCents, locale);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-deep">
        <img
          src="/images/hero.jpg"
          alt=""
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="hero-veil absolute inset-0" aria-hidden />
        <div className="container-shop relative flex min-h-[32rem] items-center py-24 md:min-h-[40rem] lg:min-h-[44rem]">
          <div className="max-w-xl animate-fade-up">
            <p className="eyebrow mb-6">{d.home.heroEyebrow}</p>
            <h1 className="font-display text-5xl leading-[1.02] text-foreground md:text-7xl">
              {d.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/75 md:text-lg">
              {d.home.heroText}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/$lang/catalogo" params={{ lang: locale }} search={{}}>
                  {d.home.heroCta}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/$lang/$category" params={{ lang: locale, category: "sujetadores" }}>
                  {d.home.heroSecondary}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-shop py-20 md:py-28">
        <SectionHeading eyebrow={d.home.categoriesEyebrow} title={d.home.categoriesTitle} />
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                to="/$lang/$category"
                params={{ lang: locale, category: c.slug }}
                className="group block"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-sm bg-cream-deep">
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      width={1024}
                      height={1280}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 768px) 20vw, 50vw"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <h3 className="font-display text-xl">{c.name}</h3>
                  <ArrowRight
                    className="size-4 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    strokeWidth={1.5}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      <section className="bg-cream-deep/60 py-20 md:py-28">
        <div className="container-shop">
          <SectionHeading
            eyebrow={d.home.featuredEyebrow}
            title={d.home.featuredTitle}
            action={
              <Link
                to="/$lang/catalogo"
                params={{ lang: locale }}
                search={{}}
                className="link-underline text-[0.72rem] tracking-[0.22em] uppercase"
              >
                {d.home.viewAll}
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-shop py-20 md:py-28">
        <SectionHeading eyebrow={d.home.benefitsEyebrow} title={d.brand.tagline} align="center" />
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {d.home.benefits.map((b, i) => {
            const Icon = benefitIcons[i] ?? Gem;
            return (
              <li key={b.title} className="flex flex-col items-center text-center">
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                  <Icon className="size-5" strokeWidth={1.3} />
                </span>
                <h3 className="font-display text-xl">{b.title}</h3>
                <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                  {fmt(b.text, { threshold })}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Story */}
      <section className="container-shop pb-8">
        <div className="grid items-center gap-10 rounded-sm bg-primary px-8 py-16 text-primary-foreground md:grid-cols-2 md:px-16 md:py-24">
          <div>
            <p className="eyebrow mb-4 text-primary-foreground/70">{d.home.storyEyebrow}</p>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">{d.home.storyTitle}</h2>
          </div>
          <p className="text-base leading-relaxed text-primary-foreground/85 md:text-lg">{d.home.storyText}</p>
        </div>
      </section>
    </>
  );
}
