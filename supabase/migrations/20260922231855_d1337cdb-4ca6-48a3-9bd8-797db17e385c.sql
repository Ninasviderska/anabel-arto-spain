CREATE TYPE public.size_type AS ENUM ('bra', 'numeric', 'one_size');
CREATE TYPE public.order_status AS ENUM ('pending_payment', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  country text NOT NULL,
  is_dropshipping boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.suppliers TO anon, authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers are publicly readable" ON public.suppliers FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  size_type public.size_type NOT NULL DEFAULT 'one_size',
  sort_order int NOT NULL DEFAULT 0,
  image_url text,
  seo_title text,
  seo_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active categories are publicly readable" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  name text NOT NULL,
  short_description text,
  description text,
  price_cents int NOT NULL,
  compare_at_price_cents int,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are publicly readable" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE TABLE public.product_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  hex text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (product_id, slug)
);
CREATE INDEX product_colors_product_idx ON public.product_colors(product_id);
GRANT SELECT ON public.product_colors TO anon, authenticated;
GRANT ALL ON public.product_colors TO service_role;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product colors are publicly readable" ON public.product_colors FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id uuid REFERENCES public.product_colors(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  width int,
  height int,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX product_images_product_idx ON public.product_images(product_id);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images are publicly readable" ON public.product_images FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES public.product_colors(id) ON DELETE CASCADE,
  size text NOT NULL,
  variant_sku text NOT NULL UNIQUE,
  stock int,
  price_override_cents int,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (product_id, color_id, size)
);
CREATE INDEX product_variants_product_idx ON public.product_variants(product_id);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active variants are publicly readable" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('AA-' || nextval('public.order_number_seq')::text),
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  locale text NOT NULL DEFAULT 'es',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  postal_code text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  country text NOT NULL DEFAULT 'ES',
  notes text,
  subtotal_cents int NOT NULL,
  shipping_cents int NOT NULL,
  total_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id),
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  color_name text NOT NULL,
  size text NOT NULL,
  variant_sku text NOT NULL,
  image_url text,
  unit_price_cents int NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0)
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Demo data =====
INSERT INTO public.suppliers (id, code, name, country) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'AA-UA', 'Anabel Arto (Ucrania)', 'UA');

INSERT INTO public.categories (id, slug, name, description, size_type, sort_order, image_url, seo_title, seo_description) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'sujetadores', 'Sujetadores', 'Sujetadores de novia y boudoir en encaje y tul, con copas por talla.', 'bra', 1, '/images/products/sujetador-aurora.jpg', 'Sujetadores de novia | Anabel Arto', 'Sujetadores de encaje premium para novias. Tallas 70A–85D. Envío a toda España.'),
  ('c0000000-0000-0000-0000-000000000002', 'braguitas', 'Braguitas', 'Braguitas y brasileñas a juego con nuestros conjuntos.', 'numeric', 2, '/images/products/braguita-aurora.jpg', 'Braguitas de encaje | Anabel Arto', 'Braguitas de encaje premium en tallas 36–46. Envío a toda España.'),
  ('c0000000-0000-0000-0000-000000000003', 'picardias', 'Picardías', 'Picardías de tul y encaje para la noche de bodas.', 'one_size', 3, '/images/products/picardias-noche.jpg', 'Picardías de novia | Anabel Arto', 'Picardías boudoir de encaje chantilly. Talla única. Envío a toda España.'),
  ('c0000000-0000-0000-0000-000000000004', 'camisones', 'Camisones', 'Camisones de satén con detalles de encaje.', 'one_size', 4, '/images/products/camison-luna.jpg', 'Camisones de satén | Anabel Arto', 'Camisones de satén y encaje. Talla única. Envío a toda España.'),
  ('c0000000-0000-0000-0000-000000000005', 'batas', 'Batas', 'Batas y kimonos de satén para la mañana de la boda.', 'one_size', 5, '/images/products/bata-amanecer.jpg', 'Batas de novia | Anabel Arto', 'Batas de satén y encaje para novias. Talla única. Envío a toda España.');

