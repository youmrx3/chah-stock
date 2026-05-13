-- Add price column to product_sub_products table
ALTER TABLE public.product_sub_products 
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

-- Update existing records to have default price
UPDATE public.product_sub_products 
SET price = 0 
WHERE price IS NULL;
