create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create extension if not exists pgcrypto with schema extensions;

create table if not exists private.app_config (key text primary key, value text not null);
insert into private.app_config(key, value)
values ('order_rpc_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create or replace function private.check_rpc_secret(_secret text)
returns void language plpgsql stable security definer set search_path = private, public as $$
begin
  if _secret is null or not exists (select 1 from private.app_config where key='order_rpc_secret' and value=_secret) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
end $$;

create or replace function public.create_order(_locale text, _customer jsonb, _items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it jsonb; v record; qty int; unit int; img text;
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
  -- mainland Spain only (no Baleares 07, Canarias 35/38, Ceuta 51, Melilla 52)
  if left(_customer->>'postalCode',2) in ('07','35','38','51','52') then raise exception 'MAINLAND_ONLY'; end if;

  for it in select * from jsonb_array_elements(_items) loop
    qty := (it->>'quantity')::int;
    if qty is null or qty < 1 or qty > 10 then raise exception 'INVALID_ITEMS'; end if;
    select pv.id, pv.product_id, pv.color_id, pv.size, pv.variant_sku,
           coalesce(pv.price_override_cents, p.price_cents) as unit_price, p.name as pname, pc.name as cname
      into v
      from product_variants pv join products p on p.id = pv.product_id
      left join product_colors pc on pc.id = pv.color_id
     where pv.id = (it->>'variantId')::uuid and p.is_active;
    if not found then raise exception 'VARIANT_UNAVAILABLE'; end if;
    update product_variants set stock = stock - qty
     where id = v.id and is_active and stock is not null and stock >= qty;
    if not found then raise exception 'VARIANT_UNAVAILABLE'; end if;
    select url into img from product_images where product_id = v.product_id
      order by (color_id = v.color_id) desc nulls last, sort_order limit 1;
    subtotal := subtotal + v.unit_price * qty;
    lines := lines || jsonb_build_object('variant_id', v.id, 'product_id', v.product_id, 'product_name', v.pname,
      'color_name', coalesce(v.cname,''), 'size', v.size, 'variant_sku', v.variant_sku, 'image_url', img,
      'unit_price_cents', v.unit_price, 'quantity', qty);
  end loop;

  shipping := case when subtotal >= 6000 then 0 else 495 end;
  insert into orders(locale, customer_name, customer_email, customer_phone, address_line1, address_line2,
    postal_code, city, province, country, notes, subtotal_cents, shipping_cents, total_cents)
  values (coalesce(nullif(_locale,''),'es'), trim(_customer->>'name'), trim(_customer->>'email'),
    nullif(trim(_customer->>'phone'),''), trim(_customer->>'address1'), nullif(trim(_customer->>'address2'),''),
    _customer->>'postalCode', trim(_customer->>'city'), trim(_customer->>'province'), 'ES',
    nullif(left(trim(_customer->>'notes'),500),''), subtotal, shipping, subtotal + shipping)
  returning id, order_number into oid, onum;

  insert into order_items(order_id, variant_id, product_id, product_name, color_name, size, variant_sku, image_url, unit_price_cents, quantity)
  select oid, (l->>'variant_id')::uuid, (l->>'product_id')::uuid, l->>'product_name', l->>'color_name', l->>'size',
         l->>'variant_sku', l->>'image_url', (l->>'unit_price_cents')::int, (l->>'quantity')::int
    from jsonb_array_elements(lines) l;

  return jsonb_build_object('order_id', oid, 'order_number', onum, 'subtotal_cents', subtotal,
    'shipping_cents', shipping, 'total_cents', subtotal + shipping, 'lines', lines);
end $$;

create or replace function public.attach_order_session(_secret text, _order_id uuid, _session_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.check_rpc_secret(_secret);
  update orders set stripe_session_id = _session_id where id = _order_id and status = 'pending_payment';
end $$;

create or replace function public.mark_order_paid(_secret text, _order_id uuid, _session_id text, _payment_intent_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  perform private.check_rpc_secret(_secret);
  update orders set status = 'paid', stripe_session_id = _session_id, stripe_payment_intent_id = _payment_intent_id
   where id = _order_id and status = 'pending_payment';
  return found;
end $$;

create or replace function public.cancel_pending_order(_secret text, _order_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  perform private.check_rpc_secret(_secret);
  update orders set status = 'cancelled' where id = _order_id and status = 'pending_payment';
  if not found then return false; end if;
  update product_variants pv set stock = pv.stock + oi.quantity
    from order_items oi where oi.order_id = _order_id and oi.variant_id = pv.id and pv.stock is not null;
  return true;
end $$;

create or replace function public.list_stale_orders(_secret text, _max_age_minutes int)
returns table(id uuid, stripe_session_id text) language plpgsql stable security definer set search_path = public as $$
begin
  perform private.check_rpc_secret(_secret);
  return query select o.id, o.stripe_session_id from orders o
   where o.status = 'pending_payment' and o.created_at < now() - make_interval(mins => greatest(_max_age_minutes, 15))
   order by o.created_at limit 50;
end $$;

create or replace function public.get_order_payment_ref(_secret text, _order_id uuid)
returns table(order_number text, stripe_session_id text) language plpgsql stable security definer set search_path = public as $$
begin
  perform private.check_rpc_secret(_secret);
  return query select o.order_number, o.stripe_session_id from orders o where o.id = _order_id;
end $$;

create or replace function public.lookup_order_status(_order_number text, _email text)
returns table(order_number text, status text, created_at timestamptz, total_cents int, tracking_number text, tracking_url text)
language sql stable security definer set search_path = public as $$
  select o.order_number, o.status::text, o.created_at, o.total_cents, o.tracking_number, o.tracking_url
    from orders o
   where o.order_number = upper(trim(_order_number)) and lower(o.customer_email) = lower(trim(_email))
   limit 1;
$$;

revoke all on function private.check_rpc_secret(text) from public, anon, authenticated;
revoke all on function public.create_order(text, jsonb, jsonb), public.attach_order_session(text, uuid, text),
  public.mark_order_paid(text, uuid, text, text), public.cancel_pending_order(text, uuid),
  public.list_stale_orders(text, int), public.get_order_payment_ref(text, uuid), public.lookup_order_status(text, text) from public;
grant execute on function public.create_order(text, jsonb, jsonb), public.attach_order_session(text, uuid, text),
  public.mark_order_paid(text, uuid, text, text), public.cancel_pending_order(text, uuid),
  public.list_stale_orders(text, int), public.get_order_payment_ref(text, uuid), public.lookup_order_status(text, text)
  to anon, authenticated, service_role;
revoke execute on function public.reserve_variant_stock(uuid, int), public.release_variant_stock(uuid, int) from public, anon, authenticated;