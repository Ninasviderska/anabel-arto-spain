import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Админ-панель — Anabel Arto" },
      { name: "description", content: "Панель управления магазином Anabel Arto." },
      { property: "og:title", content: "Админ-панель — Anabel Arto" },
      { property: "og:description", content: "Панель управления магазином Anabel Arto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    if (location.pathname.startsWith("/admin/login")) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    if (!isAdmin) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Продажи" },
  { to: "/admin/stock", label: "Остатки" },
  { to: "/admin/catalog", label: "Каталог" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const isLogin = useLocation({ select: (l) => l.pathname.startsWith("/admin/login") });
  if (isLogin) return <Outlet />;
  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-cream-deep">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-display text-xl">Anabel Arto · Админ</span>
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: true }}
                className="rounded-sm px-3 py-1.5 text-sm hover:bg-accent"
                activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex gap-2">
            <ChangePassword />
            <Button variant="outline" size="sm" onClick={logout}>Выйти</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6"><Outlet /></main>
    </div>
  );
}

function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (): Promise<unknown> => {
    if (pw.length < 10) return toast.error("Минимум 10 символов");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error(`Не удалось сменить пароль: ${error.message}`);
    toast.success("Пароль изменён");
    setPw("");
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Сменить пароль</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Новый пароль</DialogTitle></DialogHeader>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="Минимум 10 символов" />
        <Button onClick={save} disabled={saving}>Сохранить</Button>
      </DialogContent>
    </Dialog>
  );
}
