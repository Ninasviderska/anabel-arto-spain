import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { categoriesQuery, originQuery, productsQuery } from "@/lib/catalog.queries";
import { shopConfig } from "@/lib/shop-config";
import { breadcrumbJsonLd, jsonLdScript, pageMeta, canonical } from "@/lib/seo";
import { CatalogView } from "@/components/shop/CatalogView";
import { CATEGORY_IMAGES } from "@/lib/category-images";

const BANNERS = CATEGORY_IMAGES;

const searchSchema = z.object({ color: z.string().optional(), talla: z.string().optional(),
  page: z.coerce.number().int().min(2).optional().catch(undefined),
});

export const Route = createFileRoute("/$lang/ropa-interior/$category/")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, params, deps }) => {
    const [categories, origin] = await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(originQuery()),
      context.queryClient.ensureQueryData(productsQuery()),
    ]);
    const category = categories.find((c) => c.slug === params.category);
    if (!category) throw notFound();
    return { category, origin, page: deps.page };
  },
  head: ({ params, loaderData }) => {
    const d = getDictionary("es");
    if (!loaderData) {
      return { meta: [{ title: d.common.notFoundTitle }, { name: "robots", content: "noindex" }] };
    }
    const { category, origin, page } = loaderData;
    const path = `/${params.lang}/ropa-interior/${category.slug}`;
    const selfPath = page ? `${path}?page=${page}` : path;
    const baseTitle = category.seo_title ?? `${category.name} — ${d.brand.name}`;
    return {
      meta: pageMeta({
        title: page ? `${baseTitle} — Página ${page}` : baseTitle,
        description: category.seo_description ?? category.description ?? d.catalog.metaDescription,
        path: selfPath,
        image: category.image_url ? `${origin}${category.image_url}` : undefined,
      }),
      links: [canonical(selfPath)],
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
      bannerImage={BANNERS[slug]?.url ?? ""}
      bannerPosition={BANNERS[slug]?.position ?? "center 30%"}
      bannerZoom={BANNERS[slug]?.zoom ?? false}
      crumbs={[
        { name: d.product.breadcrumbHome, path: `/${lang}` },
        { name: "Ropa interior", path: `/${lang}/ropa-interior` },
        { name: category.name, path: `/${lang}/ropa-interior/${slug}` },
      ]}
      filters={{ category: slug, color: search.color, size: search.talla }}
      onFiltersChange={(f) =>
        navigate({ search: { color: f.color, talla: f.size, page: undefined }, replace: true, resetScroll: false })
      }
      page={search.page ?? 1}
      onPageChange={(n) => navigate({ search: (s) => ({ ...s, page: n > 1 ? n : undefined }) })}
    />
  );
}
