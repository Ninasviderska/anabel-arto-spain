CREATE OR REPLACE FUNCTION public.get_order_status_public(_order_number text, _email text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
declare r jsonb;
begin
  if coalesce(length(trim(_order_number)),0) < 3 or coalesce(length(trim(_email)),0) < 3 then return null; end if;
  select jsonb_build_object('order_number', o.order_number, 'status', o.status::text, 'created_at', o.created_at,
    'subtotal_cents', o.subtotal_cents, 'shipping_cents', o.shipping_cents, 'total_cents', o.total_cents,
    'tracking_number', o.tracking_number, 'tracking_url', o.tracking_url,
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_name', i.product_name, 'color_name', i.color_name,
       'size', i.size, 'quantity', i.quantity, 'unit_price_cents', i.unit_price_cents, 'image_url', i.image_url) order by i.product_name)
       from order_items i where i.order_id = o.id), '[]'::jsonb))
  into r from orders o
  where o.order_number = upper(trim(_order_number)) and lower(o.customer_email) = lower(trim(_email))
  limit 1;
  return r;
end $$;
REVOKE ALL ON FUNCTION public.get_order_status_public(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_status_public(text, text) TO anon, authenticated, service_role;