import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/shop/LegalPage";

export const Route = createFileRoute("/$lang/politica-de-privacidad")({
  head: ({ params }) => legalHead("politica-de-privacidad", params.lang),
  component: () => <LegalPage slug="politica-de-privacidad" />,
});
