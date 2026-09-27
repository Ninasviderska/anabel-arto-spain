import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
    // Safety net: free stock from orders left pending > 60 min (in case a webhook was missed).
    try {
      const { releaseStaleOrders } = await import("./order-payments.server");
      await releaseStaleOrders(60);
    } catch (err) {
      console.error("[createOrder] stale sweep failed", err);
    }
    // Prices, shipping and stock reservation are computed atomically inside the database.
    const { rpc, attachOrderSession, cancelPendingOrder } = await import("./order-payments.server");
    const c = data.customer;
    let created: {
      order_id: string;
      order_number: string;
      shipping_cents: number;
      total_cents: number;
      lines: { product_name: string; color_name: string; size: string; unit_price_cents: number; quantity: number }[];
    };
    try {
      created = await rpc("create_order", {
        _locale: data.locale,
        _customer: {
          name: c.name, email: c.email, phone: c.phone, address1: c.address1, address2: c.address2 || "",
          postalCode: c.postalCode, city: c.city, province: c.province, notes: c.notes || "",
        },
        _items: data.items,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("MAINLAND_ONLY")) throw new Error("MAINLAND_ONLY");
      if (msg.includes("VARIANT_UNAVAILABLE")) throw new Error("VARIANT_UNAVAILABLE");
      throw new Error("ORDER_FAILED");
    }
    const order = { id: created.order_id, order_number: created.order_number };
    const lines = created.lines;
    const shipping = created.shipping_cents;
    const total = created.total_cents;

    const { stripeRequest } = await import("./stripe.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const origin = getRequestHeader("origin") ?? "https://anabelarto.es";
    const lang = encodeURIComponent(data.locale);
    const lineItems: Record<string, unknown>[] = lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "eur",
        unit_amount: l.unit_price_cents,
        product_data: { name: `${l.product_name} · ${l.color_name} · ${formatSizeEs(l.size)}` },
      },
    }));
    if (shipping > 0) {
      lineItems.push({ quantity: 1, price_data: { currency: "eur", unit_amount: shipping, product_data: { name: "Envío GLS (España peninsular)" } } });
    }
    try {
      const session = await stripeRequest<{ id: string; url: string }>("POST", "/checkout/sessions", {
        mode: "payment",
        line_items: Object.fromEntries(lineItems.map((li, i) => [i, li])),
        customer_email: c.email,
        client_reference_id: order.order_number,
        locale: "es",
        metadata: { order_id: order.id, order_number: order.order_number },
        payment_intent_data: { metadata: { order_id: order.id, order_number: order.order_number } },
        expires_at: Math.floor(Date.now() / 1000) + 45 * 60,
        success_url: `${origin}/${lang}/pedido/gracias?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/${lang}/pedido`,
      });
      await attachOrderSession(order.id, session.id);
      return { orderId: order.id, orderNumber: order.order_number, totalCents: total, paymentUrl: session.url };
    } catch (err) {
      await cancelPendingOrder(order.id).catch((e) => console.error("[createOrder] rollback failed", e));
      throw err;
    }
  });
