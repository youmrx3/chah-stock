import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useShopFavorites(userId: string | null) {
  const favoritesQuery = useQuery({
    queryKey: ["shop-favorites", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [] as string[];
      const { data, error } = await supabase
        .from("shop_favorites")
        .select("stock_item_id");

      if (error) throw error;
      return (data || []).map((row) => row.stock_item_id as string);
    },
  });

  const toggleFavorite = useCallback(
    async (stockItemId: string) => {
      if (!userId) return;
      const current = favoritesQuery.data || [];
      const exists = current.includes(stockItemId);

      if (exists) {
        const { error } = await supabase
          .from("shop_favorites")
          .delete()
          .eq("stock_item_id", stockItemId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shop_favorites")
          .insert({ user_id: userId, stock_item_id: stockItemId });
        if (error) throw error;
      }

      await favoritesQuery.refetch();
    },
    [favoritesQuery, userId],
  );

  return {
    favorites: favoritesQuery.data || [],
    loading: favoritesQuery.isLoading,
    error: favoritesQuery.error,
    toggleFavorite,
  };
}
