import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HOME_BLOCKS, homeDefaults, type Align, type HomeRow } from "@/lib/home-content";

export const Route = createFileRoute("/admin/home")({
  component: HomeTab,
});

function HomeTab() {
  const q = useQuery({
    queryKey: ["admin-home"],
    queryFn: async () => {
      const { data, error } = await supabase.from("home_content").select("key, content, align");
      if (error) throw error;
      return data as HomeRow[];
    },
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  if (!q.data) return <p className="text-sm text-destructive">Не удалось загрузить тексты.</p>;
  const defs = homeDefaults();
  return (
    <div className="max-w-3xl space-y-6">
      {HOME_BLOCKS.map((b) => {
        const row = q.data.find((r) => r.key === b.key);
        return (
          <BlockForm
            key={b.key}
            blockKey={b.key}
            label={b.label}
            alignable={b.alignable}
            multiline={b.multiline}
            initialText={row?.content || defs[b.key]}
            initialAlign={(row?.align as Align | null) ?? "left"}
          />
        );
      })}
    </div>
  );
}

function BlockForm(p: { blockKey: string; label: string; alignable: boolean; multiline: boolean; initialText: string; initialAlign: Align }) {
  const qc = useQueryClient();
  const [text, setText] = useState(p.initialText);
  const [align, setAlign] = useState<Align>(p.initialAlign);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!text.trim()) return toast.error("Текст не может быть пустым");
    setSaving(true);
    const { error } = await supabase
      .from("home_content")
      .upsert({ key: p.blockKey, content: text.trim(), align: p.alignable ? align : null });
    setSaving(false);
    if (error) return toast.error(`Не удалось сохранить: ${error.message}`);
    toast.success("Сохранено");
    qc.invalidateQueries({ queryKey: ["admin-home"] });
    qc.invalidateQueries({ queryKey: ["home-content"] });
    return null;
  };
  return (
    <div className="space-y-2 rounded-sm border p-4">
      <Label>{p.label}</Label>
      {p.multiline ? (
        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      )}
      <div className="flex flex-wrap items-center gap-3">
        {p.alignable && (
          <select
            className="h-9 rounded-sm border bg-background px-2 text-sm"
            value={align}
            onChange={(e) => setAlign(e.target.value as Align)}
          >
            <option value="left">По левому краю</option>
            <option value="center">По центру</option>
            <option value="right">По правому краю</option>
          </select>
        )}
        <Button size="sm" onClick={save} disabled={saving}>Сохранить</Button>
      </div>
    </div>
  );
}
