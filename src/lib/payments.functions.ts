import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PaymentVerification =
  | { status: "paid"; orderNumber: string }
  | { status: "pending" | "failed" | "invalid"; orderNumber: string | null };

/** Confirms a Checkout Session against Stripe server-side before showing success. */
export const verifyCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string }) =>
    z.object({ sessionId: z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/).max(255) }).parse(input),
  )
  .handler(async ({ data }): Promise<PaymentVerification> => {
    const { stripeRequest } = await import("./stripe.server");
    const { markOrderPaid, getOrderPaymentRef } = await import("./order-payments.server");
    try {
      const s = await stripeRequest<{ id: string; payment_status: string; status: string; payment_intent: string | null; metadata: Record<string, string> }>(
        "GET",
        `/checkout/sessions/${encodeURIComponent(data.sessionId)}`,
      );
      const orderId = s.metadata?.['order_id'];
      if (!orderId) return { status: "invalid", orderNumber: null };
      const order = await getOrderPaymentRef(orderId);
      if (!order || order.stripe_session_id !== s.id) return { status: "invalid", orderNumber: null };
      if (s.payment_status === "paid") {
        await markOrderPaid(orderId, s.id, s.payment_intent);
        return { status: "paid", orderNumber: order.order_number };
      }
      return { status: s.status === "expired" ? "failed" : "pending", orderNumber: order.order_number };
    } catch (err) {
      console.error("[verifyCheckoutSession]", err);
      return { status: "invalid", orderNumber: null };
    }
  });
