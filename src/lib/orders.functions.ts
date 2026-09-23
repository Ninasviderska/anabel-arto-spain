import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPublicClient } from "./supabase-public.server";
import { shippingFor } from "./shop-config";
import { isVariantAvailable } from "./catalog.types";
import { isMainlandShippingAddress } from "./shipping";

export const checkoutSchema = z.object({
  locale: z.string().default("es"),
  customer: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.string().trim().min(6).max(20),
    address1: z.string().trim().min(3),
    address2: z.string().trim().max(120).optional().or(z.literal("")),
    postalCode: z.string().trim().regex(/^\d{5}$/),
    city: z.string().trim().min(2),
    province: z.string().trim().min(2),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  }),
  items: z.array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(10) })).min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutResult = {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  /** Stripe Checkout URL once payments are enabled; null while payments are not configured. */
  paymentUrl: string | null;
};

/**
 * Creates an order from the cart. Prices are always recomputed server-side from the catalog,
 * never trusted from the client. Payment hand-off to Stripe is stubbed until payments are enabled.
 */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CheckoutInput) => checkoutSchema.parse(input))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    if (!isMainlandShippingAddress(data.customer.province, data.customer.postalCode)) throw new Error("MAINLAND_ONLY");
    const publicDb = getPublicClient();
    const variantIds = data.items.map((i) => i.variantId);
    const { data: variants, error } = await publicDb
      .from("product_variants")
      .select("*, color:product_colors(name), product:products(id, name, price_cents, is_active, images:product_images(url, color_id, sort_order))")
      .in("id", variantIds);
    if (error) throw new Error(error.message);
    if (!variants || variants.length !== variantIds.length) throw new Error("VARIANT_NOT_FOUND");

    const lines = data.items.map((item) => {
      const v = variants.find((x) => x.id === item.variantId);
      if (!v) throw new Error("VARIANT_NOT_FOUND");
      if (!v.product?.is_active || !isVariantAvailable(v)) throw new Error("VARIANT_UNAVAILABLE");
      const unit = v.price_override_cents ?? v.product.price_cents;
      const image =
        v.product.images.find((img) => img.color_id === v.color_id) ?? v.product.images[0];
      return {
        variant_id: v.id,
        product_id: v.product.id,
        product_name: v.product.name,
        color_name: v.color?.name ?? "",
        size: v.size,
        variant_sku: v.variant_sku,
        image_url: image?.url ?? null,
        unit_price_cents: unit,
        quantity: item.quantity,
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0);
    const shipping = shippingFor(subtotal);
    const total = subtotal + shipping;

    // Orders are not writable by anonymous visitors (no RLS policy); the checkout flow
    // is the only writer and runs with the privileged server client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const c = data.customer;
    const reserved: { id: string; quantity: number }[] = [];
    for (const line of lines) {
      const { data: ok, error: reserveError } = await supabaseAdmin.rpc("reserve_variant_stock", { _variant_id: line.variant_id, _qty: line.quantity });
      if (reserveError || !ok) {
        for (const previous of reserved) await supabaseAdmin.rpc("release_variant_stock", { _variant_id: previous.id, _qty: previous.quantity });
        throw new Error("VARIANT_UNAVAILABLE");
      }
      reserved.push({ id: line.variant_id, quantity: line.quantity });
    }
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        locale: data.locale,
        customer_name: c.name,
        customer_email: c.email,
        customer_phone: c.phone,
        address_line1: c.address1,
        address_line2: c.address2 || null,
        postal_code: c.postalCode,
        city: c.city,
        province: c.province,
        country: "ES",
        notes: c.notes || null,
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: total,
      })
      .select("id, order_number")
      .single();
    if (orderError || !order) {
      for (const previous of reserved) await supabaseAdmin.rpc("release_variant_stock", { _variant_id: previous.id, _qty: previous.quantity });
      throw new Error(orderError?.message ?? "ORDER_FAILED");
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) {
      for (const previous of reserved) await supabaseAdmin.rpc("release_variant_stock", { _variant_id: previous.id, _qty: previous.quantity });
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    // TODO(stripe): once Lovable payments are enabled, create a Stripe Checkout Session here
    // with `lines`, store its id in orders.stripe_session_id and return session.url.
    return { orderId: order.id, orderNumber: order.order_number, totalCents: total, paymentUrl: null };
  });
