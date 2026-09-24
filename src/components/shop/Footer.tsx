import { Link } from "@tanstack/react-router";
import { legalSlugs, useI18n } from "@/i18n";
import { shopConfig } from "@/lib/shop-config";
import type { Category } from "@/lib/catalog.types";
import { Logo } from "@/components/Logo";

export function Footer({ categories }: { categories: Category[] }) {
  const { locale, d } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-cream-deep">
      <div className="container-shop grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo variant="dark" className="h-8 w-auto" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{d.brand.tagline}</p>
          <p className="mt-6 text-xs tracking-wide text-muted-foreground">{d.footer.madeIn}</p>
        </div>

        <div>
          <h2 className="eyebrow mb-5 text-foreground">{d.footer.shop}</h2>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/$lang/catalogo" params={{ lang: locale }} search={{}} className="link-underline">
                {d.catalog.allProducts}
              </Link>
            </li>
            <li><Link to="/$lang/ropa-interior" params={{ lang: locale }} className="link-underline font-medium">{d.nav.underwear}</Link></li>
            {categories.filter((c) => c.parent_id).map((c) => (
              <li key={c.id}>
                <Link to="/$lang/ropa-interior/$category" params={{ lang: locale, category: c.slug }} className="link-underline pl-3 text-muted-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-5 text-foreground">{d.footer.legal}</h2>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/$lang/guia-de-tallas" params={{ lang: locale }} className="link-underline">
                Guía de tallas
              </Link>
            </li>
            {legalSlugs.map((slug) => (
              <li key={slug}>
                <Link to={`/$lang/${slug}`} params={{ lang: locale }} className="link-underline">
                  {d.legal.pages[slug].title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-5 text-foreground">{d.footer.contact}</h2>
          <p className="text-sm text-muted-foreground">{d.footer.contactText}</p>
          <a href={`mailto:${shopConfig.contactEmail}`} className="link-underline mt-3 inline-block text-sm">
            {shopConfig.contactEmail}
          </a>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="container-shop flex flex-col gap-2 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {d.brand.name}. {d.footer.rights}
          </p>
          <p>{d.footer.placeholderNif}</p>
        </div>
      </div>
    </footer>
  );
}
