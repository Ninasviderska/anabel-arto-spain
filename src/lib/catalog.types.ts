import type { Database } from "@/integrations/supabase/types";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export type Category = Row<"categories">;
export type ProductColor = Row<"product_colors">;
export type ProductImage = Row<"product_images">;
export type ProductVariant = Row<"product_variants">;
export type SizeType = Database["public"]["Enums"]["size_type"];

export type Product = Row<"products"> & {
  category: Pick<Category, "id" | "slug" | "name" | "size_type">;
  colors: ProductColor[];
  images: ProductImage[];
  variants: ProductVariant[];
};

export const PRODUCT_SELECT =
  "*, category:categories(id, slug, name, size_type), colors:product_colors(*), images:product_images(*), variants:product_variants(*)";

export function sortProduct(p: Product): Product {
  return {
    ...p,
    colors: [...p.colors].sort((a, b) => a.sort_order - b.sort_order),
    images: [...p.images].sort((a, b) => a.sort_order - b.sort_order),
    variants: [...p.variants].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function isVariantAvailable(v: ProductVariant): boolean {
  if (!v.is_active) return false;
  // Placeholder stock: null means "in stock" until real stock levels are loaded.
  return v.stock === null || v.stock > 0;
}

export function primaryImage(p: Product, colorId?: string | null): ProductImage | undefined {
  if (colorId) {
    const img = p.images.find((i) => i.color_id === colorId);
    if (img) return img;
  }
  return p.images[0];
}
