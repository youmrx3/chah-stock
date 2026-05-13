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

-- Add fournisseur_id column to stock_items
DO $$ BEGIN
  ALTER TABLE public.stock_items ADD COLUMN fournisseur_id UUID REFERENCES public.fournisseurs(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;

-- Policies for public access
CREATE POLICY "Allow public read access on fournisseurs"
ON public.fournisseurs FOR SELECT USING (true);

CREATE POLICY "Allow public insert on fournisseurs"
ON public.fournisseurs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on fournisseurs"
ON public.fournisseurs FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on fournisseurs"
ON public.fournisseurs FOR DELETE USING (true);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_fournisseurs_updated_at
  BEFORE UPDATE ON public.fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
