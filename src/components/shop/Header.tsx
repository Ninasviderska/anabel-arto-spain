import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import type { Category } from "@/lib/catalog.types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header({ categories }: { categories: Category[] }) {
  const { locale, d } = useI18n();
  const { count, hydrated } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container-shop flex h-16 items-center justify-between gap-4 md:h-20">
        <button
          type="button"
          className="-ml-2 inline-flex h-10 w-10 items-center justify-center text-foreground md:hidden"
          aria-label={open ? d.nav.close : d.nav.menu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
        </button>

        <Link
          to="/$lang"
          params={{ lang: locale }}
          className="block shrink-0"
          aria-label={d.brand.name}
        >
          <Logo variant="dark" className="h-7 w-auto md:h-8" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          <Link
            to="/$lang/catalogo"
            params={{ lang: locale }}
            search={{}}
            className="link-underline text-[0.72rem] tracking-[0.22em] uppercase text-foreground/80 hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            {d.nav.catalog}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 px-0 text-[0.72rem] font-normal tracking-[0.22em] uppercase text-foreground/80">
                {d.nav.underwear}<ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuItem asChild><Link to="/$lang/ropa-interior" params={{ lang: locale }}>{d.nav.underwear}</Link></DropdownMenuItem>
              {categories.filter((c) => c.parent_id).map((c) => (
                <DropdownMenuItem key={c.id} asChild><Link to="/$lang/ropa-interior/$category" params={{ lang: locale, category: c.slug }}>{c.name}</Link></DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <Link
          to="/$lang/carrito"
          params={{ lang: locale }}
          className="relative -mr-2 inline-flex h-10 w-10 items-center justify-center text-foreground"
          aria-label={d.nav.cart}
        >
          <ShoppingBag className="size-5" strokeWidth={1.4} />
          {hydrated && count > 0 && (
            <span className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-medium text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <nav aria-label="Principal móvil" className="border-t border-border bg-background md:hidden">
          <ul className="container-shop flex flex-col py-3">
            <li>
              <Link
                to="/$lang/catalogo"
                params={{ lang: locale }}
                search={{}}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm tracking-[0.18em] uppercase"
              >
                {d.nav.catalog}
              </Link>
            </li>
            <li><Link to="/$lang/ropa-interior" params={{ lang: locale }} onClick={() => setOpen(false)} className="block py-3 text-sm tracking-[0.18em] uppercase">{d.nav.underwear}</Link></li>
            {categories.filter((c) => c.parent_id).map((c) => (
              <li key={c.id}>
                <Link
                  to="/$lang/ropa-interior/$category"
                  params={{ lang: locale, category: c.slug }}
                  onClick={() => setOpen(false)}
                  className="block py-2 pl-4 text-sm text-muted-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
