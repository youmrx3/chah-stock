ALTER TABLE public.stock_items
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_id UUID NULL,
ADD COLUMN IF NOT EXISTS brand_id UUID NULL,
ADD COLUMN IF NOT EXISTS origin_id UUID NULL;

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.origins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_items
  DROP CONSTRAINT IF EXISTS stock_items_client_id_fkey,
  DROP CONSTRAINT IF EXISTS stock_items_brand_id_fkey,
  DROP CONSTRAINT IF EXISTS stock_items_origin_id_fkey;

ALTER TABLE public.stock_items
  ADD CONSTRAINT stock_items_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD CONSTRAINT stock_items_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD CONSTRAINT stock_items_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.origins(id) ON DELETE SET NULL;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public update on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public delete on clients" ON public.clients;

CREATE POLICY "Allow public read on clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert on clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on clients" ON public.clients FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public insert on brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public update on brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public delete on brands" ON public.brands;

CREATE POLICY "Allow public read on brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow public insert on brands" ON public.brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on brands" ON public.brands FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on brands" ON public.brands FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on origins" ON public.origins;
DROP POLICY IF EXISTS "Allow public insert on origins" ON public.origins;
DROP POLICY IF EXISTS "Allow public update on origins" ON public.origins;
DROP POLICY IF EXISTS "Allow public delete on origins" ON public.origins;

CREATE POLICY "Allow public read on origins" ON public.origins FOR SELECT USING (true);
CREATE POLICY "Allow public insert on origins" ON public.origins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on origins" ON public.origins FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on origins" ON public.origins FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow public insert on product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow public update on product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow public delete on product_images" ON public.product_images;

CREATE POLICY "Allow public read on product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Allow public insert on product_images" ON public.product_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on product_images" ON public.product_images FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on product_images" ON public.product_images FOR DELETE USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-origin-logos', 'brand-origin-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view brand and origin logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload brand and origin logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update brand and origin logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete brand and origin logos" ON storage.objects;

CREATE POLICY "Anyone can view brand and origin logos"
ON storage.objects FOR SELECT USING (bucket_id = 'brand-origin-logos');

CREATE POLICY "Anyone can upload brand and origin logos"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-origin-logos');

CREATE POLICY "Anyone can update brand and origin logos"
ON storage.objects FOR UPDATE USING (bucket_id = 'brand-origin-logos');

CREATE POLICY "Anyone can delete brand and origin logos"
ON storage.objects FOR DELETE USING (bucket_id = 'brand-origin-logos');

INSERT INTO public.site_settings (key, value)
VALUES
  ('company_address', ''),
  ('company_email', ''),
  ('company_phone', '')
ON CONFLICT (key) DO NOTHING;

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON public.brands;
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_origins_updated_at ON public.origins;
CREATE TRIGGER update_origins_updated_at
BEFORE UPDATE ON public.origins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();