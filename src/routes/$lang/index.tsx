import storyAsset from "@/assets/banners/story-la-casa_sujetadores-7017-010.jpg.asset.json";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Gem, Package, RotateCcw, ShieldCheck } from "lucide-react";
import { fmt, getDictionary, useI18n } from "@/i18n";
import { categoriesQuery, homeContentQuery, originQuery, productsQuery } from "@/lib/catalog.queries";
import { CATEGORY_IMAGES } from "@/lib/category-images";
import { alignClass, resolveHome } from "@/lib/home-content";
import { formatPrice } from "@/lib/format";
import { shopConfig } from "@/lib/shop-config";
import { canonical, jsonLdScript, organizationJsonLd, pageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { LinkedText } from "@/components/shop/RichText";

export const Route = createFileRoute("/$lang/")({
  loader: async ({ context }) => {
    const [origin] = await Promise.all([
      context.queryClient.ensureQueryData(originQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(productsQuery({ featured: true })),
      context.queryClient.ensureQueryData(homeContentQuery()),
    ]);
    return { origin };
  },
  head: ({ params, loaderData }) => {
    const d = getDictionary("es");
    const origin = loaderData?.origin ?? shopConfig.siteUrl;
    return {
      meta: pageMeta({
        title: "Anabel Arto España | Comprar Ropa Interior Femenina Online al Mejor Precio",
        description: d.brand.description,
        path: `/${params.lang}`,
        image: "/images/hero/hero-camisones-1600.webp",
      }),
      links: [canonical(`/${params.lang}`)],
      scripts: [jsonLdScript(organizationJsonLd(origin))],
    };
  },
  component: HomePage,
});

const HERO_SRCSET =
  "/images/hero/hero-camisones-640.webp 640w, /images/hero/hero-camisones-1024.webp 1024w, /images/hero/hero-camisones-1600.webp 1600w";

const benefitIcons = [Package, Gem, ShieldCheck, RotateCcw];

function HomePage() {
  const { locale, d } = useI18n();
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: featured } = useSuspenseQuery(productsQuery({ featured: true }));
  const { data: homeRows } = useSuspenseQuery(homeContentQuery());
  const h = resolveHome(homeRows);
  const threshold = formatPrice(shopConfig.freeShippingThresholdCents, locale);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-deep">
        <img
          src="/images/hero/hero-camisones-1024.webp"
          srcSet={HERO_SRCSET}
          sizes="100vw"
          alt="Camisón 8057-6097 de Anabel Arto"
          width={1317}
          height={1920}
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover object-[right_20%] md:object-[80%_20%]"
        />
        <div className="hero-veil absolute inset-0" aria-hidden />
        <div className="container-shop relative flex min-h-[32rem] items-center py-24 md:min-h-[40rem] lg:min-h-[44rem]">
          <div className="max-w-xl animate-fade-up">
            <p className="eyebrow mb-6">{h.text("heroEyebrow")}</p>
            <h1 className={`font-display text-5xl leading-[1.02] text-foreground md:text-7xl ${alignClass(h.align("heroTitle"))}`}>
              {h.text("heroTitle")}
            </h1>
            <p className={`mt-6 max-w-md text-base leading-relaxed text-foreground/75 md:text-lg ${alignClass(h.align("heroText"))}`}>
              {h.text("heroText")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/$lang/catalogo" params={{ lang: locale }} search={{}}>
                  {d.home.heroCta}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/$lang/ropa-interior/$category" params={{ lang: locale, category: "sujetadores" }}>
                  {d.home.heroSecondary}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-shop py-20 md:py-28">
        <SectionHeading eyebrow={d.home.categoriesEyebrow} title={h.text("categoriesTitle")} align={h.align("categoriesTitle") === "center" ? "center" : "left"} titleClassName={alignClass(h.align("categoriesTitle"))} />
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
          {categories.filter((c) => c.parent_id).map((c) => (
            <li key={c.id}>
              <Link
                to="/$lang/ropa-interior/$category"
                params={{ lang: locale, category: c.slug }}
                className="group block"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-sm bg-cream-deep">
                  {(CATEGORY_IMAGES[c.slug]?.url ?? c.image_url) && (
                    <img
                      src={CATEGORY_IMAGES[c.slug]?.url ?? c.image_url ?? ""}
                      alt={c.name}
                      width={1024}
                      height={1280}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 768px) 20vw, 50vw"
                      className={`h-full w-full object-cover transition-transform duration-700 ${CATEGORY_IMAGES[c.slug]?.zoom ? "scale-[1.12] group-hover:scale-[1.17]" : "group-hover:scale-[1.05]"}`}
                      style={{ objectPosition: CATEGORY_IMAGES[c.slug]?.position ?? "center" }}
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
                <p className="mt-1 text-xs text-muted-foreground">{featured.filter((p) => p.category.id === c.id).length || "Ver"} modelos</p>
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
        <div className="grid overflow-hidden rounded-sm bg-primary text-primary-foreground md:grid-cols-[2fr_3fr]">
          <div className="relative h-72 overflow-hidden md:h-full md:min-h-[28rem]">
            <img
              src={storyAsset.url}
              alt="Sujetador 7017-010 de Anabel Arto"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[center_top]"
            />
          </div>
          <div className="flex flex-col justify-center gap-8 px-8 py-14 md:px-14 md:py-20">
          <div>
            <p className="eyebrow mb-4 text-primary-foreground/70">{d.home.storyEyebrow}</p>
            <h2 className={`font-display text-4xl leading-tight md:text-5xl ${alignClass(h.align("storyTitle"))}`}>{h.text("storyTitle")}</h2>
          </div>
          <p className={`text-base leading-relaxed text-primary-foreground/85 md:text-lg ${alignClass(h.align("storyText"))}`}>{h.text("storyText")}</p>
          </div>
        </div>
      </section>

      {/* SEO text */}
      <section className="bg-cream-deep/70 py-16 md:py-20">
        <div className="container-shop px-6">
          <p className="eyebrow mb-8 text-center md:mb-10">{d.home.seoEyebrow}</p>
          <div className="grid gap-6 text-sm leading-relaxed text-muted-foreground md:grid-cols-2 md:gap-12 lg:gap-16 md:text-[0.95rem]">
            {(["seoText1", "seoText2"] as const).map((k) => (
              <p key={k} className={alignClass(h.align(k))}><LinkedText text={h.text(k)} /></p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
