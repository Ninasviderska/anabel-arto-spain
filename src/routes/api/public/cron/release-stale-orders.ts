import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { releaseStaleOrders } from "@/lib/order-payments.server";

export const Route = createFileRoute("/api/public/cron/release-stale-orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        return Response.json(await releaseStaleOrders(60));
      },
    },
  },
});
