import { stripeRequest } from "./stripe.server";

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/** Cancels a pending order and returns its stock. Idempotent: only acts on pending_payment. */
export async function cancelPendingOrder(orderId: string) {
  const db = await admin();
  const { data: updated } = await db
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id");
  if (!updated?.length) return false;
  const { data: items } = await db.from("order_items").select("variant_id, quantity").eq("order_id", orderId);
  for (const it of items ?? []) {
    if (it.variant_id) await db.rpc("release_variant_stock", { _variant_id: it.variant_id, _qty: it.quantity });
  }
  return true;
}

export async function markOrderPaid(orderId: string, sessionId: string, paymentIntentId: string | null) {
  const db = await admin();
  await db
    .from("orders")
    .update({ status: "paid", stripe_session_id: sessionId, stripe_payment_intent_id: paymentIntentId })
    .eq("id", orderId)
    .eq("status", "pending_payment");
}

/**
 * Safety net: orders pending for more than 60 minutes. Checks Stripe first so a paid order
 * whose webhook was lost is marked paid instead of cancelled.
 */
export async function releaseStaleOrders(maxAgeMinutes = 60) {
  const db = await admin();
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000).toISOString();
  const { data: stale } = await db
    .from("orders")
    .select("id, stripe_session_id")
    .eq("status", "pending_payment")
    .lt("created_at", cutoff)
    .limit(50);
  let cancelled = 0;
  for (const o of stale ?? []) {
    try {
      if (o.stripe_session_id) {
        const s = await stripeRequest<{ payment_status: string; payment_intent: string | null; status: string }>(
          "GET",
          `/checkout/sessions/${encodeURIComponent(o.stripe_session_id)}`,
        );
        if (s.payment_status === "paid") {
          await markOrderPaid(o.id, o.stripe_session_id, s.payment_intent);
          continue;
        }
        if (s.status === "open") await stripeRequest("POST", `/checkout/sessions/${encodeURIComponent(o.stripe_session_id)}/expire`);
      }
      if (await cancelPendingOrder(o.id)) cancelled++;
    } catch (err) {
      console.error("[releaseStaleOrders]", o.id, err);
    }
  }
  return { checked: stale?.length ?? 0, cancelled };
}
