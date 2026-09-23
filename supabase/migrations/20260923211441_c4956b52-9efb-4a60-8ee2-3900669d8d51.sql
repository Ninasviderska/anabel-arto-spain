ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_text text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_text text;