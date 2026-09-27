import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeSignature } from "@/lib/stripe.server";
import { cancelPendingOrder, markOrderPaid } from "@/lib/order-payments.server";

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
          // Stock is deducted inside mark_order_paid; email only on the first transition to paid.
          if (await markOrderPaid(orderId, obj.id, obj.payment_intent ?? null)) {
            const { sendOrderConfirmationEmail } = await import("@/lib/email.server");
            await sendOrderConfirmationEmail(orderId);
          }
        } else if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
          await cancelPendingOrder(orderId);
        }
        return new Response("ok");
      },
    },
  },
});
