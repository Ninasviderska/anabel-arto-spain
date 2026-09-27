import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { formatSizeEs } from "@/lib/sizes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/")({
  component: SalesTab,
});

const STATUS: Record<string, string> = {
  pending_payment: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
  refunded: "Возврат",
};
const PAID = ["paid", "shipped", "delivered"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

function SalesTab() {
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 30 * 864e5)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<"orders" | "products">("orders");

  const q = useQuery({
    queryKey: ["admin-orders", from, to, status],
    queryFn: async () => {
      let req = supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59.999`)
        .order("created_at", { ascending: false })
        .limit(500);
      if (status) req = req.eq("status", status as never);
      const { data, error } = await req;
      if (error) throw error;
      return data;
    },
  });

  const summary = useMemo(() => {
    const paid = (q.data ?? []).filter((o) => PAID.includes(o.status));
    const revenue = paid.reduce((s, o) => s + o.total_cents, 0);
    return { revenue, count: paid.length, avg: paid.length ? Math.round(revenue / paid.length) : 0 };
  }, [q.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1"><Label htmlFor="from">С</Label><Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="to">По</Label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="space-y-1">
          <Label htmlFor="status">Статус</Label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="flex h-10 rounded-sm border border-input bg-background px-3 text-sm">
            <option value="">Все</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Выручка (оплаченные)" value={formatPrice(summary.revenue, "es")} />
        <Stat label="Оплаченных заказов" value={String(summary.count)} />
        <Stat label="Средний чек" value={formatPrice(summary.avg, "es")} />
      </div>

      <div className="inline-flex rounded-sm border p-0.5">
        {([["orders", "Список заказов"], ["products", "По товарам"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setMode(k)} className={`rounded-sm px-3 py-1.5 text-sm ${mode === k ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{l}</button>
        ))}
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
      {q.isError && <p className="text-sm text-destructive">Не удалось загрузить заказы.</p>}
      {q.data && mode === "products" && <ByProduct orders={q.data} />}
      {q.data && mode === "orders" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b"><th className="py-2 pr-3">№</th><th className="pr-3">Дата</th><th className="pr-3">Email</th><th className="pr-3">Сумма</th><th className="pr-3">Статус</th><th>Позиций</th></tr>
            </thead>
            <tbody>
              {q.data.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Заказов нет</td></tr>}
              {q.data.map((o) => (
                <Fragment key={o.id}>
                  <tr className="cursor-pointer border-b hover:bg-accent/50" onClick={() => setOpen(open === o.id ? null : o.id)}>
                    <td className="py-2 pr-3 font-medium">{o.order_number}</td>
                    <td className="pr-3">{new Date(o.created_at).toLocaleString("ru-RU")}</td>
                    <td className="pr-3">{o.customer_email}</td>
                    <td className="pr-3">{formatPrice(o.total_cents, "es")}</td>
                    <td className="pr-3">{STATUS[o.status] ?? o.status}</td>
                    <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  </tr>
                  {open === o.id && (
                    <tr className="border-b bg-cream-deep/60">
                      <td colSpan={6} className="p-4">
                        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                          <table className="w-full text-sm">
                            <thead className="text-left text-muted-foreground"><tr><th>Товар</th><th>Цвет</th><th>Размер</th><th>Кол-во</th><th>Цена</th></tr></thead>
                            <tbody>
                              {o.items.map((i) => (
                                <tr key={i.id}><td className="py-1">{i.product_name}</td><td>{i.color_name}</td><td>{formatSizeEs(i.size)}</td><td>{i.quantity}</td><td>{formatPrice(i.unit_price_cents, "es")}</td></tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{o.customer_name}</p>
                            {o.customer_phone && <p>{o.customer_phone}</p>}
                            <p>{o.address_line1}{o.address_line2 ? `, ${o.address_line2}` : ""}</p>
                            <p>{o.postal_code} {o.city}, {o.province}, {o.country}</p>
                            {o.notes && <p className="text-muted-foreground">Комментарий: {o.notes}</p>}
                            <p className="pt-2">Оплата: {PAID.includes(o.status) || o.status === "refunded" ? "оплачено" : o.status === "pending_payment" ? "ожидает оплаты" : "не оплачено"}</p>
                            <p>Доставка: {formatPrice(o.shipping_cents, "es")}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type OrderLite = { status: string; items: { product_id: string | null; product_name: string; quantity: number; unit_price_cents: number }[] };

function ByProduct({ orders }: { orders: OrderLite[] }) {
  const costs = useQuery({
    queryKey: ["admin-costs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_costs").select("product_id, cost_cents");
      if (error) throw error;
      return Object.fromEntries(data.map((x) => [x.product_id, x.cost_cents])) as Record<string, number>;
    },
  });
  const rows = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number; supplier: number }>();
    for (const o of orders) {
      if (!PAID.includes(o.status)) continue;
      for (const i of o.items) {
        const key = i.product_id ?? i.product_name;
        const r = m.get(key) ?? { name: i.product_name, qty: 0, revenue: 0, supplier: 0 };
        r.qty += i.quantity;
        r.revenue += i.unit_price_cents * i.quantity;
        r.supplier += i.quantity * (i.product_id ? costs.data?.[i.product_id] ?? 0 : 0);
        m.set(key, r);
      }
    }
    return [...m.values()].sort((a, b) => b.revenue - a.revenue);
  }, [orders, costs.data]);
  const t = rows.reduce((a, r) => ({ qty: a.qty + r.qty, revenue: a.revenue + r.revenue, supplier: a.supplier + r.supplier }), { qty: 0, revenue: 0, supplier: 0 });
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b"><th className="py-2 pr-3">Товар</th><th className="pr-3">Продано</th><th className="pr-3">Выручка</th><th className="pr-3">К поставщику</th><th>Прибыль</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Оплаченных продаж за период нет</td></tr>}
          {rows.map((r) => (
            <tr key={r.name} className="border-b">
              <td className="py-2 pr-3">{r.name}</td><td className="pr-3">{r.qty}</td><td className="pr-3">{formatPrice(r.revenue, "es")}</td>
              <td className="pr-3">{formatPrice(r.supplier, "es")}</td><td>{formatPrice(r.revenue - r.supplier, "es")}</td>
            </tr>
          ))}
          {rows.length > 0 && (
            <tr className="border-t-2 bg-accent/40 font-semibold">
              <td className="py-2 pr-3">Итого</td><td className="pr-3">{t.qty}</td><td className="pr-3">{formatPrice(t.revenue, "es")}</td>
              <td className="pr-3">{formatPrice(t.supplier, "es")}</td><td>{formatPrice(t.revenue - t.supplier, "es")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
