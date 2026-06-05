import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, User, MessageSquare } from "lucide-react";
import { useShopAuth } from "@/hooks/useShopAuth";
import { useInquiryCart } from "@/hooks/useInquiryCart";
import type { SiteSettings } from "@/hooks/useSiteSettings";

interface ShopHeaderProps {
  settings: SiteSettings;
}

export function ShopHeader({ settings }: ShopHeaderProps) {
  const { user } = useShopAuth();
  const { totalItems } = useInquiryCart();

  return (
    <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="container py-4 flex items-center justify-between gap-4">
        <Link to="/shop" className="flex items-center gap-3">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-11 w-11 rounded-2xl object-contain ring-1 ring-border" />
          ) : (
            <div className="h-11 w-11 rounded-2xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <p className="text-lg font-bold tracking-tight">{settings.company_name}</p>
            <p className="text-xs text-muted-foreground">Catalogue & devis</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/shop/account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user ? "Compte" : "Connexion"}</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="relative">
            <Link to="/shop/cart" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Demande</span>
              {totalItems > 0 && (
                <Badge variant="default" className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1.5 text-[10px]">{totalItems}</Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
