import { formatSizeEs } from "./sizes";
import { rpc, rpcSecret } from "./order-payments.server";

type OrderEmailData = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  items: { product_name: string; color_name: string; size: string; quantity: number; unit_price_cents: number }[];
};

const eur = (c: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(c / 100);
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

function renderConfirmation(o: OrderEmailData): { subject: string; html: string; text: string } {
  const rows = o.items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee4dc">${esc(i.product_name)}<br><span style="color:#8a7a80;font-size:13px">${esc(i.color_name)} · ${esc(formatSizeEs(i.size))} · x${i.quantity}</span></td><td style="padding:8px 0;border-bottom:1px solid #eee4dc;text-align:right;white-space:nowrap">${eur(i.unit_price_cents * i.quantity)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff;font-family:Helvetica,Arial,sans-serif;color:#2b1f26">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<h1 style="font-family:Georgia,serif;font-weight:normal;color:#4a1942;font-size:26px;margin:0 0 8px">Anabel Arto</h1>
<p style="font-size:16px">Hola ${esc(o.customer_name)},</p>
<p style="font-size:15px;line-height:1.6">¡Gracias por tu compra! Hemos recibido tu pago y tu pedido <strong>${esc(o.order_number)}</strong> está confirmado.</p>
<table style="width:100%;border-collapse:collapse;font-size:15px;margin:24px 0">${rows}
<tr><td style="padding:8px 0;color:#8a7a80">Subtotal</td><td style="text-align:right">${eur(o.subtotal_cents)}</td></tr>
<tr><td style="padding:4px 0;color:#8a7a80">Envío GLS</td><td style="text-align:right">${o.shipping_cents === 0 ? "Gratis" : eur(o.shipping_cents)}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold">${eur(o.total_cents)}</td></tr></table>
<p style="font-size:15px;line-height:1.6">Te enviaremos un segundo correo cuando tu pedido esté preparado para el envío, con los datos de seguimiento.</p>
<p style="font-size:14px;color:#8a7a80;line-height:1.6">¿Alguna duda? Escríbenos a orders@anabelarto.es indicando tu número de pedido.</p>
</div></body></html>`;
  const text = [
    `Hola ${o.customer_name},`,
    `¡Gracias por tu compra! Tu pedido ${o.order_number} está confirmado.`,
    ...o.items.map((i) => `- ${i.product_name} (${i.color_name} · ${formatSizeEs(i.size)}) x${i.quantity}: ${eur(i.unit_price_cents * i.quantity)}`),
    `Envío: ${o.shipping_cents === 0 ? "Gratis" : eur(o.shipping_cents)}`,
    `Total: ${eur(o.total_cents)}`,
    "Te enviaremos un segundo correo cuando tu pedido esté preparado para el envío.",
    "Dudas: orders@anabelarto.es",
  ].join("\n");
  return { subject: `Pedido ${o.order_number} confirmado — Anabel Arto`, html, text };
}

/** Sends the order confirmation via SMTP (nodemailer). Never throws: a failed email must not break the webhook. */
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASSWORD"];
  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD); skipping confirmation for", orderId);
    return;
  }
  try {
    const order = await rpc<OrderEmailData | null>("get_order_for_email", { _secret: rpcSecret(), _order_id: orderId });
    if (!order) return;
    const { subject, html, text } = renderConfirmation(order);
    const { default: nodemailer } = await import("nodemailer");
    const port = Number(process.env["SMTP_PORT"] || 465);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env["SMTP_SECURE"] !== "false",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: process.env["EMAIL_FROM"] || `Anabel Arto <${user}>`,
      to: order.customer_email,
      replyTo: "info@anabelarto.es",
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[email] confirmation failed", orderId, err);
  }
}
