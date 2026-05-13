
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
