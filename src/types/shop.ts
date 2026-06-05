export interface ShopCustomer {
  id: string;
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  created_at?: string;
  updated_at?: string;
}

export type InquiryStatus = "submitted" | "reviewing" | "quoted" | "closed";

export interface ShopInquiry {
  id: string;
  user_id: string;
  status: InquiryStatus;
  message: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShopInquiryItem {
  id: string;
  inquiry_id: string;
  stock_item_id: string | null;
  quantity: number;
  note: string | null;
  created_at?: string;
}

export interface ShopFavorite {
  id: string;
  user_id: string;
  stock_item_id: string;
  created_at?: string;
}

export interface InquiryCartItem {
  stock_item_id: string;
  quantity: number;
  note?: string;
}
