export interface StockItem {
  id: string;
  number: number;
  description: string;
  quantity: number;
  reference: string | null;
  price_ht: number | null;
  price_currency?: "DZD" | null;
  reserved: number;
  remaining: number;
  paid_amount: number;
  notes: string | null;
  image_url: string | null;
  client_id?: string | null;
  brand_id?: string | null;
  origin_id?: string | null;
  fournisseur_id?: string | null;
  category_id?: string | null;
  created_at?: string;
  updated_at?: string;
  custom_field_values?: CustomFieldValue[];
  product_images?: ProductImage[];
  sub_products?: SubProduct[];
  client?: Client | null;
  brand?: Brand | null;
  origin?: Origin | null;
  fournisseur?: Fournisseur | null;
  category?: Category | null;
}

export interface CustomField {
  id: string;
  name: string;
  field_type: string;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
}

export interface CustomFieldValue {
  id: string;
  stock_item_id?: string;
  custom_field_id: string;
  value: string | null;
  created_at?: string;
  custom_fields?: Partial<CustomField>;
}

export interface StockStats {
  totalItems: number;
  totalSubProducts: number;
  totalQuantity: number;
  totalReserved: number;
  totalRemaining: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  categoryBreakdown: { category: string; count: number }[];
  stockByStatus: { status: string; count: number; color: string }[];
}

export interface ProductImage {
  id: string;
  stock_item_id: string;
  image_url: string;
  sort_order?: number;
  created_at?: string;
}

export interface SubProduct {
  id: string;
  parent_product_id: string;
  name: string;
  quantity: number;
  price: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Origin {
  id: string;
  name: string;
  logo_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Fournisseur {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTracking {
  id: string;
  client_id: string;
  product_id?: string | null;
  sub_product_id?: string | null;
  amount_willing_to_pay: number;
  amount_paid: number;
  status: "pending" | "partial" | "completed";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  client?: Client | null;
  product?: StockItem | null;
  sub_product?: SubProduct | null;
}
