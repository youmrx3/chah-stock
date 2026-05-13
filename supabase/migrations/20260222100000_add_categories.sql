-- Categories table for product classification
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on categories" ON public.categories FOR DELETE USING (true);

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add category_id column to stock_items
ALTER TABLE public.stock_items ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
