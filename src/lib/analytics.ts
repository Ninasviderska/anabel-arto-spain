// Google Analytics 4 (gtag.js) — cargado una única vez por sesión.
// Script asíncrono insertado en <head>; SPA: enviamos page_view en cada navegación.

const GA_MEASUREMENT_ID = "G-GYB34527ZG";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialPageViewSent = false;

export function initGtag() {
  if (typeof window === "undefined" || window.gtag) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
  initialPageViewSent = true;
}

/** Envía page_view en las navegaciones internas (SPA), evitando duplicar la carga inicial. */
export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  if (initialPageViewSent) {
    initialPageViewSent = false;
    return;
  }
  window.gtag("event", "page_view", { page_path: path });
}
