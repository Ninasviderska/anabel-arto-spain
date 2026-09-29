import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const changeAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { password: string }) =>
    z.object({ password: z.string().min(10).max(256) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const token = getRequest().headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) throw new Error("Unauthorized");

    // Check the live account, not just the bearer token claims, before using elevated access.
    const { data: identity, error: identityError } = await context.supabase.auth.getUser(token);
    if (identityError || identity.user?.id !== context.userId) throw new Error("Unauthorized");

    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    // Import the elevated client only inside this authorized server handler.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.password,
    });
    if (error) throw new Error("Не удалось сменить пароль. Проверьте настройку сервера и попробуйте ещё раз.");
    return { ok: true };
  });