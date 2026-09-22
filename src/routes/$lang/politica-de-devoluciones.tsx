import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/shop/LegalPage";

export const Route = createFileRoute("/$lang/politica-de-devoluciones")({
  head: ({ params }) => legalHead("politica-de-devoluciones", params.lang),
  component: () => <LegalPage slug="politica-de-devoluciones" />,
});
