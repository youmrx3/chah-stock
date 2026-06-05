-- Shop/customer inquiry tables for client-facing storefront

-- Admin allowlist for secure review access
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- Security-definer function to check admin emails without exposing the table
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  jwt_email text;
begin
  jwt_email := lower(coalesce(current_setting('request.jwt.claims', true)::json->>'email', ''));
  if jwt_email = '' then
    return false;
  end if;
  return exists (
    select 1 from public.admin_allowlist
    where lower(email) = jwt_email
  );
end;
$$;

CREATE TABLE IF NOT EXISTS public.shop_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  company_name text,
  phone text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted',
  message text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_inquiry_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id uuid NOT NULL REFERENCES public.shop_inquiries(id) ON DELETE CASCADE,
  stock_item_id uuid REFERENCES public.stock_items(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  note text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_item_id uuid NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, stock_item_id)
);

ALTER TABLE public.shop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_inquiry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_favorites ENABLE ROW LEVEL SECURITY;

-- Customers profile policies
CREATE POLICY "Customers can view own profile" ON public.shop_customers
FOR SELECT USING (user_id = auth.uid() OR public.is_admin_user());

CREATE POLICY "Customers can insert own profile" ON public.shop_customers
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can update own profile" ON public.shop_customers
FOR UPDATE USING (user_id = auth.uid() OR public.is_admin_user())
WITH CHECK (user_id = auth.uid() OR public.is_admin_user());

-- Inquiries policies
CREATE POLICY "Customers can view own inquiries" ON public.shop_inquiries
FOR SELECT USING (user_id = auth.uid() OR public.is_admin_user());

CREATE POLICY "Customers can create inquiries" ON public.shop_inquiries
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can update own submitted inquiries" ON public.shop_inquiries
FOR UPDATE USING (
  public.is_admin_user() OR (user_id = auth.uid() AND status = 'submitted')
)
WITH CHECK (
  public.is_admin_user() OR (user_id = auth.uid() AND status = 'submitted')
);

-- Inquiry items policies
CREATE POLICY "Customers can view inquiry items" ON public.shop_inquiry_items
FOR SELECT USING (
  public.is_admin_user() OR exists (
    select 1 from public.shop_inquiries i
    where i.id = inquiry_id and i.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can insert inquiry items" ON public.shop_inquiry_items
FOR INSERT WITH CHECK (
  public.is_admin_user() OR exists (
    select 1 from public.shop_inquiries i
    where i.id = inquiry_id and i.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can update inquiry items" ON public.shop_inquiry_items
FOR UPDATE USING (
  public.is_admin_user() OR exists (
    select 1 from public.shop_inquiries i
    where i.id = inquiry_id and i.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin_user() OR exists (
    select 1 from public.shop_inquiries i
    where i.id = inquiry_id and i.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can delete inquiry items" ON public.shop_inquiry_items
FOR DELETE USING (
  public.is_admin_user() OR exists (
    select 1 from public.shop_inquiries i
    where i.id = inquiry_id and i.user_id = auth.uid()
  )
);

-- Favorites policies
CREATE POLICY "Customers can view favorites" ON public.shop_favorites
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Customers can insert favorites" ON public.shop_favorites
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can delete favorites" ON public.shop_favorites
FOR DELETE USING (user_id = auth.uid());

-- Updated-at triggers
DROP TRIGGER IF EXISTS update_shop_customers_updated_at ON public.shop_customers;
CREATE TRIGGER update_shop_customers_updated_at
BEFORE UPDATE ON public.shop_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_inquiries_updated_at ON public.shop_inquiries;
CREATE TRIGGER update_shop_inquiries_updated_at
BEFORE UPDATE ON public.shop_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
