import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/shop/LegalPage";

export const Route = createFileRoute("/$lang/aviso-legal")({
  head: ({ params }) => legalHead("aviso-legal", params.lang),
  component: () => <LegalPage slug="aviso-legal" />,
});
