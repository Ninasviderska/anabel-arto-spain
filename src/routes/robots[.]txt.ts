import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const fwd = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
        const origin = fwd ? `https://${fwd}` : url.origin;
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