INSERT INTO public.products (id, sku, slug, category_id, supplier_id, name, short_description, description, price_cents, compare_at_price_cents, is_featured, seo_title, seo_description) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'AA-SJ-001', 'sujetador-balconette-aurora', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sujetador balconette Aurora', 'Encaje floral bordado y tirantes de satén. Copa sin relleno.', 'Texto descriptivo provisional. El sujetador balconette Aurora combina encaje floral bordado a mano con tirantes finos de satén. Aro suave y copa sin relleno para un escote natural y elegante bajo el vestido de novia.', 3990, 7990, true, NULL, NULL),
  ('d0000000-0000-0000-0000-000000000002', 'AA-SJ-002', 'sujetador-push-up-celeste', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sujetador push-up Celeste', 'Copa moldeada con encaje chantilly y lazo central.', 'Texto descriptivo provisional. El sujetador push-up Celeste realza el escote con una copa moldeada ligera, rematada con encaje chantilly y un delicado lazo de satén.', 3490, 6990, true, NULL, NULL),
  ('d0000000-0000-0000-0000-000000000003', 'AA-BR-001', 'braguita-encaje-aurora', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Braguita de encaje Aurora', 'Braguita a juego con el conjunto Aurora.', 'Texto descriptivo provisional. Braguita clásica en encaje floral con forro de algodón, a juego con el sujetador Aurora.', 1990, 3990, true, NULL, NULL),
  ('d0000000-0000-0000-0000-000000000004', 'AA-BR-002', 'brasilena-saten-perla', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Brasileña de satén Perla', 'Satén champán con laterales de encaje.', 'Texto descriptivo provisional. Brasileña de corte bajo en satén champán con paneles laterales de encaje transparente.', 1790, 3590, false, NULL, NULL),
  ('d0000000-0000-0000-0000-000000000005', 'AA-PC-001', 'picardias-noche-de-bodas', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Picardías Noche de Bodas', 'Tul y encaje chantilly, largo corto.', 'Texto descriptivo provisional. Picardías de tul vaporoso con cuerpo de encaje chantilly y tirantes ajustables. Incluye tanga a juego.', 5990, 11990, true, NULL, NULL),
  ('d0000000-0000-0000-0000-000000000006', 'AA-CM-001', 'camison-saten-luna', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Camisón de satén Luna', 'Satén fluido con escote de encaje.', 'Texto descriptivo provisional. Camisón largo de satén fluido con escote en V bordeado de encaje y abertura lateral.', 4990, 9990, true, NULL, NULL),
  ('d0000000-0000-0000-0000-000000000007', 'AA-BT-001', 'bata-saten-amanecer', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Bata de satén Amanecer', 'Mangas de encaje y cinturón de satén.', 'Texto descriptivo provisional. Bata larga de satén con mangas amplias de encaje y cinturón a juego. Ideal para los preparativos de la mañana de la boda.', 6990, 13990, true, NULL, NULL);

INSERT INTO public.product_colors (id, product_id, slug, name, hex, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001', 'marfil', 'Marfil', '#F3EBDD', 1),
  ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', 'negro', 'Negro', '#1F1B1B', 2),
  ('e0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000002', 'rosa-empolvado', 'Rosa empolvado', '#E8C4C4', 1),
  ('e0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000002', 'marfil', 'Marfil', '#F3EBDD', 2),
  ('e0000000-0000-0000-0000-000000000031', 'd0000000-0000-0000-0000-000000000003', 'marfil', 'Marfil', '#F3EBDD', 1),
  ('e0000000-0000-0000-0000-000000000032', 'd0000000-0000-0000-0000-000000000003', 'negro', 'Negro', '#1F1B1B', 2),
  ('e0000000-0000-0000-0000-000000000041', 'd0000000-0000-0000-0000-000000000004', 'champan', 'Champán', '#EBD9B4', 1),
  ('e0000000-0000-0000-0000-000000000051', 'd0000000-0000-0000-0000-000000000005', 'marfil', 'Marfil', '#F3EBDD', 1),
  ('e0000000-0000-0000-0000-000000000052', 'd0000000-0000-0000-0000-000000000005', 'burdeos', 'Burdeos', '#5E1B2B', 2),
  ('e0000000-0000-0000-0000-000000000061', 'd0000000-0000-0000-0000-000000000006', 'marfil', 'Marfil', '#F3EBDD', 1),
  ('e0000000-0000-0000-0000-000000000062', 'd0000000-0000-0000-0000-000000000006', 'rosa-empolvado', 'Rosa empolvado', '#E8C4C4', 2),
  ('e0000000-0000-0000-0000-000000000071', 'd0000000-0000-0000-0000-000000000007', 'burdeos', 'Burdeos', '#5E1B2B', 1),
  ('e0000000-0000-0000-0000-000000000072', 'd0000000-0000-0000-0000-000000000007', 'marfil', 'Marfil', '#F3EBDD', 2);

INSERT INTO public.product_images (product_id, color_id, url, alt, width, height, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000011', '/images/products/sujetador-aurora.jpg', 'Sujetador balconette Aurora en marfil', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000012', '/images/products/sujetador-aurora.jpg', 'Sujetador balconette Aurora en negro (foto provisional)', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000021', '/images/products/sujetador-celeste.jpg', 'Sujetador push-up Celeste en rosa empolvado', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000022', '/images/products/sujetador-aurora.jpg', 'Sujetador push-up Celeste en marfil (foto provisional)', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000031', '/images/products/braguita-aurora.jpg', 'Braguita de encaje Aurora en marfil', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000032', '/images/products/braguita-aurora.jpg', 'Braguita de encaje Aurora en negro (foto provisional)', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000041', '/images/products/braguita-perla.jpg', 'Brasileña de satén Perla en champán', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000051', '/images/products/picardias-noche.jpg', 'Picardías Noche de Bodas en marfil', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000052', '/images/products/picardias-noche.jpg', 'Picardías Noche de Bodas en burdeos (foto provisional)', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000061', '/images/products/camison-luna.jpg', 'Camisón de satén Luna en marfil', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000062', '/images/products/camison-luna.jpg', 'Camisón de satén Luna en rosa empolvado (foto provisional)', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000071', '/images/products/bata-amanecer.jpg', 'Bata de satén Amanecer en burdeos', 1024, 1280, 1),
  ('d0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000072', '/images/products/bata-amanecer.jpg', 'Bata de satén Amanecer en marfil (foto provisional)', 1024, 1280, 1);

-- Variants: bras
INSERT INTO public.product_variants (product_id, color_id, size, variant_sku, sort_order)
SELECT c.product_id, c.id, s.size, p.sku || '-' || upper(c.slug) || '-' || s.size, s.ord
FROM public.product_colors c
JOIN public.products p ON p.id = c.product_id
CROSS JOIN (VALUES ('70A',1),('70B',2),('75A',3),('75B',4),('75C',5),('80B',6),('80C',7),('80D',8),('85C',9)) AS s(size, ord)
WHERE p.category_id = 'c0000000-0000-0000-0000-000000000001';

-- Variants: briefs
INSERT INTO public.product_variants (product_id, color_id, size, variant_sku, sort_order)
SELECT c.product_id, c.id, s.size, p.sku || '-' || upper(c.slug) || '-' || s.size, s.ord
FROM public.product_colors c
JOIN public.products p ON p.id = c.product_id
CROSS JOIN (VALUES ('36',1),('38',2),('40',3),('42',4),('44',5),('46',6)) AS s(size, ord)
WHERE p.category_id = 'c0000000-0000-0000-0000-000000000002';

-- Variants: one size
INSERT INTO public.product_variants (product_id, color_id, size, variant_sku, sort_order)
SELECT c.product_id, c.id, 'Talla única', p.sku || '-' || upper(c.slug) || '-TU', 1
FROM public.product_colors c
JOIN public.products p ON p.id = c.product_id
WHERE p.category_id IN ('c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000005');