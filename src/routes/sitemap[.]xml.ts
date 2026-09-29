import { createFileRoute } from "@tanstack/react-router";
import { shopConfig } from "@/lib/shop-config";
import { getPublicClient } from "@/lib/supabase-public.server";
import { locales } from "@/i18n/config";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = shopConfig.siteUrl;
        const db = getPublicClient();
        const [{ data: categories }, { data: products }] = await Promise.all([
          db.from("categories").select("slug").eq("is_active", true).order("sort_order"),
          db
            .from("products")
            .select("slug, updated_at, category:categories(slug)")
            .eq("is_active", true),
        ]);

        const urls: { loc: string; lastmod?: string; priority: string }[] = [];
        for (const lang of locales) {
          urls.push({ loc: `${origin}/${lang}`, priority: "1.0" });
          urls.push({ loc: `${origin}/${lang}/catalogo`, priority: "0.9" });
          urls.push({ loc: `${origin}/${lang}/ropa-interior`, priority: "0.9" });
          for (const c of categories ?? []) if (c.slug !== "ropa-interior") urls.push({ loc: `${origin}/${lang}/ropa-interior/${c.slug}`, priority: "0.8" });
          for (const p of products ?? []) {
            const cat = (p.category as { slug: string } | null)?.slug;
            if (cat) urls.push({ loc: `${origin}/${lang}/ropa-interior/${cat}/${p.slug}`, lastmod: p.updated_at, priority: "0.7" });
          }
          urls.push({ loc: `${origin}/${lang}/sobre-nosotros`, priority: "0.5" });
          urls.push({ loc: `${origin}/${lang}/guia-de-tallas`, priority: "0.5" });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : ""}<priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
