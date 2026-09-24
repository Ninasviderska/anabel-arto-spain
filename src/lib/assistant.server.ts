import { getPublicClient } from "./supabase-public.server";
import { displaySize } from "./sizes";
import type { SizeType } from "./catalog.types";

export const SYSTEM_PROMPT = `Eres la asistente virtual de Anabel Arto España (anabelarto.es), una tienda online de lencería femenina de calidad europea. Tu tono es cálido, cercano, elegante y discreto — nunca insistente ni agresivo en ventas. Hablas como una asesora de tienda física amable, no como un bot de marketing. Tu prioridad es que cada clienta se sienta acompañada y bien atendida, para que su experiencia comprando en Anabel Arto sea fácil y agradable de principio a fin.

IDIOMA: Responde en español por defecto. Si la clienta escribe en otro idioma (inglés, ruso, ucraniano...), responde en ese mismo idioma manteniendo el mismo tono.

TUS FUNCIONES (solo estas — no inventes otras capacidades):

1. AYUDA CON LA TALLA
Cuando una clienta pregunte por su talla, pide su talla habitual (en cualquier sistema: ES, RU/UA, EU, UK, US) o sus medidas, y usa SIEMPRE la tabla de conversión oficial de la tienda (RU/UA↔FR/ES↔IT↔UK↔US↔INT) para recomendar la talla correcta en el sistema de la tienda (FR/ES). Antes de confirmar una recomendación, comprueba la disponibilidad REAL en stock de esa talla/color para el producto en cuestión — nunca recomiendes una combinación agotada. Si no hay stock en su talla exacta, dilo con claridad y sugiere las tallas o colores que sí están disponibles. Puedes mencionar que existe una página "Guía de tallas" con más detalle.

2. PREGUNTAS SOBRE EL PRODUCTO
Responde solo con la información real que consta en la ficha del producto (composición, cuidado, ajuste, color, precio). Si no tienes ese dato, dilo honestamente y ofrece derivar la consulta por email a orders@anabelarto.es — nunca inventes materiales, tallaje o características.

3. ESTADO DEL PEDIDO
Si la clienta da su número de pedido y/o email, consulta el estado real del pedido (preparando / enviado / entregado) y, si está enviado, proporciona el número de seguimiento GLS y el enlace de seguimiento. Si no encuentras el pedido con esos datos, pide que revise el número o email, y si persiste el problema, deriva a orders@anabelarto.es.

4. ENVÍOS Y DEVOLUCIONES
- Envíos: solo a la España peninsular. NO se realizan envíos a Baleares, Canarias, Ceuta ni Melilla — comunica esto con claridad y amabilidad si preguntan o si detectas que su dirección podría estar en esas zonas.
- Devoluciones: el artículo debe devolverse con el precinto/etiqueta higiénica intacta, sin usar, por motivos de higiene (ropa interior). Explica esto de forma natural, no como un aviso legal seco.
- Plazos y coste de envío: [PENDIENTE — se confirmará próximamente, por ahora si preguntan di que se lo confirmará el equipo por email a orders@anabelarto.es].

5. RECOMENDACIONES DE PRODUCTO (SOLO SI LO PIDEN)
Si la clienta pregunta explícitamente qué combina con un producto, o pide una recomendación, puedes sugerir artículos del mismo color/colección (usando datos reales del catálogo). NUNCA ofrezcas cross-selling de forma no solicitada ni insistas después de un "no, gracias".

6. DISPONIBILIDAD Y URGENCIA
Puedes mencionar la disponibilidad real (p. ej. "quedan 2 unidades en esta talla") solo cuando sea un dato real del stock — nunca crees sensación de urgencia falsa ni uses temporizadores o descuentos inventados.

LÍMITES ESTRICTOS:
- No dices ser una persona humana si te lo preguntan directamente — eres la asistente virtual de la tienda.
- No das consejos médicos ni de salud.
- No inventas datos de stock, precios, plazos de envío ni números de seguimiento.
- No presionas para comprar ni usas tácticas de urgencia falsas.
- No pides ni gestionas datos de pago (tarjetas, etc.) — el pago se hace siempre en el proceso de checkout oficial de la web.
- Si no sabes responder algo con certeza, lo dices con naturalidad y ofreces el contacto de la tienda (orders@anabelarto.es) en vez de inventar una respuesta.`;

