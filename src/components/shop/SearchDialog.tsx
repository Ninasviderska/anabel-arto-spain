import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { formatPrice } from "@/lib/format";
import { searchProducts } from "@/lib/storefront.functions";

export function SearchDialog() {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const search = useServerFn(searchProducts);

  useEffect(() => {
    const t = setTimeout(() => setTerm(text.trim()), 250);
    return () => clearTimeout(t);
  }, [text]);

  const q = useQuery({
    queryKey: ["search", term],
    queryFn: () => search({ data: { q: term } }),
    enabled: term.length >= 2,
    staleTime: 60_000,
  });

  return (
    <>
      <button
        type="button"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center text-foreground"
      >
        <Search className="size-5" strokeWidth={1.4} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-4">
          <DialogTitle className="font-display text-2xl font-normal">Buscar</DialogTitle>
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nombre del producto o referencia (p. ej. 7017)"
            aria-label="Buscar productos"
          />
          <div className="max-h-[60vh] overflow-y-auto">
            {term.length < 2 && <p className="py-4 text-sm text-muted-foreground">Escribe al menos 2 caracteres.</p>}
            {term.length >= 2 && q.isFetching && !q.data && <p className="py-4 text-sm text-muted-foreground">Buscando…</p>}
            {term.length >= 2 && q.isError && <p className="py-4 text-sm text-destructive">No se ha podido buscar. Inténtalo de nuevo.</p>}
            {term.length >= 2 && q.data?.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">No hemos encontrado nada para «{term}».</p>
            )}
            <ul className="divide-y divide-border">
              {q.data?.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/$lang/ropa-interior/$category/$product"
                    params={{ lang: locale, category: p.category_slug, product: p.slug }}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 py-3 hover:bg-accent/40"
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden bg-muted">
                      {p.image && <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Ref. {p.sku}</p>
                    </div>
                    <span className="text-sm">{formatPrice(p.price_cents, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
