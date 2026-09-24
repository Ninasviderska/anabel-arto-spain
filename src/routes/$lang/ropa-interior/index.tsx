import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, productsQuery } from "@/lib/catalog.queries";
import { pageMeta } from "@/lib/seo";
import { ProductCard } from "@/components/shop/ProductCard";
import { CATEGORY_IMAGES } from "@/lib/category-images";

export const Route = createFileRoute("/$lang/ropa-interior/")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(categoriesQuery()), context.queryClient.ensureQueryData(productsQuery())]),
  head: ({ params }) => ({ meta: pageMeta({ title: "Ropa Interior Femenina | Comprar Lencería Anabel Arto en España", description: "Compra ropa interior femenina Anabel Arto a buen precio. Calidad europea, últimas unidades y envío GLS a Madrid, Barcelona y la España peninsular.", path: `/${params.lang}/ropa-interior` }), links: [{ rel: "canonical", href: `/${params.lang}/ropa-interior` }] }),
  component: RopaInteriorPage,
});

 function RopaInteriorPage() {
  const { lang } = Route.useParams();
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: products } = useSuspenseQuery(productsQuery());
  const children = categories.filter((c) => c.parent_id);
  return <div className="container-shop py-12 md:py-16"><header className="max-w-3xl"><p className="eyebrow">Anabel Arto</p><h1 className="mt-3 font-display text-5xl">Ropa interior</h1><p className="mt-4 leading-relaxed text-muted-foreground">Ropa interior femenina de confección europea, producida en Ucrania. Descubre las últimas unidades de colección a precios de liquidación, con entrega en la España peninsular.</p></header><ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">{children.map((c) => { const count=products.filter((p)=>p.category.id===c.id).length; return <li key={c.id}><Link to="/$lang/ropa-interior/$category" params={{lang,category:c.slug}} className="group block"><div className="aspect-[3/4] overflow-hidden rounded-sm bg-cream-deep">{(CATEGORY_IMAGES[c.slug]?.url ?? c.image_url)&&<img src={CATEGORY_IMAGES[c.slug]?.url ?? c.image_url ?? ""} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: CATEGORY_IMAGES[c.slug]?.position ?? "center" }} />}</div><h2 className="mt-3 font-display text-xl">{c.name}</h2><p className="text-xs text-muted-foreground">{count} {count===1?"modelo":"modelos"}</p></Link></li>; })}</ul><section className="mt-20"><h2 className="font-display text-3xl">Últimas unidades</h2><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{products.slice(0,8).map((p)=><ProductCard key={p.id} product={p}/>)}</div></section></div>;
}