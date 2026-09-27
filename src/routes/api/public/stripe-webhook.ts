import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeSignature } from "@/lib/stripe.server";

async function cancelOrder(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Only transition pending orders, so stock is released exactly once.
  const { data: updated } = await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id");
  if (!updated?.length) return;
  const { data: items } = await supabaseAdmin.from("order_items").select("variant_id, quantity").eq("order_id", orderId);
  for (const it of items ?? []) {
    if (it.variant_id) await supabaseAdmin.rpc("release_variant_stock", { _variant_id: it.variant_id, _qty: it.quantity });
  }
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 500 });
        const body = await request.text();
        if (!(await verifyStripeSignature(body, request.headers.get("stripe-signature"), secret))) {
          return new Response("Invalid signature", { status: 400 });
        }
        const event = JSON.parse(body);
        const obj = event.data?.object ?? {};
        const orderId: string | undefined = obj.metadata?.order_id;
        if (!orderId) return new Response("ok");

        if (event.type === "checkout.session.completed" && obj.payment_status === "paid") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid", stripe_payment_intent_id: obj.payment_intent ?? null, stripe_session_id: obj.id })
            .eq("id", orderId)
            .eq("status", "pending_payment");
        } else if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
          // A failed attempt on Checkout still lets the customer retry until the session expires;
          // we cancel only on expiry for sessions, but payment_intent.payment_failed is honoured as requested.
          await cancelOrder(orderId);
        }
        return new Response("ok");
      },
    },
  },
});
