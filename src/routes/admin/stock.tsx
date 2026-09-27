import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { formatSizeEs } from "@/lib/sizes";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/stock")({
  component: StockTab,
});

type Row = {
  id: string;
  product_id: string;
  size: string;
  variant_sku: string;
  stock: number | null;
  price_override_cents: number | null;
  sort_order: number;
  product: { name: string; price_cents: number } | null;
  color: { name: string } | null;
};
type Data = { rows: Row[]; costs: Record<string, number> };
const KEY = ["admin-stock"];
const eur = (c: number) => formatPrice(c, "es");

function toCents(v: string): number | null | "invalid" {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return "invalid";
  return Math.round(n * 100);
}
const fromCents = (c: number | null | undefined) => (c == null ? "" : (c / 100).toFixed(2));

function StockTab() {
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Data> => {
      const [v, c] = await Promise.all([
        supabase
          .from("product_variants")
          .select("id, product_id, size, variant_sku, stock, price_override_cents, sort_order, product:products(name, price_cents), color:product_colors(name)")
          .order("variant_sku"),
        supabase.from("product_costs").select("product_id, cost_cents"),
      ]);
      if (v.error) throw v.error;
      if (c.error) throw c.error;
      return {
        rows: v.data as unknown as Row[],
        costs: Object.fromEntries((c.data ?? []).map((x) => [x.product_id, x.cost_cents])),
      };
    },
  });
  const term = search.trim().toLowerCase();
  const rows = (q.data?.rows ?? []).filter(
    (r) => !term || r.variant_sku.toLowerCase().includes(term) || (r.product?.name ?? "").toLowerCase().includes(term),
  );
  const costs = q.data?.costs ?? {};

  const groups: { pid: string; name: string; rows: Row[] }[] = [];
  for (const r of rows) {
    let g = groups.find((x) => x.pid === r.product_id);
    if (!g) groups.push((g = { pid: r.product_id, name: r.product?.name ?? "", rows: [] }));
    g.rows.push(r);
  }
  const totals = (rs: Row[]) =>
    rs.reduce(
      (a, r) => {
        const s = r.stock ?? 0;
        const price = r.price_override_cents ?? r.product?.price_cents ?? 0;
        a.qty += s;
        a.total += s * price;
        a.supplier += s * (costs[r.product_id] ?? 0);
        return a;
      },
      { qty: 0, total: 0, supplier: 0 },
    );
  const grand = totals(rows);

  return (
    <div className="space-y-4">
      <Input placeholder="Поиск по названию или SKU" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <p className="text-xs text-muted-foreground">Акционная цена: если задана — сайт продаёт по этой цене вместо обычной. Пустое поле = обычная цена.</p>
      {q.isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
      {q.isError && <p className="text-sm text-destructive">Не удалось загрузить остатки.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-3">Товар</th><th className="pr-3">Цвет</th><th className="pr-3">Размер (ES)</th><th className="pr-3">SKU</th>
              <th className="pr-3">Остаток</th><th className="pr-3">Цена (за ед.)</th>
              <th className="pr-3" title="Если задана — сайт продаёт по этой цене вместо обычной">Акционная цена</th>
              <th className="pr-3">Себестоимость (за ед.)</th><th>Итого</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const t = totals(g.rows);
              return (
                <Fragment key={g.pid}>
                  {g.rows.map((r) => <StockRow key={r.id} row={r} cost={costs[r.product_id]} />)}
                  <SumRow label={`Итого: ${g.name}`} t={t} className="bg-cream-deep/60" />
                </Fragment>
              );
            })}
            {groups.length > 0 && <SumRow label="ИТОГО ПО СКЛАДУ" t={grand} className="border-t-2 bg-accent/40 font-semibold" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SumRow({ label, t, className }: { label: string; t: { qty: number; total: number; supplier: number }; className?: string }) {
  return (
    <tr className={`border-b ${className ?? ""}`}>
      <td colSpan={9} className="py-2 pr-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="font-medium">{label}</span>
          <span>{t.qty} шт</span>
          <span>Итого: {eur(t.total)}</span>
          <span>К поставщику: {eur(t.supplier)}</span>
          <span>Потенциальная прибыль: {eur(t.total - t.supplier)}</span>
        </div>
      </td>
    </tr>
  );
}

function StockRow({ row, cost }: { row: Row; cost: number | undefined }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(String(row.stock ?? 0));
  const [promo, setPromo] = useState(fromCents(row.price_override_cents));
  const [costV, setCostV] = useState(fromCents(cost));
  const [prevCost, setPrevCost] = useState(cost);
  if (prevCost !== cost) { setPrevCost(cost); setCostV(fromCents(cost)); }
  const [saving, setSaving] = useState(false);
  const stock = row.stock ?? 0;
  const tone = stock === 0 ? "bg-destructive/15" : stock < 3 ? "bg-yellow-100 dark:bg-yellow-900/30" : "";
  const patch = (fn: (d: Data) => Data) => qc.setQueryData<Data>(KEY, (old) => (old ? fn(old) : old));
  const updRow = (p: Partial<Row>) => patch((d) => ({ ...d, rows: d.rows.map((r) => (r.id === row.id ? { ...r, ...p } : r)) }));

  const save = async () => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Остаток должен быть целым числом ≥ 0");
      setValue(String(stock));
      return;
    }
    if (n === row.stock) return;
    setSaving(true);
    const { error } = await supabase.from("product_variants").update({ stock: n }).eq("id", row.id);
    setSaving(false);
    if (error) { toast.error("Не удалось сохранить"); setValue(String(stock)); return; }
    updRow({ stock: n });
    toast.success(`Сохранено: ${row.variant_sku} → ${n}`);
  };

  const savePromo = async () => {
    const c = toCents(promo);
    if (c === "invalid") { toast.error("Неверная цена"); setPromo(fromCents(row.price_override_cents)); return; }
    if (c === row.price_override_cents) return;
    setSaving(true);
    const { error } = await supabase.from("product_variants").update({ price_override_cents: c }).eq("id", row.id);
    setSaving(false);
    if (error) { toast.error("Не удалось сохранить"); setPromo(fromCents(row.price_override_cents)); return; }
    updRow({ price_override_cents: c });
    setPromo(fromCents(c));
    toast.success(c == null ? `${row.variant_sku}: акция снята` : `${row.variant_sku}: акционная цена ${eur(c)}`);
  };

  const saveCost = async () => {
    const c = toCents(costV);
    if (c === "invalid" || c == null) {
      if (c === "invalid" || cost != null) toast.error("Себестоимость должна быть числом ≥ 0");
      setCostV(fromCents(cost));
      return;
    }
    if (c === cost) return;
    setSaving(true);
    const { error } = await supabase.from("product_costs").upsert({ product_id: row.product_id, cost_cents: c }, { onConflict: "product_id" });
    setSaving(false);
    if (error) { toast.error("Не удалось сохранить"); setCostV(fromCents(cost)); return; }
    patch((d) => ({ ...d, costs: { ...d.costs, [row.product_id]: c } }));
    toast.success(`Себестоимость «${row.product?.name}» → ${eur(c)}`);
  };

  const price = row.price_override_cents ?? row.product?.price_cents ?? 0;
  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && e.currentTarget.blur();

  return (
    <tr className={`border-b ${tone}`}>
      <td className="py-1.5 pr-3">{row.product?.name}</td>
      <td className="pr-3">{row.color?.name}</td>
      <td className="pr-3">{formatSizeEs(row.size)}</td>
      <td className="pr-3 font-mono text-xs">{row.variant_sku}</td>
      <td className="pr-3">
        <div className="flex items-center gap-2">
          <Input type="number" min={0} value={value} disabled={saving} onChange={(e) => setValue(e.target.value)} onBlur={save} onKeyDown={enter} className="h-8 w-20" />
          {stock === 0 && <span className="text-xs font-medium text-destructive">Agotado</span>}
        </div>
      </td>
      <td className="pr-3">{eur(row.product?.price_cents ?? 0)}</td>
      <td className="pr-3">
        <Input inputMode="decimal" placeholder="—" title="Если задана — сайт продаёт по этой цене вместо обычной" value={promo} disabled={saving} onChange={(e) => setPromo(e.target.value)} onBlur={savePromo} onKeyDown={enter} className="h-8 w-24" />
      </td>
      <td className="pr-3">
        <Input inputMode="decimal" placeholder="—" title="Себестоимость товара (общая для всех цветов и размеров)" value={costV} disabled={saving} onChange={(e) => setCostV(e.target.value)} onBlur={saveCost} onKeyDown={enter} className="h-8 w-24" />
      </td>
      <td>{eur(stock * price)}</td>
    </tr>
  );
}
