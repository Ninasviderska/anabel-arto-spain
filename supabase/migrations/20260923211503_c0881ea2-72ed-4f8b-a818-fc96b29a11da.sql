CREATE POLICY "Service role manages orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages order items" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages product costs" ON public.product_costs FOR ALL TO service_role USING (true) WITH CHECK (true);