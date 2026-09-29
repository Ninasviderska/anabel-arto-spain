import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  { to: "/admin/home", label: "Главная" },
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
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (pw.length < 10) {
      toast.error("Минимум 10 символов");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("admin_change_own_password", { _new_password: pw });
      if (error) {
        if (error.message.includes("PASSWORD_TOO_SHORT")) {
          toast.error("Минимум 10 символов");
        } else if (error.message.includes("FORBIDDEN")) {
          toast.error("Недостаточно прав");
        } else {
          toast.error(`Не удалось сменить пароль: ${error.message}`);
        }
        return;
      }
      toast.success("Пароль изменён");
      setPw("");
      setShowPassword(false);
      setOpen(false);
    } catch (e) {
      toast.error(`Не удалось сменить пароль: ${e instanceof Error ? e.message : "неизвестная ошибка"}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Сменить пароль</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Новый пароль</DialogTitle></DialogHeader>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="Минимум 10 символов" className="pr-11" />
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} title={showPassword ? "Скрыть пароль" : "Показать пароль"} className="absolute right-1 top-1/2 size-8 -translate-y-1/2">
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        <Button onClick={save} disabled={saving}>Сохранить</Button>
      </DialogContent>
    </Dialog>
  );
}
