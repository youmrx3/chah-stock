-- Create payment_tracking table for detailed payment records
CREATE TABLE IF NOT EXISTS public.payment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE,
  sub_product_id UUID REFERENCES public.product_sub_products(id) ON DELETE CASCADE,
  amount_willing_to_pay NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, partial, completed
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_product_or_subproduct CHECK (
    (product_id IS NOT NULL AND sub_product_id IS NULL) OR 
    (product_id IS NULL AND sub_product_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.payment_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read on payment_tracking"
ON public.payment_tracking FOR SELECT USING (true);

CREATE POLICY "Allow public insert on payment_tracking"
ON public.payment_tracking FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on payment_tracking"
ON public.payment_tracking FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on payment_tracking"
ON public.payment_tracking FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_payment_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_payment_tracking_updated_at ON public.payment_tracking;
CREATE TRIGGER update_payment_tracking_updated_at
BEFORE UPDATE ON public.payment_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_tracking_updated_at();

-- Create index for faster queries
CREATE INDEX idx_payment_tracking_client_id ON public.payment_tracking(client_id);
CREATE INDEX idx_payment_tracking_product_id ON public.payment_tracking(product_id);
CREATE INDEX idx_payment_tracking_sub_product_id ON public.payment_tracking(sub_product_id);
