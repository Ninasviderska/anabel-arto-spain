import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { categoriesQuery, productsQuery } from "@/lib/catalog.queries";
import { pageMeta, canonical } from "@/lib/seo";
import { CatalogView } from "@/components/shop/CatalogView";

const searchSchema = z.object({
  categoria: z.string().optional(),
  color: z.string().optional(),
  talla: z.string().optional(),
  page: z.coerce.number().int().min(2).optional().catch(undefined),
});

export const Route = createFileRoute("/$lang/catalogo")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(productsQuery()),
    ]);
    return { page: deps.page };
  },
  head: ({ params, loaderData }) => {
    const d = getDictionary("es");
    const page = loaderData?.page;
    const path = `/${params.lang}/catalogo${page ? `?page=${page}` : ""}`;
    const suffix = page ? ` — Página ${page}` : "";
    return {
      meta: pageMeta({
        title: `${d.catalog.title}${suffix} — ${d.brand.name}`,
        description: d.catalog.metaDescription,
        path,
      }),
      links: [canonical(path)],
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
       categories={categories.filter((c) => c.parent_id)}
      products={products}
      filters={{ category: search.categoria, color: search.color, size: search.talla }}
      onFiltersChange={(f) =>
        navigate({
          search: { categoria: f.category, color: f.color, talla: f.size, page: undefined },
          replace: true,
          resetScroll: false,
        })
      }
      showCategoryFilter
      page={search.page ?? 1}
      onPageChange={(n) => navigate({ search: (s) => ({ ...s, page: n > 1 ? n : undefined }) })}
    />
  );
}
