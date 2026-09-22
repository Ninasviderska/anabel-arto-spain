import { queryOptions } from "@tanstack/react-query";
import { getCategories, getProductBySlug, getProducts, getSiteOrigin } from "./catalog.functions";

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => getCategories(), staleTime: 5 * 60_000 });

export const productsQuery = (filters: { categorySlug?: string; featured?: boolean } = {}) =>
  queryOptions({
    queryKey: ["products", filters],
    queryFn: () => getProducts({ data: filters }),
    staleTime: 60_000,
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

export const originQuery = () =>
  queryOptions({ queryKey: ["origin"], queryFn: () => getSiteOrigin(), staleTime: Infinity });
