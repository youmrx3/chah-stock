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