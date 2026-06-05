import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StockItem, CustomField } from "@/types/stock";

interface ShopProductResult {
  item: StockItem | null;
  customFields: CustomField[];
}

export function useShopProduct(productId: string | null) {
  return useQuery<ShopProductResult>({
    queryKey: ["shop-product", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      if (!productId) return { item: null, customFields: [] };

      const { data: item, error } = await supabase
        .from("stock_items")
        .select(
          `*,
          brands:brand_id ( id, name, logo_url ),
          origins:origin_id ( id, name, logo_url ),
          categories:category_id ( id, name, image_url ),
          fournisseurs:fournisseur_id ( id, name ),
          product_images ( id, image_url, sort_order ),
          product_sub_products ( id, name, quantity, price ),
          custom_field_values ( id, value, custom_field_id, custom_fields ( id, name, field_type, is_active ) )
        `,
        )
        .eq("id", productId)
        .single();

      if (error) throw error;

      const normalizedItem = {
        ...item,
        brand: item.brands || null,
        origin: item.origins || null,
        category: item.categories || null,
        fournisseur: item.fournisseurs || null,
        product_images: item.product_images || [],
        sub_products: item.product_sub_products || [],
        custom_field_values: item.custom_field_values || [],
      } as StockItem;

      const { data: customFields } = await supabase
        .from("custom_fields")
        .select("id, name, field_type, is_active, display_order")
        .order("display_order", { ascending: true });

      return { item: normalizedItem, customFields: (customFields || []) as CustomField[] };
    },
  });
}
