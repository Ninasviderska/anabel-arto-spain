GRANT SELECT, INSERT, UPDATE ON public.product_costs TO authenticated;
CREATE POLICY "Admin manages product costs" ON public.product_costs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS update_product_costs_updated_at ON public.product_costs;
CREATE TRIGGER update_product_costs_updated_at BEFORE UPDATE ON public.product_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();