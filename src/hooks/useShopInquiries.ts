import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ShopInquiry } from "@/types/shop";

export function useShopInquiries(userId: string | null) {
  const inquiriesQuery = useQuery({
    queryKey: ["shop-inquiries", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [] as ShopInquiry[];
      const { data, error } = await supabase
        .from("shop_inquiries")
        .select("*, shop_inquiry_items(*, stock_items(*))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ShopInquiry[];
    },
  });

  const submitInquiry = useCallback(
    async (payload: {
      userId: string;
      message?: string;
      items: { stock_item_id: string; quantity: number; note?: string }[];
    }) => {
      const { data, error } = await supabase
        .from("shop_inquiries")
        .insert({
          user_id: payload.userId,
          status: "submitted",
          message: payload.message || "",
        })
        .select("id")
        .single();

      if (error) throw error;

      const inquiryId = data.id as string;
      const itemsPayload = payload.items.map((item) => ({
        inquiry_id: inquiryId,
        stock_item_id: item.stock_item_id,
        quantity: item.quantity,
        note: item.note || "",
      }));

      const { error: itemsError } = await supabase
        .from("shop_inquiry_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;
      await inquiriesQuery.refetch();
      return inquiryId;
    },
    [inquiriesQuery],
  );

  return {
    inquiries: inquiriesQuery.data || [],
    loading: inquiriesQuery.isLoading,
    error: inquiriesQuery.error,
    submitInquiry,
    refetch: inquiriesQuery.refetch,
  };
}
