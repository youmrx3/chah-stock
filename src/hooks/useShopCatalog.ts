import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StockItem } from "@/types/stock";

interface CatalogResult {
  items: StockItem[];
  brands: { id: string; name: string; logo_url: string | null }[];
  categories: { id: string; name: string; image_url: string | null }[];
  origins: { id: string; name: string; logo_url: string | null }[];
}

const emptyResult: CatalogResult = {
  items: [],
  brands: [],
  categories: [],
  origins: [],
};

export function useShopCatalog() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["shop-catalog"],
    queryFn: async () => {
      const { data: items, error: itemsError } = await supabase
        .from("stock_items")
        .select(
          `*,
          brands:brand_id ( id, name, logo_url ),
          origins:origin_id ( id, name, logo_url ),
          categories:category_id ( id, name, image_url ),
          fournisseurs:fournisseur_id ( id, name ),
          product_images ( id, image_url, sort_order ),
          product_sub_products ( id, name, quantity, price )
        `,
        )
        .order("number", { ascending: true });

      if (itemsError) throw itemsError;

      const typedItems = (items || []).map((item: any) => ({
        ...item,
        brand: item.brands || null,
        origin: item.origins || null,
        category: item.categories || null,
        fournisseur: item.fournisseurs || null,
        product_images: item.product_images || [],
        sub_products: item.product_sub_products || [],
      })) as StockItem[];

      const { data: brands } = await supabase.from("brands").select("id, name, logo_url").order("name");
      const { data: categories } = await supabase.from("categories").select("id, name, image_url").order("name");
      const { data: origins } = await supabase.from("origins").select("id, name, logo_url").order("name");

      return {
        items: typedItems,
        brands: brands || [],
        categories: categories || [],
        origins: origins || [],
      } as CatalogResult;
    },
  });

  const result = useMemo(() => data ?? emptyResult, [data]);

  return {
    ...result,
    isLoading,
    error,
  };
}
