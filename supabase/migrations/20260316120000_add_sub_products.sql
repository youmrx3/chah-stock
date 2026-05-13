-- Create product_sub_products table for hierarchical product structure
CREATE TABLE IF NOT EXISTS public.product_sub_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_product_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_sub_products ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read on product_sub_products"
ON public.product_sub_products FOR SELECT USING (true);

CREATE POLICY "Allow public insert on product_sub_products"
ON public.product_sub_products FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on product_sub_products"
ON public.product_sub_products FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on product_sub_products"
ON public.product_sub_products FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_product_sub_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_product_sub_products_updated_at ON public.product_sub_products;
CREATE TRIGGER update_product_sub_products_updated_at
BEFORE UPDATE ON public.product_sub_products
FOR EACH ROW
EXECUTE FUNCTION public.update_product_sub_products_updated_at();
