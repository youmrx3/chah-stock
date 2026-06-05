import { Outlet } from "react-router-dom";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useDynamicBranding } from "@/hooks/useDynamicBranding";

export function ShopLayout() {
  const { settings } = useSiteSettings();
  useDynamicBranding(settings);

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader settings={settings} />
      <main className="flex-1 py-6 sm:py-8">
        <Outlet />
      </main>
      <ShopFooter settings={settings} />
    </div>
  );
}
