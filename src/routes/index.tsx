import { createFileRoute, redirect } from "@tanstack/react-router";
import { defaultLocale } from "@/i18n/config";

// The storefront lives under /{lang}; the bare root redirects to the default locale.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/$lang", params: { lang: defaultLocale }, statusCode: 301 });
  },
});
