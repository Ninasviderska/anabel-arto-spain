import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getDictionary, I18nContext, isLocale, type Locale } from "@/i18n";
import { CartProvider } from "@/lib/cart";
import { categoriesQuery } from "@/lib/catalog.queries";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
    return { locale: params.lang as Locale };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery()),
  component: LangLayout,
});

function LangLayout() {
  const { locale } = Route.useRouteContext();
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const value = useMemo(() => ({ locale, d: getDictionary(locale) }), [locale]);

  return (
    <I18nContext.Provider value={value}>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header categories={categories} />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer categories={categories} />
        </div>
      </CartProvider>
    </I18nContext.Provider>
  );
}
