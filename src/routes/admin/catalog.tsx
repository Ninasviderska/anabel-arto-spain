import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/catalog")({
  component: CatalogTab,
});

type Cat = { id: string; name: string; description: string | null; seo_text: string | null; parent_id: string | null; sort_order: number };
type Prod = {
  id: string; name: string; sku: string; category_id: string; description: string | null;
  seo_title: string | null; seo_description: string | null; seo_text: string | null; price_cents: number;
};
type Sel = { kind: "cat"; id: string } | { kind: "prod"; id: string } | null;

function CatalogTab() {
  const [sel, setSel] = useState<Sel>(null);
  const q = useQuery({
    queryKey: ["admin-catalog"],
    queryFn: async () => {
      const [c, p] = await Promise.all([
        supabase.from("categories").select("id, name, description, seo_text, parent_id, sort_order").order("sort_order"),
        supabase.from("products").select("id, name, sku, category_id, description, seo_title, seo_description, seo_text, price_cents").order("name"),
      ]);
      if (c.error) throw c.error;
      if (p.error) throw p.error;
      return { cats: c.data as Cat[], prods: p.data as Prod[] };
    },
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  if (!q.data) return <p className="text-sm text-destructive">Не удалось загрузить каталог.</p>;
  const { cats, prods } = q.data;
  const roots = cats.filter((c) => !c.parent_id);
  const item = (active: boolean) => `block w-full rounded-sm px-2 py-1 text-left text-sm hover:bg-accent ${active ? "bg-accent font-medium" : ""}`;

  const renderCat = (c: Cat, depth: number): React.ReactNode => (
    <li key={c.id}>
      <button type="button" className={item(sel?.kind === "cat" && sel.id === c.id)} style={{ paddingLeft: 8 + depth * 14 }} onClick={() => setSel({ kind: "cat", id: c.id })}>
        📁 {c.name}
      </button>
      <ul>
        {cats.filter((s) => s.parent_id === c.id).map((s) => renderCat(s, depth + 1))}
        {prods.filter((p) => p.category_id === c.id).map((p) => (
          <li key={p.id}>
            <button type="button" className={item(sel?.kind === "prod" && sel.id === p.id)} style={{ paddingLeft: 8 + (depth + 1) * 14 }} onClick={() => setSel({ kind: "prod", id: p.id })}>
              {p.name} <span className="text-xs text-muted-foreground">{p.sku}</span>
            </button>
          </li>
        ))}
      </ul>
    </li>
  );

  const cat = sel?.kind === "cat" ? cats.find((c) => c.id === sel.id) : undefined;
  const prod = sel?.kind === "prod" ? prods.find((p) => p.id === sel.id) : undefined;

  return (
    <div className="grid gap-6 md:grid-cols-[20rem_1fr]">
      <ul className="max-h-[75vh] overflow-y-auto rounded-sm border p-2">{roots.map((c) => renderCat(c, 0))}</ul>
      <div>
        {!sel && <p className="text-sm text-muted-foreground">Выберите категорию или товар слева.</p>}
        {cat && <CategoryForm key={cat.id} cat={cat} />}
        {prod && <ProductForm key={prod.id} prod={prod} />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function CategoryForm({ cat }: { cat: Cat }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: cat.name, description: cat.description ?? "", seo_text: cat.seo_text ?? "" });
  const [saving, setSaving] = useState(false);
  const save = async (): Promise<unknown> => {
    if (!f.name.trim()) return toast.error("Название не может быть пустым");
    setSaving(true);
    const { error } = await supabase.from("categories").update({ name: f.name.trim(), description: f.description || null, seo_text: f.seo_text || null }).eq("id", cat.id);
    setSaving(false);
    if (error) return toast.error("Не удалось сохранить");
    toast.success("Категория сохранена");
    qc.invalidateQueries({ queryKey: ["admin-catalog"] });
  };
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Категория</h2>
      <Field label="Название (name)"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Описание (description)"><Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="SEO-текст (seo_text)"><Textarea rows={10} value={f.seo_text} onChange={(e) => setF({ ...f, seo_text: e.target.value })} /></Field>
      <Button onClick={save} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
    </div>
  );
}

function ProductForm({ prod }: { prod: Prod }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: prod.name, description: prod.description ?? "", seo_title: prod.seo_title ?? "",
    seo_description: prod.seo_description ?? "", seo_text: prod.seo_text ?? "", price: (prod.price_cents / 100).toFixed(2),
  });
  const [saving, setSaving] = useState(false);
  const save = async (): Promise<unknown> => {
    const cents = Math.round(Number(f.price.replace(",", ".")) * 100);
    if (!f.name.trim()) return toast.error("Название не может быть пустым");
    if (!Number.isFinite(cents) || cents <= 0) return toast.error("Неверная цена");
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name: f.name.trim(), description: f.description || null, seo_title: f.seo_title || null,
      seo_description: f.seo_description || null, seo_text: f.seo_text || null, price_cents: cents,
    }).eq("id", prod.id);
    setSaving(false);
    if (error) return toast.error("Не удалось сохранить");
    toast.success("Товар сохранён");
    qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    qc.invalidateQueries({ queryKey: ["admin-stock"] });
  };
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Товар <span className="text-base text-muted-foreground">{prod.sku}</span></h2>
      <Field label="Название (name)"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Цена, € с НДС (price)"><Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className="max-w-40" /></Field>
      <Field label="Описание (description)"><Textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="SEO title"><Input value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} /></Field>
      <Field label="SEO description"><Textarea rows={3} value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} /></Field>
      <Field label="SEO-текст (seo_text)"><Textarea rows={10} value={f.seo_text} onChange={(e) => setF({ ...f, seo_text: e.target.value })} /></Field>
      <Button onClick={save} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
    </div>
  );
}
