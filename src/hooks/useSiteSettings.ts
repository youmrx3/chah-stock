import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SiteSettings {
  company_name: string;
  company_subtitle: string;
  logo_url: string | null;
  company_address: string;
  company_email: string;
  company_phone: string;
  low_stock_threshold: string;
  currency: string;
}

const defaults: SiteSettings = {
  company_name: "Stock Management System",
  company_subtitle: "Professional Inventory Management",
  logo_url: null,
  company_address: "",
  company_email: "",
  company_phone: "",
  low_stock_threshold: "5",
  currency: "DZD",
};

const APP_CURRENCY = "DZD";

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      const map: Record<string, string | null> = {};
      data?.forEach((row: { key: string; value: string | null }) => {
        map[row.key] = row.value;
      });

      setSettings({
        company_name: map.company_name || defaults.company_name,
        company_subtitle: map.company_subtitle || defaults.company_subtitle,
        logo_url: map.logo_url || null,
        company_address: map.company_address || defaults.company_address,
        company_email: map.company_email || defaults.company_email,
        company_phone: map.company_phone || defaults.company_phone,
        low_stock_threshold: map.low_stock_threshold || defaults.low_stock_threshold,
        currency: APP_CURRENCY,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(async (key: string, value: string | null) => {
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value }, { onConflict: "key" });

      if (error) throw error;
      await fetchSettings();
      toast.success("Paramètre mis à jour");
    } catch (error) {
      console.error("Error updating setting:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  }, [fetchSettings]);

  return { settings, loading, updateSetting, refetch: fetchSettings };
}
