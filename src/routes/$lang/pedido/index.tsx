import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Lock } from "lucide-react";
import { getDictionary, useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { createOrder } from "@/lib/orders.functions";
import { pageMeta } from "@/lib/seo";
import { SPANISH_PROVINCES } from "@/lib/provinces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/$lang/pedido/")({
  head: ({ params }) => {
    const d = getDictionary("es");
    return {
      meta: pageMeta({
        title: `${d.checkout.title} — ${d.brand.name}`,
        description: d.brand.description,
        path: `/${params.lang}/pedido`,
        noindex: true,
      }),
    };
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { locale, d } = useI18n();
  const e = d.checkout.errors;
  const cart = useCart();
  const navigate = useNavigate();
  const submitOrder = useServerFn(createOrder);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().trim().min(2, e.required),
    email: z.string().trim().email(e.email),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{6,18}$/, e.phone),
    address1: z.string().trim().min(3, e.required),
    address2: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().regex(/^\d{5}$/, e.postalCode),
    city: z.string().trim().min(2, e.required),
    province: z.string().min(2, e.required),
    notes: z.string().trim().max(500).optional(),
    terms: z.literal(true, { errorMap: () => ({ message: e.terms }) }),
  });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", address1: "", address2: "", postalCode: "", city: "", province: "", notes: "" },
  });
  const { register, handleSubmit, setValue, watch, formState } = form;
  const terms = watch("terms");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { terms: _t, ...customer } = values;
      const result = await submitOrder({
        data: {
          locale,
          customer: { ...customer, address2: customer.address2 ?? "", notes: customer.notes ?? "" },
          items: cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        },
      });
      cart.clear();
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      navigate({ to: "/$lang/pedido/gracias", params: { lang: locale }, search: { n: result.orderNumber } });
    } catch (err) {
      console.error(err);
      setServerError(e.generic);
    }
  };

  if (cart.hydrated && cart.items.length === 0) {
    return (
      <div className="container-shop py-20 text-center">
        <h1 className="font-display text-4xl">{d.checkout.title}</h1>
        <p className="mt-4 text-muted-foreground">{d.cart.empty}</p>
        <Button asChild variant="hero" className="mt-6">
          <Link to="/$lang/catalogo" params={{ lang: locale }} search={{}}>
            {d.cart.emptyCta}
          </Link>
        </Button>
      </div>
    );
  }

  const field = (name: keyof FormValues, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...props} {...register(name)} aria-invalid={Boolean(formState.errors[name])} />
      {formState.errors[name] && <p className="text-xs text-destructive">{formState.errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <div className="container-shop py-10 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl">{d.checkout.title}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-12">
          <section>
            <h2 className="eyebrow mb-6">{d.checkout.contact}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">{field("name", d.checkout.name, { autoComplete: "name" })}</div>
              {field("email", d.checkout.email, { type: "email", autoComplete: "email", inputMode: "email" })}
              {field("phone", d.checkout.phone, { type: "tel", autoComplete: "tel", inputMode: "tel" })}
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-2">{d.checkout.shippingAddress}</h2>
            <p className="mb-6 text-xs text-muted-foreground">{d.checkout.spainOnly}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">{field("address1", d.checkout.address1, { autoComplete: "address-line1" })}</div>
              <div className="sm:col-span-2">{field("address2", d.checkout.address2, { autoComplete: "address-line2" })}</div>
              {field("postalCode", d.checkout.postalCode, { inputMode: "numeric", maxLength: 5, autoComplete: "postal-code" })}
              {field("city", d.checkout.city, { autoComplete: "address-level2" })}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="province">{d.checkout.province}</Label>
                <select
                  id="province"
                  {...register("province")}
                  className="flex h-10 w-full rounded-sm border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">—</option>
                  {SPANISH_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {formState.errors.province && <p className="text-xs text-destructive">{formState.errors.province.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">{d.checkout.notes}</Label>
                <Textarea id="notes" rows={3} {...register("notes")} />
              </div>
            </div>
          </section>

          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={terms === true} onCheckedChange={(v) => setValue("terms", v === true ? true : (false as unknown as true), { shouldValidate: formState.isSubmitted })} />
            <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
              {d.checkout.acceptTerms.split(/\{terms\}|\{privacy\}/)[0]}
              <Link to="/$lang/terminos-y-condiciones" params={{ lang: locale }} className="underline underline-offset-4">
                {d.legal.pages["terminos-y-condiciones"].title.toLowerCase()}
              </Link>
              {" y la "}
              <Link to="/$lang/politica-de-privacidad" params={{ lang: locale }} className="underline underline-offset-4">
                {d.legal.pages["politica-de-privacidad"].title.toLowerCase()}
              </Link>
              .
            </Label>
          </div>
          {formState.errors.terms && <p className="-mt-8 text-xs text-destructive">{formState.errors.terms.message}</p>}
        </div>

        <aside className="h-fit rounded-sm bg-cream-deep p-6 lg:sticky lg:top-28">
          <h2 className="eyebrow mb-5">{d.checkout.summary}</h2>
          <ul className="space-y-4">
            {cart.items.map((item) => (
              <li key={item.variantId} className="flex gap-3 text-sm">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" width={56} height={70} loading="lazy" className="aspect-[4/5] w-14 rounded-sm object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-display text-base leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.colorName} · {item.size} × {item.quantity}
                  </p>
                </div>
                <p>{formatPrice(item.unitPriceCents * item.quantity, locale)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{d.cart.subtotal}</dt>
              <dd>{formatPrice(cart.subtotalCents, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{d.cart.shipping}</dt>
              <dd>{cart.shippingCents === 0 ? d.cart.shippingFree : formatPrice(cart.shippingCents, locale)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <dt>{d.cart.total}</dt>
              <dd className="font-medium">{formatPrice(cart.totalCents, locale)}</dd>
            </div>
          </dl>
          {serverError && <p className="mt-4 text-xs text-destructive">{serverError}</p>}
          <Button type="submit" variant="hero" size="lg" className="mt-6 w-full" disabled={formState.isSubmitting || !cart.hydrated}>
            {formState.isSubmitting ? d.checkout.paying : d.checkout.payButton}
          </Button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> {d.checkout.secure}
          </p>
        </aside>
      </form>
    </div>
  );
}
