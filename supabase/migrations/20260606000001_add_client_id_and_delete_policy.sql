-- Add client_id linking shop inquiries to admin clients
-- and add DELETE policy for admin on shop_inquiries

-- Add client_id column (nullable FK to clients)
ALTER TABLE public.shop_inquiries
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add DELETE policy for admin on shop_inquiries
CREATE POLICY "Admin can delete inquiries" ON public.shop_inquiries
FOR DELETE USING (public.is_admin_user());
