import { createFileRoute } from "@tanstack/react-router";
import { shopConfig } from "@/lib/shop-config";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const origin = shopConfig.siteUrl;
        const body = `User-agent: *
Allow: /
Disallow: /*/carrito
Disallow: /*/pedido

Sitemap: ${origin}/sitemap.xml
`;
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
