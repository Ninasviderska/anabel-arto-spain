import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/shop/LegalPage";

export const Route = createFileRoute("/$lang/politica-de-cookies")({
  head: ({ params }) => legalHead("politica-de-cookies", params.lang),
  component: () => <LegalPage slug="politica-de-cookies" />,
});
