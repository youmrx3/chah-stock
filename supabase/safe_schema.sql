-- Safe schema migration (adds missing columns/tables, never errors)

-- stock_items base table
CREATE TABLE IF NOT EXISTS public.stock_items (
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

-- Add columns that may be missing
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS paid_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS client_id UUID NULL;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS brand_id UUID NULL;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS origin_id UUID NULL;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS fournisseur_id UUID NULL;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS category_id UUID NULL;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS price_currency text;
UPDATE public.stock_items SET price_currency = 'CAD' WHERE price_currency IS DISTINCT FROM 'CAD';
ALTER TABLE public.stock_items DROP CONSTRAINT IF EXISTS stock_items_price_currency_check;
ALTER TABLE public.stock_items ADD CONSTRAINT stock_items_price_currency_check CHECK (price_currency = 'CAD');
ALTER TABLE public.stock_items ALTER COLUMN price_currency SET NOT NULL, ALTER COLUMN price_currency SET DEFAULT 'CAD';

-- Other core tables
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stock_item_id, custom_field_id)
);

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

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_sub_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_product_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE,
  sub_product_id UUID REFERENCES public.product_sub_products(id) ON DELETE CASCADE,
  amount_willing_to_pay NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_product_or_subproduct CHECK (
    (product_id IS NOT NULL AND sub_product_id IS NULL) OR 
    (product_id IS NULL AND sub_product_id IS NOT NULL)
  )
);

-- Site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (key, value) VALUES
  ('company_name', 'Gestion de Stock 2025'),
  ('company_subtitle', 'Equipement medical'),
  ('logo_url', NULL),
  ('low_stock_threshold', '5'),
  ('currency', 'CAD'),
  ('company_address', ''),
  ('company_email', ''),
  ('company_phone', '')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_sub_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public access policies on all tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on stock_items' AND tablename = 'stock_items') THEN
    CREATE POLICY "Allow public read access on stock_items" ON public.stock_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on stock_items' AND tablename = 'stock_items') THEN
    CREATE POLICY "Allow public insert on stock_items" ON public.stock_items FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update on stock_items' AND tablename = 'stock_items') THEN
    CREATE POLICY "Allow public update on stock_items" ON public.stock_items FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete on stock_items' AND tablename = 'stock_items') THEN
    CREATE POLICY "Allow public delete on stock_items" ON public.stock_items FOR DELETE USING (true);
  END IF;
END $$;

-- Allow public access on other tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on clients' AND tablename = 'clients') THEN
    CREATE POLICY "Allow public read on clients" ON public.clients FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on clients" ON public.clients FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on clients" ON public.clients FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on clients" ON public.clients FOR DELETE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on brands' AND tablename = 'brands') THEN
    CREATE POLICY "Allow public read on brands" ON public.brands FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on brands" ON public.brands FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on brands" ON public.brands FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on brands" ON public.brands FOR DELETE USING (true);
  END IF;
END $$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-origin-logos', 'brand-origin-logos', true) ON CONFLICT (id) DO NOTHING;

-- Updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
DROP TRIGGER IF EXISTS update_stock_items_updated_at ON public.stock_items;
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON public.brands;
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_origins_updated_at ON public.origins;
CREATE TRIGGER update_origins_updated_at BEFORE UPDATE ON public.origins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fournisseurs_updated_at ON public.fournisseurs;
CREATE TRIGGER update_fournisseurs_updated_at BEFORE UPDATE ON public.fournisseurs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_sub_products_updated_at ON public.product_sub_products;
CREATE TRIGGER update_product_sub_products_updated_at BEFORE UPDATE ON public.product_sub_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_tracking_updated_at ON public.payment_tracking;
CREATE TRIGGER update_payment_tracking_updated_at BEFORE UPDATE ON public.payment_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
