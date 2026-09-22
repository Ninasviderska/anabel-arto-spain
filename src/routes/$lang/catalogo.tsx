import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { categoriesQuery, productsQuery } from "@/lib/catalog.queries";
import { pageMeta } from "@/lib/seo";
import { CatalogView } from "@/components/shop/CatalogView";

const searchSchema = z.object({
  categoria: z.string().optional(),
  color: z.string().optional(),
  talla: z.string().optional(),
});

export const Route = createFileRoute("/$lang/catalogo")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(productsQuery()),
    ]),
  head: ({ params }) => {
    const d = getDictionary("es");
    return {
      meta: pageMeta({
        title: `${d.catalog.title} — ${d.brand.name}`,
        description: d.catalog.metaDescription,
        path: `/${params.lang}/catalogo`,
      }),
      links: [{ rel: "canonical", href: `/${params.lang}/catalogo` }],
    };
  },
  component: CatalogPage,
});

function CatalogPage() {
  const { lang } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: products } = useSuspenseQuery(productsQuery());

  return (
    <CatalogView
      lang={lang}
      categories={categories}
      products={products}
      filters={{ category: search.categoria, color: search.color, size: search.talla }}
      onFiltersChange={(f) =>
        navigate({
          search: { categoria: f.category, color: f.color, talla: f.size },
          replace: true,
          resetScroll: false,
        })
      }
      showCategoryFilter
    />
  );
}
