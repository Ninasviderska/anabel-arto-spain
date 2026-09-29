CREATE TABLE public.home_content (
  key text PRIMARY KEY,
  content text NOT NULL,
  align text CHECK (align IN ('left','center','right')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_content TO authenticated;
GRANT ALL ON public.home_content TO service_role;
ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home content is publicly readable" ON public.home_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manages home content" ON public.home_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_home_content_updated_at BEFORE UPDATE ON public.home_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();