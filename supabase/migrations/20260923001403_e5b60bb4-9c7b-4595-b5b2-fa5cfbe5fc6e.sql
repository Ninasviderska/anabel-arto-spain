delete from public.order_items;
delete from public.orders;
delete from public.product_variants;
delete from public.product_images;
delete from public.product_colors;
delete from public.products;

insert into public.suppliers (code, name, country, is_dropshipping)
select 'own_stock_ukraine', 'Stock propio (Ucrania)', 'UA', false
where not exists (select 1 from public.suppliers where code = 'own_stock_ukraine');

update public.categories set size_type = 'numeric' where slug in ('picardias','camisones','batas');

create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_cents integer not null check (cost_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.product_costs to service_role;
alter table public.product_costs enable row level security;
-- Intentionally no policies: purchase costs are internal-only data, reachable
-- solely through privileged server-side access (like public.orders).

create or replace function public.reserve_variant_stock(_variant_id uuid, _qty integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  ok boolean;
begin
  update public.product_variants
     set stock = stock - _qty
   where id = _variant_id
     and is_active
     and stock is not null
     and stock >= _qty
  returning true into ok;
  return coalesce(ok, false);
end;
$fn$;

create or replace function public.release_variant_stock(_variant_id uuid, _qty integer)
returns void
language sql
security definer
set search_path = public
as $fn$
  update public.product_variants set stock = stock + _qty where id = _variant_id;
$fn$;

revoke all on function public.reserve_variant_stock(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_variant_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.reserve_variant_stock(uuid, integer) to service_role;
grant execute on function public.release_variant_stock(uuid, integer) to service_role;

with raw as (
  select $j${"7008-6734": {"type": "\u0445\u0430\u043b\u0430\u0442", "price_retail_eur": 74.95, "cost_in_eur": 21.52, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "40", "qty": 2}, {"size": "42", "qty": 2}, {"size": "44", "qty": 1}, {"size": "46", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/7008-6734_005-800x1200-2.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/7008-6734_006-800x1200-1.jpg"]}}}, "7017-010": {"type": "\u0431\u044e\u0441\u0442\u0433\u0430\u043b\u044c\u0442\u0435\u0440", "price_retail_eur": 39.95, "cost_in_eur": 10.64, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "B 70", "qty": 2}, {"size": "B 75", "qty": 2}, {"size": "B 80", "qty": 1}, {"size": "B 85", "qty": 2}, {"size": "C 70", "qty": 2}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/7017-010_013-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/7017-010_016-800x1200-1.jpg"]}, "\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "B 70", "qty": 1}, {"size": "B 75", "qty": 1}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 2}, {"size": "C 70", "qty": 2}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-010_012-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-010_011-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "B 70", "qty": 2}, {"size": "B 75", "qty": 1}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 2}, {"size": "C 70", "qty": 2}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-010_018-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-010_017-800x1200-1.jpg"]}}}, "7017-011": {"type": "\u0431\u044e\u0441\u0442\u0433\u0430\u043b\u044c\u0442\u0435\u0440", "price_retail_eur": 44.95, "cost_in_eur": 11.92, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "B 80", "qty": 1}, {"size": "B 85", "qty": 2}, {"size": "B 90", "qty": 2}, {"size": "C 75", "qty": 1}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}, {"size": "C 90", "qty": 2}, {"size": "D 75", "qty": 2}, {"size": "D 80", "qty": 1}, {"size": "D 85", "qty": 2}, {"size": "D 90", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/7017-011_0098-800x1200-1.jpg"]}, "\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "B 75", "qty": 1}, {"size": "B 80", "qty": 1}, {"size": "B 90", "qty": 2}, {"size": "C 75", "qty": 1}, {"size": "C 80", "qty": 1}, {"size": "C 85", "qty": 1}, {"size": "C 90", "qty": 1}, {"size": "D 75", "qty": 2}, {"size": "D 80", "qty": 1}, {"size": "D 85", "qty": 2}, {"size": "D 90", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/07/7017-011_0097-800x1200-2.jpg", "https://doloresnovias.com/wp-content/uploads/2020/07/7017-011_0099-800x1200-2.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "B 75", "qty": 2}, {"size": "B 80", "qty": 1}, {"size": "B 85", "qty": 1}, {"size": "B 90", "qty": 1}, {"size": "C 75", "qty": 1}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 1}, {"size": "C 90", "qty": 1}, {"size": "D 80", "qty": 1}, {"size": "D 85", "qty": 2}, {"size": "D 90", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/07/7017-011_0096-800x1200-2.jpg", "https://doloresnovias.com/wp-content/uploads/2020/07/7017-011_0095-800x1200-2.jpg"]}}}, "7017-20": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 19.95, "cost_in_eur": 5.36, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "36", "qty": 1}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 4}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-20_002-800x1200-2.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-20_001-800x1200-2.jpg"]}, "\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "38", "qty": 1}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-20_003-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-20_004-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 1}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-20_002-800x1200-2.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-20_001-800x1200-2.jpg"]}}}, "7017-22": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 19.95, "cost_in_eur": 6.64, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "38", "qty": 1}, {"size": "40", "qty": 2}, {"size": "42", "qty": 1}, {"size": "44", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/7017-22_002-800x1200-1.jpg"]}, "\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}, {"size": "44", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-22_004-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-22_003-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 3}, {"size": "44", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-22_006-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-22_005-800x1200-1.jpg"]}}}, "7017-30": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 19.95, "cost_in_eur": 5.36, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "38", "qty": 1}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}, {"size": "44", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/7017-30_004-800x1200-1.jpg"]}, "\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}, {"size": "44", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-30_007-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-30_006-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 1}, {"size": "44", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-30_003-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-30_002-800x1200-1.jpg"]}}}, "7017-32": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 19.95, "cost_in_eur": 5.36, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "36", "qty": 3}, {"size": "38", "qty": 2}, {"size": "40", "qty": 1}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/7017-010_016-800x1200-1.jpg"]}, "\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 3}, {"size": "40", "qty": 2}, {"size": "42", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-010_012-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-010_018-800x1200-1.jpg"]}}}, "7017-34": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 24.95, "cost_in_eur": 6.64, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "40", "qty": 1}, {"size": "44", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/7017-34_005-800x1200-1.jpg"]}, "\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "38", "qty": 2}, {"size": "44", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-34_002-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-34_001-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "42", "qty": 2}, {"size": "44", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/7017-34_004-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/7017-34_003-800x1200-1.jpg"]}}}, "7017-6017": {"type": "\u043f\u0435\u043d\u044c\u044e\u0430\u0440", "price_retail_eur": 69.95, "cost_in_eur": 18.64, "colors": {"\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/02/7017-6017_007-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 1}, {"size": "38", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/02/7017-6017_002-800x1200-1.jpg"]}}}, "7017-6732": {"type": "\u043f\u0435\u043d\u044c\u044e\u0430\u0440", "price_retail_eur": 84.95, "cost_in_eur": 22.64, "colors": {"\u0420\u043e\u0437\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/02/7017-6732_005-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/02/7017-6732_006-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 1}, {"size": "38", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/02/7017-6732_001-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/02/7017-6732_002-800x1200-1.jpg"]}}}, "8057-6097": {"type": "\u0441\u043e\u0440\u043e\u0447\u043a\u0430", "price_retail_eur": 69.95, "cost_in_eur": 19.12, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}, {"size": "44", "qty": 2}, {"size": "46", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/8057-6097_005-800x1200-1.jpg"]}}}, "8057-6732": {"type": "\u043f\u0435\u043d\u044c\u044e\u0430\u0440", "price_retail_eur": 84.95, "cost_in_eur": 22.16, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 1}, {"size": "42", "qty": 2}, {"size": "44", "qty": 2}, {"size": "46", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/6732-1_4-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/6732-1_1-800x1200-2.jpg"]}}}, "8122-001": {"type": "\u0431\u044e\u0441\u0442\u0433\u0430\u043b\u044c\u0442\u0435\u0440", "price_retail_eur": 39.95, "cost_in_eur": 10.64, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "B 70", "qty": 1}, {"size": "B 75", "qty": 2}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 1}, {"size": "C 70", "qty": 2}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-001_005-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-001_004-800x1200-1.jpg"]}, "\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "B 70", "qty": 2}, {"size": "B 75", "qty": 1}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 2}, {"size": "C 70", "qty": 2}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/8122-001_006-800x1200-1-e1640130840396.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/8122-001_007-800x1200-1-e1640130833743.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "B 70", "qty": 1}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 2}, {"size": "C 70", "qty": 2}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-001_009-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-001_008-800x1200-1.jpg"]}}}, "8122-003": {"type": "\u0431\u044e\u0441\u0442\u0433\u0430\u043b\u044c\u0442\u0435\u0440", "price_retail_eur": 39.95, "cost_in_eur": 12.24, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "B 70", "qty": 1}, {"size": "B 75", "qty": 2}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 1}, {"size": "C 70", "qty": 1}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-003_0006-800x1200-1.jpg"]}, "\u0410\u043c\u0430\u0440\u0430\u043d\u0442": {"variants": [{"size": "B 70", "qty": 1}, {"size": "B 75", "qty": 2}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-003_002-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-003_003-800x1200-1.jpg"]}, "\u0422\u0451\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439": {"variants": [{"size": "B 70", "qty": 2}, {"size": "B 75", "qty": 2}, {"size": "B 80", "qty": 2}, {"size": "B 85", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-003_005-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-003_007-800x1200-1.jpg"]}}}, "8122-007": {"type": "\u0431\u044e\u0441\u0442\u0433\u0430\u043b\u044c\u0442\u0435\u0440", "price_retail_eur": 39.95, "cost_in_eur": 10.64, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "B 70", "qty": 1}, {"size": "B 75", "qty": 1}, {"size": "B 80", "qty": 1}, {"size": "B 85", "qty": 1}, {"size": "C 75", "qty": 1}, {"size": "C 80", "qty": 1}, {"size": "C 85", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-007_008-800x1200-2.jpg"]}, "\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "B 70", "qty": 2}, {"size": "B 75", "qty": 1}, {"size": "B 80", "qty": 1}, {"size": "B 85", "qty": 2}, {"size": "C 70", "qty": 2}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/8122-007_004-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/8122-007_005-800x1200-1.jpg"]}}}, "8122-009": {"type": "\u0431\u044e\u0441\u0442\u0433\u0430\u043b\u044c\u0442\u0435\u0440", "price_retail_eur": 39.95, "cost_in_eur": 12.24, "colors": {"\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "B 70", "qty": 2}, {"size": "B 75", "qty": 2}, {"size": "B 80", "qty": 1}, {"size": "B 85", "qty": 1}, {"size": "C 75", "qty": 2}, {"size": "C 80", "qty": 2}, {"size": "C 85", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/8122-009_008-800x1200-1.jpg"]}}}, "8122-21": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 19.95, "cost_in_eur": 5.36, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 4}, {"size": "40", "qty": 4}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-21_002-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-21_001-800x1200-1.jpg"]}, "\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/8122-21_006-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/8122-21_004-800x1200-1.jpg"]}, "\u0410\u043c\u0430\u0440\u0430\u043d\u0442": {"variants": [{"size": "36", "qty": 1}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-21_0091-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-21_008-800x1200-1.jpg"]}, "\u0422\u0451\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439": {"variants": [{"size": "36", "qty": 1}, {"size": "38", "qty": 2}, {"size": "40", "qty": 1}, {"size": "42", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-21_0095-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-21_0093-800x1200-1.jpg"]}}}, "8122-22": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 17.95, "cost_in_eur": 4.64, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 3}, {"size": "40", "qty": 3}, {"size": "42", "qty": 3}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-22_003-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-22_002-800x1200-1.jpg"]}, "\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "36", "qty": 3}, {"size": "38", "qty": 3}, {"size": "40", "qty": 3}, {"size": "42", "qty": 3}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/8122-22_006-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/8122-22_007-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 1}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-22_005-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-22_004-800x1200-1.jpg"]}}}, "8122-32": {"type": "\u0442\u0440\u0443\u0441\u044b", "price_retail_eur": 19.95, "cost_in_eur": 5.36, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "36", "qty": 3}, {"size": "38", "qty": 3}, {"size": "40", "qty": 4}, {"size": "42", "qty": 3}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-007_0096-800x1200-2.jpg"]}, "\u0428\u0430\u043c\u043f\u0430\u043d\u044c": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 3}, {"size": "42", "qty": 3}], "images": ["https://doloresnovias.com/wp-content/uploads/2020/05/8122-007_002-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2020/05/8122-007_003-800x1200-1.jpg"]}, "\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439": {"variants": [{"size": "36", "qty": 2}, {"size": "38", "qty": 2}, {"size": "40", "qty": 2}, {"size": "42", "qty": 2}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-007_007-800x1200-1-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-007_006-800x1200-1.jpg"]}, "\u0410\u043c\u0430\u0440\u0430\u043d\u0442": {"variants": [{"size": "36", "qty": 1}, {"size": "38", "qty": 1}, {"size": "40", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-007_0091-800x1200-1.jpg"]}, "\u0422\u0451\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439": {"variants": [{"size": "36", "qty": 1}, {"size": "38", "qty": 1}, {"size": "40", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-007_005-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-007_007-800x1200-1.jpg"]}}}, "8122-6033": {"type": "\u0441\u043e\u0440\u043e\u0447\u043a\u0430", "price_retail_eur": 44.95, "cost_in_eur": 14.0, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "36", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-6033_003-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-6033_008-800x1200-1.jpg"]}, "\u0410\u043c\u0430\u0440\u0430\u043d\u0442": {"variants": [{"size": "36", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-6033_0003-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-6033_0004-800x1200-1.jpg"]}, "\u0422\u0451\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439": {"variants": [{"size": "36", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-6033_001-800x1200-1.jpg", "https://doloresnovias.com/wp-content/uploads/2023/01/8122-6033_002-800x1200-1.jpg"]}}}, "8122-6748": {"type": "\u0445\u0430\u043b\u0430\u0442", "price_retail_eur": 89.95, "cost_in_eur": 28.24, "colors": {"\u0427\u0451\u0440\u043d\u044b\u0439": {"variants": [{"size": "36", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-6748_010-800x1200-1.jpg"]}, "\u0422\u0451\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439": {"variants": [{"size": "36", "qty": 1}], "images": ["https://doloresnovias.com/wp-content/uploads/2023/01/8122-6748_011-800x1200-1.jpg"]}}}}$j$::jsonb as j
),
meta as (
  select $m${"7008-6734":{"cat":"batas","slug":"bata-de-saten-champan-7008-6734","name":"Bata de satén Champán","f":true},
"7017-010":{"cat":"sujetadores","slug":"sujetador-de-encaje-aurora-7017-010","name":"Sujetador de encaje Aurora","f":true},
"7017-011":{"cat":"sujetadores","slug":"sujetador-con-aro-aurora-7017-011","name":"Sujetador con aro Aurora","f":false},
"7017-20":{"cat":"braguitas","slug":"braguita-clasica-aurora-7017-20","name":"Braguita clásica Aurora","f":false},
"7017-22":{"cat":"braguitas","slug":"braguita-brasilena-aurora-7017-22","name":"Braguita brasileña Aurora","f":false},
"7017-30":{"cat":"braguitas","slug":"culotte-de-encaje-aurora-7017-30","name":"Culotte de encaje Aurora","f":false},
"7017-32":{"cat":"braguitas","slug":"tanga-de-encaje-aurora-7017-32","name":"Tanga de encaje Aurora","f":false},
"7017-34":{"cat":"braguitas","slug":"braguita-alta-aurora-7017-34","name":"Braguita alta Aurora","f":false},
"7017-6017":{"cat":"picardias","slug":"picardias-de-encaje-aurora-7017-6017","name":"Picardías de encaje Aurora","f":true},
"7017-6732":{"cat":"picardias","slug":"picardias-largo-aurora-7017-6732","name":"Picardías largo Aurora","f":true},
"8057-6097":{"cat":"camisones","slug":"camison-de-saten-perla-8057-6097","name":"Camisón de satén Perla","f":true},
"8057-6732":{"cat":"picardias","slug":"picardias-de-saten-perla-8057-6732","name":"Picardías de satén Perla","f":false},
"8122-001":{"cat":"sujetadores","slug":"sujetador-balconette-celeste-8122-001","name":"Sujetador balconette Celeste","f":true},
"8122-003":{"cat":"sujetadores","slug":"sujetador-push-up-noche-8122-003","name":"Sujetador push-up Noche","f":false},
"8122-007":{"cat":"sujetadores","slug":"sujetador-de-encaje-perla-8122-007","name":"Sujetador de encaje Perla","f":false},
"8122-009":{"cat":"sujetadores","slug":"sujetador-triangular-luna-8122-009","name":"Sujetador triangular Luna","f":false},
"8122-21":{"cat":"braguitas","slug":"braguita-de-encaje-celeste-8122-21","name":"Braguita de encaje Celeste","f":false},
"8122-22":{"cat":"braguitas","slug":"tanga-celeste-8122-22","name":"Tanga Celeste","f":false},
"8122-32":{"cat":"braguitas","slug":"braguita-brasilena-celeste-8122-32","name":"Braguita brasileña Celeste","f":true},
"8122-6033":{"cat":"camisones","slug":"camison-corto-celeste-8122-6033","name":"Camisón corto Celeste","f":false},
"8122-6748":{"cat":"batas","slug":"bata-de-encaje-celeste-8122-6748","name":"Bata de encaje Celeste","f":true}}$m$::jsonb as m
),
cmap(ru, cslug, cname, hex, cord) as (
  values ('Шампань','champan','Champán','#F0E4D0',1),
         ('Розовый','rosa-empolvado','Rosa empolvado','#E8B4BC',2),
         ('Фиолетовый','ciruela','Ciruela','#6B4160',3),
         ('Чёрный','negro','Negro','#1A1A1A',4),
         ('Амарант','amaranto','Amaranto','#7A1F3D',5),
         ('Тёмно-синий','azul-petroleo','Azul petróleo','#1B4B5A',6)
),
ctext(cat, short_d, long_d) as (
  values ('sujetadores',
          'Sujetador de la colección nupcial Anabel Arto en encaje bordado, con copas suaves y tirantes regulables.',
          'Sujetador de la casa ucraniana Anabel Arto, confeccionado en encaje bordado y tul suave. Copas con buen sostén, aros forrados, tirantes regulables y cierre trasero de corchetes. Últimas unidades de la colección nupcial, liquidadas desde nuestro showroom en España. Precio con IVA incluido.'),
         ('braguitas',
          'Braguita a juego de la colección nupcial Anabel Arto, en encaje suave y tacto ligero.',
          'Braguita de la colección nupcial Anabel Arto, en encaje elástico de tacto suave con acabados planos que no marcan bajo la ropa. Combina con los sujetadores de la misma referencia para formar conjunto. Últimas unidades en liquidación. Precio con IVA incluido.'),
         ('picardias',
          'Picardías de la colección nupcial Anabel Arto, en encaje y tul con caída fluida.',
          'Picardías de la casa Anabel Arto, en encaje bordado y tul de caída fluida, pensado para la noche de bodas y el vestidor boudoir. Tirantes finos regulables y forro interior suave. Últimas unidades de la colección en liquidación desde España. Precio con IVA incluido.'),
         ('camisones',
          'Camisón de satén y encaje de la colección Anabel Arto, suave y de caída elegante.',
          'Camisón de la casa Anabel Arto en satén sedoso combinado con encaje. Corte favorecedor, tirantes regulables y tejido de tacto fresco, perfecto para el ajuar nupcial o el uso diario. Últimas unidades en liquidación. Precio con IVA incluido.'),
         ('batas',
          'Bata larga de satén y encaje de la colección Anabel Arto, con cinturón a juego.',
          'Bata de la casa Anabel Arto en satén con detalles de encaje, cinturón a juego y caída fluida. Ideal para completar el conjunto nupcial en las fotografías de la mañana de la boda. Últimas unidades de la colección en liquidación desde nuestro showroom en España. Precio con IVA incluido.')
),
items as (
  select e.key as sku, e.value as v, meta.m -> e.key as mv
  from raw cross join lateral jsonb_each(raw.j) e cross join meta
),
ins_p as (
  insert into public.products (sku, slug, category_id, supplier_id, name, short_description, description, price_cents, is_active, is_featured)
  select i.sku, i.mv->>'slug', c.id, s.id, i.mv->>'name', t.short_d, t.long_d,
         round((i.v->>'price_retail_eur')::numeric * 100)::int, true, (i.mv->>'f')::boolean
  from items i
  join public.categories c on c.slug = i.mv->>'cat'
  join ctext t on t.cat = i.mv->>'cat'
  cross join (select id from public.suppliers where code = 'own_stock_ukraine') s
  returning id, sku, name
),
ins_cost as (
  insert into public.product_costs (product_id, cost_cents)
  select p.id, round((i.v->>'cost_in_eur')::numeric * 100)::int
  from ins_p p join items i on i.sku = p.sku
  returning product_id
),
ins_colors as (
  insert into public.product_colors (product_id, slug, name, hex, sort_order)
  select p.id, m.cslug, m.cname, m.hex, m.cord
  from items i
  join ins_p p on p.sku = i.sku
  cross join lateral jsonb_each(i.v->'colors') ce(ru, cv)
  join cmap m on m.ru = ce.ru
  returning id, product_id, slug
),
cx as (
  select p.id as product_id, p.sku, p.name as pname, c.id as color_id, m.cslug, m.cname, ce.cv
  from items i
  join ins_p p on p.sku = i.sku
  cross join lateral jsonb_each(i.v->'colors') ce(ru, cv)
  join cmap m on m.ru = ce.ru
  join ins_colors c on c.product_id = p.id and c.slug = m.cslug
),
ins_img as (
  insert into public.product_images (product_id, color_id, url, alt, width, height, sort_order)
  select x.product_id, x.color_id, img.url, x.pname || ' — ' || x.cname, 800, 1200, img.ord::int
  from cx x
  cross join lateral jsonb_array_elements_text(x.cv->'images') with ordinality img(url, ord)
  returning id
)
insert into public.product_variants (product_id, color_id, size, variant_sku, stock, is_active, sort_order)
select x.product_id, x.color_id, va.value->>'size',
       x.sku || '-' || x.cslug || '-' || replace(va.value->>'size', ' ', ''),
       (va.value->>'qty')::int, true, va.ord::int
from cx x
cross join lateral jsonb_array_elements(x.cv->'variants') with ordinality va(value, ord);

update public.categories set image_url = 'https://doloresnovias.com/wp-content/uploads/2020/05/8122-001_006-800x1200-1-e1640130840396.jpg' where slug = 'sujetadores';
update public.categories set image_url = 'https://doloresnovias.com/wp-content/uploads/2020/05/8122-21_006-800x1200-1.jpg' where slug = 'braguitas';
update public.categories set image_url = 'https://doloresnovias.com/wp-content/uploads/2023/02/7017-6732_005-800x1200-1.jpg' where slug = 'picardias';
update public.categories set image_url = 'https://doloresnovias.com/wp-content/uploads/2020/05/8057-6097_005-800x1200-1.jpg' where slug = 'camisones';
update public.categories set image_url = 'https://doloresnovias.com/wp-content/uploads/2020/05/7008-6734_005-800x1200-2.jpg' where slug = 'batas';