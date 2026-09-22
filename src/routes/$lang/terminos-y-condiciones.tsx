import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/shop/LegalPage";

export const Route = createFileRoute("/$lang/terminos-y-condiciones")({
  head: ({ params }) => legalHead("terminos-y-condiciones", params.lang),
  component: () => <LegalPage slug="terminos-y-condiciones" />,
});
