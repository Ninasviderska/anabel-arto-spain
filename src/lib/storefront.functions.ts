import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPublicClient } from "./supabase-public.server";

export type SearchHit = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_slug: string;
  price_cents: number;
  image: string | null;
};

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string }) => z.object({ q: z.string().trim().min(2).max(60) }).parse(input))
  .handler(async ({ data }): Promise<SearchHit[]> => {
    const term = `%${data.q.replace(/[%_,()\\]/g, " ").trim()}%`;
    const db = getPublicClient();
    const { data: vs } = await db.from("product_variants").select("product_id").ilike("variant_sku", term).limit(200);
    const ids = [...new Set((vs ?? []).map((v) => v.product_id))];
    let q = db
      .from("products")
      .select("id, name, slug, sku, price_cents, category:categories(slug), images:product_images(url, sort_order)")
      .eq("is_active", true)
      .limit(12);
    const or = [`name.ilike.${term}`, `sku.ilike.${term}`];
    if (ids.length) or.push(`id.in.(${ids.join(",")})`);
    q = q.or(or.join(","));
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((p) => {
      const imgs = [...((p.images as { url: string; sort_order: number }[]) ?? [])].sort((a, b) => a.sort_order - b.sort_order);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price_cents: p.price_cents,
        category_slug: (p.category as { slug: string } | null)?.slug ?? "",
        image: imgs[0]?.url ?? null,
      };
    });
  });

export type OrderStatusResult = {
  order_number: string;
  status: string;
  created_at: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  tracking_number: string | null;
  tracking_url: string | null;
  items: { product_name: string; color_name: string; size: string; quantity: number; unit_price_cents: number; image_url: string | null }[];
};

export const checkOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; orderNumber: string }) =>
    z.object({ email: z.string().trim().email().max(200), orderNumber: z.string().trim().min(3).max(30) }).parse(input),
  )
  .handler(async ({ data }): Promise<OrderStatusResult | null> => {
    const { data: r, error } = await getPublicClient().rpc("get_order_status_public" as never, {
      _order_number: data.orderNumber,
      _email: data.email,
    } as never);
    if (error) throw new Error("lookup_failed");
    return (r as OrderStatusResult | null) ?? null;
  });
