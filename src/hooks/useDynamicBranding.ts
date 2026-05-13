import { useEffect } from "react";
import { SiteSettings } from "@/hooks/useSiteSettings";

export function useDynamicBranding(settings: SiteSettings) {
  useEffect(() => {
    document.title = settings.company_name || "Stock Management System";
  }, [settings.company_name]);

  useEffect(() => {
    if (!settings.logo_url) {
      // Reset to default favicon
      const existing = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (existing) {
        existing.href = "/favicon.ico";
        existing.type = "image/x-icon";
      }
      return;
    }

    // Remove all existing favicons to avoid conflicts
    document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach((el) => el.remove());

    // Determine type from URL
    const url = settings.logo_url;
    let type = "image/png";
    if (url.includes(".svg")) type = "image/svg+xml";
    else if (url.includes(".ico")) type = "image/x-icon";
    else if (url.includes(".jpg") || url.includes(".jpeg")) type = "image/jpeg";
    else if (url.includes(".webp")) type = "image/webp";

    // Create 32x32 favicon link
    const link32 = document.createElement("link");
    link32.rel = "icon";
    link32.type = type;
    link32.sizes = "32x32";
    link32.href = url;
    document.head.appendChild(link32);

    // Create 16x16 favicon link
    const link16 = document.createElement("link");
    link16.rel = "icon";
    link16.type = type;
    link16.sizes = "16x16";
    link16.href = url;
    document.head.appendChild(link16);

    // Also set apple-touch-icon for mobile
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      document.head.appendChild(appleLink);
    }
    appleLink.href = url;
  }, [settings.logo_url]);
}
