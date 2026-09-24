import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { categoriesQuery, originQuery, productsQuery } from "@/lib/catalog.queries";
import { shopConfig } from "@/lib/shop-config";
import { breadcrumbJsonLd, jsonLdScript, pageMeta } from "@/lib/seo";
import { CatalogView } from "@/components/shop/CatalogView";
import bSuj from "@/assets/banners/categoria-sujetadores_8122-003.jpg.asset.json";
import bBrag from "@/assets/banners/categoria-braguitas_7017-011-022.jpg.asset.json";
import bPic from "@/assets/banners/categoria-picardias_8057-6732.jpg.asset.json";
import bCam from "@/assets/banners/categoria-camisones_8122-6033.jpg.asset.json";
import bBat from "@/assets/banners/categoria-batas_8122-6748.jpg.asset.json";

const BANNERS: Record<string, string> = {
  sujetadores: bSuj.url,
  braguitas: bBrag.url,
  picardias: bPic.url,
  camisones: bCam.url,
  batas: bBat.url,
};

const searchSchema = z.object({ color: z.string().optional(), talla: z.string().optional() });

export const Route = createFileRoute("/$lang/ropa-interior/$category/")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: async ({ context, params }) => {
    const [categories, origin] = await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(originQuery()),
      context.queryClient.ensureQueryData(productsQuery()),
    ]);
    const category = categories.find((c) => c.slug === params.category);
    if (!category) throw notFound();
    return { category, origin };
  },
  head: ({ params, loaderData }) => {
    const d = getDictionary("es");
    if (!loaderData) {
      return { meta: [{ title: d.common.notFoundTitle }, { name: "robots", content: "noindex" }] };
    }
    const { category, origin } = loaderData;
    const path = `/${params.lang}/ropa-interior/${category.slug}`;
    return {
      meta: pageMeta({
        title: category.seo_title ?? `${category.name} — ${d.brand.name}`,
        description: category.seo_description ?? category.description ?? d.catalog.metaDescription,
        path,
        image: category.image_url ? `${origin}${category.image_url}` : undefined,
      }),
      links: [{ rel: "canonical", href: path }],
      scripts: [
        jsonLdScript(
          breadcrumbJsonLd(origin ?? shopConfig.siteUrl, [
            { name: d.product.breadcrumbHome, path: `/${params.lang}` },
            { name: "Ropa interior", path: `/${params.lang}/ropa-interior` },
            { name: category.name, path },
          ]),
        ),
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { lang, category: slug } = Route.useParams();
  const { category } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const d = getDictionary("es");
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: products } = useSuspenseQuery(productsQuery());

  return (
    <CatalogView
      lang={lang}
      categories={categories.filter((c) => c.parent_id)}
      products={products}
      title={category.name}
      description={category.description}
      seoText={category.seo_text}
      bannerImage={BANNERS[slug]}
      crumbs={[
        { name: d.product.breadcrumbHome, path: `/${lang}` },
        { name: "Ropa interior", path: `/${lang}/ropa-interior` },
        { name: category.name, path: `/${lang}/ropa-interior/${slug}` },
      ]}
      filters={{ category: slug, color: search.color, size: search.talla }}
      onFiltersChange={(f) =>
        navigate({ search: { color: f.color, talla: f.size }, replace: true, resetScroll: false })
      }
    />
  );
}
