-- Create stock_items table
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reference TEXT DEFAULT '',
  price_ht NUMERIC DEFAULT NULL,
  reserved INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  image_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_fields table for dynamic fields
CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_field_values table for storing values
CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stock_item_id, custom_field_id)
);

-- Enable Row Level Security (public access for now - can be restricted later)
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for stock management)
CREATE POLICY "Allow public read access on stock_items" 
ON public.stock_items FOR SELECT USING (true);

CREATE POLICY "Allow public insert on stock_items" 
ON public.stock_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on stock_items" 
ON public.stock_items FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on stock_items" 
ON public.stock_items FOR DELETE USING (true);

CREATE POLICY "Allow public read access on custom_fields" 
ON public.custom_fields FOR SELECT USING (true);

CREATE POLICY "Allow public insert on custom_fields" 
ON public.custom_fields FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on custom_fields" 
ON public.custom_fields FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on custom_fields" 
ON public.custom_fields FOR DELETE USING (true);

CREATE POLICY "Allow public read access on custom_field_values" 
ON public.custom_field_values FOR SELECT USING (true);

CREATE POLICY "Allow public insert on custom_field_values" 
ON public.custom_field_values FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on custom_field_values" 
ON public.custom_field_values FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on custom_field_values" 
ON public.custom_field_values FOR DELETE USING (true);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Create storage policies for product images
CREATE POLICY "Anyone can view product images" 
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images" 
ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images" 
ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stock_items_updated_at
BEFORE UPDATE ON public.stock_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Site settings table for logo, company name, etc.
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on site_settings" ON public.site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on site_settings" ON public.site_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on site_settings" ON public.site_settings FOR DELETE USING (true);

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('company_name', 'Gestion de Stock 2025'),
  ('company_subtitle', 'Équipement médical'),
  ('logo_url', NULL),
  ('low_stock_threshold', '5'),
  ('currency', 'DZD');

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
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

-- Create fournisseurs table
CREATE TABLE IF NOT EXISTS public.fournisseurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.stock_items ADD COLUMN fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on fournisseurs"
ON public.fournisseurs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on fournisseurs"
ON public.fournisseurs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on fournisseurs"
ON public.fournisseurs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on fournisseurs"
ON public.fournisseurs FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_fournisseurs_updated_at ON public.fournisseurs;
CREATE TRIGGER update_fournisseurs_updated_at
BEFORE UPDATE ON public.fournisseurs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