export const SIZE_TABLES = `TABLA OFICIAL (datos técnicos, no mostrar como texto literal):
Ropa interior RU/UA→FR/ES→IT→UK→US→INT→DE/EU: 36→32→34→6→4→XS→30; 38→34→36→8→6→XS/S→32; 40→36→38→8→6→S→34; 42→38→40→10→8→S→36; 44→40→42→12→10→M→38; 46→42→44→14→12→M→40.
Sujetadores contorno RU/UA=DE/EU→FR/ES→IT→UK/US: 70→85→1→32; 75→90→2→34; 80→95→3→36; 85→100→4→38; 90→105→5→40. Copa igual en todos los sistemas.
Las herramientas devuelven tallas ya en FR/ES ("talla") y la etiqueta del fabricante ("etiqueta"). Guía de tallas: /es/guia-de-tallas. Enlace a producto: /es/ropa-interior/{categoria}/{slug}. Si una herramienta no devuelve datos, no los inventes.`;

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Busca productos reales del catálogo (nombre, SKU, categoría o color). Devuelve precio y stock real por color/talla.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto libre: SKU (p.ej. 8122-32), tipo (sujetador, braguitas, bata...), color. Vacío = todo el catálogo." },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_order",
      description: "Consulta el estado real de un pedido. Requiere número de pedido (p.ej. AA-1001) Y el email usado en la compra.",
      parameters: {
        type: "object",
        properties: { order_number: { type: "string" }, email: { type: "string" } },
        required: ["order_number", "email"],
        additionalProperties: false,
      },
    },
  },
] as const;

type Row = {
  name: string; sku: string; slug: string; price_cents: number; compare_at_price_cents: number | null;
  description: string | null; short_description: string | null;
  category: { slug: string; name: string; size_type: SizeType } | null;
  colors: { id: string; name: string }[];
  variants: { color_id: string | null; size: string; stock: number | null; is_active: boolean }[];
};

export async function searchProducts(query: string) {
  const { data, error } = await getPublicClient()
    .from("products")
    .select("name, sku, slug, price_cents, compare_at_price_cents, description, short_description, category:categories(slug, name, size_type), colors:product_colors(id, name), variants:product_variants(color_id, size, stock, is_active)")
    .eq("is_active", true);
  if (error) return { error: "catalog_unavailable" };
  const rows = data as unknown as Row[];
  const terms = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(Boolean);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matched = rows.filter((p) => {
    const hay = norm([p.name, p.sku, p.category?.name, ...p.colors.map((c) => c.name)].join(" "));
    return terms.every((t) => hay.includes(t.replace(/s$/, "")));
  });
  const list = (matched.length ? matched : terms.length ? [] : rows).slice(0, 8);
  return {
    results: list.map((p) => ({
      nombre: p.name,
      sku: p.sku,
      categoria: p.category?.name,
      enlace: `/es/ropa-interior/${p.category?.slug}/${p.slug}`,
      precio_eur: (p.price_cents / 100).toFixed(2),
      precio_anterior_eur: p.compare_at_price_cents ? (p.compare_at_price_cents / 100).toFixed(2) : null,
      descripcion: p.description ?? p.short_description,
      colores: p.colors.map((c) => ({
        color: c.name,
        tallas_disponibles: p.variants
          .filter((v) => v.color_id === c.id && v.is_active && (v.stock ?? 0) > 0)
          .map((v) => ({ talla: displaySize(v.size, p.category?.size_type ?? "numeric"), etiqueta: v.size, unidades: v.stock })),
      })),
    })),
  };
}

const STATUS: Record<string, string> = {
  pending_payment: "pendiente de pago",
  paid: "preparando",
  shipped: "enviado",
  delivered: "entregado",
  cancelled: "cancelado",
  refunded: "reembolsado",
};

export async function lookupOrder(orderNumber: string, email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("orders")
    .select("order_number, status, customer_email, created_at, total_cents, tracking_number, tracking_url")
    .eq("order_number", orderNumber.trim().toUpperCase())
    .maybeSingle();
  const row = data as null | { order_number: string; status: string; customer_email: string; created_at: string; total_cents: number; tracking_number: string | null; tracking_url: string | null };
  if (!row || row.customer_email.toLowerCase() !== email.trim().toLowerCase()) return { found: false };
  return {
    found: true,
    numero: row.order_number,
    estado: STATUS[row.status] ?? row.status,
    fecha: row.created_at.slice(0, 10),
    total_eur: (row.total_cents / 100).toFixed(2),
    seguimiento_gls: row.tracking_number,
    enlace_seguimiento: row.tracking_url,
  };
}
