import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  size: string;
  variant_sku: string;
  stock: number | null;
  price_override_cents: number | null;
  sort_order: number;
  product: { name: string; price_cents: number } | null;
  color: { name: string } | null;
};

function StockTab() {
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["admin-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, size, variant_sku, stock, price_override_cents, sort_order, product:products(name, price_cents), color:product_colors(name)")
        .order("variant_sku");
      if (error) throw error;
      return data as unknown as Row[];
    },
  });
  const term = search.trim().toLowerCase();
  const rows = (q.data ?? []).filter(
    (r) => !term || r.variant_sku.toLowerCase().includes(term) || (r.product?.name ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-4">
      <Input placeholder="Поиск по названию или SKU" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      {q.isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
      {q.isError && <p className="text-sm text-destructive">Не удалось загрузить остатки.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b"><th className="py-2 pr-3">Товар</th><th className="pr-3">Цвет</th><th className="pr-3">Размер</th><th className="pr-3">SKU</th><th className="pr-3">Остаток</th><th>Цена</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => <StockRow key={r.id} row={r} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockRow({ row }: { row: Row }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(String(row.stock ?? 0));
  const [saving, setSaving] = useState(false);
  const stock = row.stock ?? 0;
  const tone = stock === 0 ? "bg-destructive/15" : stock < 3 ? "bg-yellow-100 dark:bg-yellow-900/30" : "";

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
    if (error) {
      toast.error("Не удалось сохранить");
      setValue(String(stock));
      return;
    }
    qc.setQueryData<Row[]>(["admin-stock"], (old) => old?.map((r) => (r.id === row.id ? { ...r, stock: n } : r)));
    toast.success(`Сохранено: ${row.variant_sku} → ${n}`);
  };

  return (
    <tr className={`border-b ${tone}`}>
      <td className="py-1.5 pr-3">{row.product?.name}</td>
      <td className="pr-3">{row.color?.name}</td>
      <td className="pr-3">{formatSizeEs(row.size)}</td>
      <td className="pr-3 font-mono text-xs">{row.variant_sku}</td>
      <td className="pr-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={value}
            disabled={saving}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            className="h-8 w-20"
          />
          {stock === 0 && <span className="text-xs font-medium text-destructive">Agotado</span>}
        </div>
      </td>
      <td>{formatPrice(row.price_override_cents ?? row.product?.price_cents ?? 0, "es")}</td>
    </tr>
  );
}
