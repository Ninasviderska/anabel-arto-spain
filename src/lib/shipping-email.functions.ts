import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendOrderShippedEmail } from "./email.server";

/** Admin-only: emails the customer that their order shipped, using the tracking number stored in the DB. */
export const sendShippedEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("FORBIDDEN");
    const { data: o, error } = await supabase
      .from("orders")
      .select("order_number, customer_name, customer_email, tracking_number")
      .eq("id", data.orderId)
      .single();
    if (error || !o) throw new Error("ORDER_NOT_FOUND");
    if (!o.tracking_number?.trim()) throw new Error("NO_TRACKING");
    return sendOrderShippedEmail({ ...o, tracking_number: o.tracking_number.trim() });
  });
