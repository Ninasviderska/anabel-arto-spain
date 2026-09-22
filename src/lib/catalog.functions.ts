import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getPublicClient } from "./supabase-public.server";
import { PRODUCT_SELECT, sortProduct, type Category, type Product } from "./catalog.types";

export const getCategories = createServerFn({ method: "GET" }).handler(async (): Promise<Category[]> => {
  const { data, error } = await getPublicClient()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data;
});

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { categorySlug?: string; featured?: boolean } | undefined) =>
    z.object({ categorySlug: z.string().optional(), featured: z.boolean().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<Product[]> => {
    let q = getPublicClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (data.featured) q = q.eq("is_featured", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const products = (rows as unknown as Product[]).map(sortProduct);
    return data.categorySlug
      ? products.filter((p) => p.category.slug === data.categorySlug)
      : products;
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<Product | null> => {
    const { data: row, error } = await getPublicClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? sortProduct(row as unknown as Product) : null;
  });

/** Absolute origin of the current request — used for og:image / JSON-LD URLs. */
export const getSiteOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  const url = new URL(req.url);
  const sandboxHost = url.hostname === "localhost" ? req.headers.get("x-forwarded-host") : null;
  return sandboxHost ? `https://${sandboxHost}` : url.origin;
});
