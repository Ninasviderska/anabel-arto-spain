import { stripeRequest } from "./stripe.server";
import { getPublicClient } from "./supabase-public.server";

/**
 * All order writes go through SECURITY DEFINER database functions called with the public key.
 * Trusted operations (mark paid, cancel, attach session) require ORDER_RPC_SECRET, which the
 * database validates internally. No service-role key is needed anywhere.
 */
export function rpcSecret(): string {
  const s = process.env["ORDER_RPC_SECRET"];
  if (!s) throw new Error("ORDER_RPC_SECRET not configured");
  return s;
}

// Untyped RPC helper (new functions may not be in generated types yet).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any).rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/** Cancels a pending order and returns its stock. Idempotent: only acts on pending_payment. */
export async function cancelPendingOrder(orderId: string) {
  return rpc<boolean>("cancel_pending_order", { _secret: rpcSecret(), _order_id: orderId });
}

export async function markOrderPaid(orderId: string, sessionId: string, paymentIntentId: string | null) {
  return rpc<boolean>("mark_order_paid", {
    _secret: rpcSecret(),
    _order_id: orderId,
    _session_id: sessionId,
    _payment_intent_id: paymentIntentId,
  });
}

export async function attachOrderSession(orderId: string, sessionId: string) {
  await rpc("attach_order_session", { _secret: rpcSecret(), _order_id: orderId, _session_id: sessionId });
}

export async function getOrderPaymentRef(orderId: string) {
  const rows = await rpc<{ order_number: string; stripe_session_id: string | null }[]>("get_order_payment_ref", {
    _secret: rpcSecret(),
    _order_id: orderId,
  });
  return rows?.[0] ?? null;
}

/**
 * Safety net: orders pending for more than N minutes. Checks Stripe first so a paid order
 * whose webhook was lost is marked paid instead of cancelled.
 */
export async function releaseStaleOrders(maxAgeMinutes = 60) {
  const stale = await rpc<{ id: string; stripe_session_id: string | null }[]>("list_stale_orders", {
    _secret: rpcSecret(),
    _max_age_minutes: maxAgeMinutes,
  });
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
