alter table public.orders add column if not exists stock_reserved boolean not null default false;
update public.orders set stock_reserved = true where status = 'pending_payment';

CREATE OR REPLACE FUNCTION public.create_order(_locale text, _customer jsonb, _items jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  it jsonb; v record; qty int; img text;
  lines jsonb := '[]'::jsonb; subtotal int := 0; shipping int; oid uuid; onum text;
begin
  if jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) < 1 or jsonb_array_length(_items) > 30 then
    raise exception 'INVALID_ITEMS';
  end if;
  if coalesce(length(trim(_customer->>'name')),0) < 2 or (_customer->>'email') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or (_customer->>'postalCode') !~ '^\d{5}$' or coalesce(length(trim(_customer->>'address1')),0) < 3
     or coalesce(length(trim(_customer->>'city')),0) < 2 or coalesce(length(trim(_customer->>'province')),0) < 2 then
    raise exception 'INVALID_CUSTOMER';
  end if;
  if left(_customer->>'postalCode',2) in ('07','35','38','51','52') then raise exception 'MAINLAND_ONLY'; end if;

  for it in select * from jsonb_array_elements(_items) loop
    qty := (it->>'quantity')::int;
    if qty is null or qty < 1 or qty > 10 then raise exception 'INVALID_ITEMS'; end if;
    select pv.id, pv.product_id, pv.color_id, pv.size, pv.variant_sku, pv.stock, pv.is_active,
           coalesce(pv.price_override_cents, p.price_cents) as unit_price, p.name as pname, pc.name as cname
      into v
      from product_variants pv join products p on p.id = pv.product_id
      left join product_colors pc on pc.id = pv.color_id
     where pv.id = (it->>'variantId')::uuid and p.is_active;
    if not found or not v.is_active or v.stock is null or v.stock < qty then raise exception 'VARIANT_UNAVAILABLE'; end if;
    select url into img from product_images where product_id = v.product_id
      order by (color_id = v.color_id) desc nulls last, sort_order limit 1;
    subtotal := subtotal + v.unit_price * qty;
    lines := lines || jsonb_build_object('variant_id', v.id, 'product_id', v.product_id, 'product_name', v.pname,
      'color_name', coalesce(v.cname,''), 'size', v.size, 'variant_sku', v.variant_sku, 'image_url', img,
      'unit_price_cents', v.unit_price, 'quantity', qty);
  end loop;

  shipping := case when subtotal >= 6000 then 0 else 495 end;
  insert into orders(locale, customer_name, customer_email, customer_phone, address_line1, address_line2,
    postal_code, city, province, country, notes, subtotal_cents, shipping_cents, total_cents, stock_reserved)
  values (coalesce(nullif(_locale,''),'es'), trim(_customer->>'name'), trim(_customer->>'email'),
    nullif(trim(_customer->>'phone'),''), trim(_customer->>'address1'), nullif(trim(_customer->>'address2'),''),
    _customer->>'postalCode', trim(_customer->>'city'), trim(_customer->>'province'), 'ES',
    nullif(left(trim(_customer->>'notes'),500),''), subtotal, shipping, subtotal + shipping, false)
  returning id, order_number into oid, onum;

  insert into order_items(order_id, variant_id, product_id, product_name, color_name, size, variant_sku, image_url, unit_price_cents, quantity)
  select oid, (l->>'variant_id')::uuid, (l->>'product_id')::uuid, l->>'product_name', l->>'color_name', l->>'size',
         l->>'variant_sku', l->>'image_url', (l->>'unit_price_cents')::int, (l->>'quantity')::int
    from jsonb_array_elements(lines) l;

  return jsonb_build_object('order_id', oid, 'order_number', onum, 'subtotal_cents', subtotal,
    'shipping_cents', shipping, 'total_cents', subtotal + shipping, 'lines', lines);
end $function$;

CREATE OR REPLACE FUNCTION public.mark_order_paid(_secret text, _order_id uuid, _session_id text, _payment_intent_id text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare reserved boolean;
begin
  perform private.check_rpc_secret(_secret);
  update orders set status = 'paid', stripe_session_id = _session_id, stripe_payment_intent_id = _payment_intent_id
   where id = _order_id and status = 'pending_payment'
   returning stock_reserved into reserved;
  if not found then return false; end if;
  if not reserved then
    -- Stock is only deducted once payment is confirmed. Never below zero.
    update product_variants pv set stock = greatest(0, pv.stock - s.qty)
      from (select variant_id, sum(quantity)::int qty from order_items where order_id = _order_id group by variant_id) s
     where pv.id = s.variant_id and pv.stock is not null;
    update orders set stock_reserved = true where id = _order_id;
  end if;
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.cancel_pending_order(_secret text, _order_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare reserved boolean;
begin
  perform private.check_rpc_secret(_secret);
  update orders set status = 'cancelled' where id = _order_id and status = 'pending_payment'
   returning stock_reserved into reserved;
  if not found then return false; end if;
  -- Only legacy orders (created before pay-time deduction) still hold stock.
  if reserved then
    update product_variants pv set stock = pv.stock + oi.quantity
      from order_items oi where oi.order_id = _order_id and oi.variant_id = pv.id and pv.stock is not null;
    update orders set stock_reserved = false where id = _order_id;
  end if;
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.get_order_for_email(_secret text, _order_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare r jsonb;
begin
  perform private.check_rpc_secret(_secret);
  select jsonb_build_object('order_number', o.order_number, 'customer_name', o.customer_name,
    'customer_email', o.customer_email, 'subtotal_cents', o.subtotal_cents, 'shipping_cents', o.shipping_cents,
    'total_cents', o.total_cents,
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_name', i.product_name, 'color_name', i.color_name,
       'size', i.size, 'quantity', i.quantity, 'unit_price_cents', i.unit_price_cents)) from order_items i where i.order_id = o.id), '[]'::jsonb))
    into r from orders o where o.id = _order_id;
  return r;
end $function$;
revoke all on function public.get_order_for_email(text, uuid) from public;
grant execute on function public.get_order_for_email(text, uuid) to anon, authenticated, service_role;