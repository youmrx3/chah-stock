import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare } from "lucide-react";
import type { StockItem } from "@/types/stock";

interface ProductCardProps {
  item: StockItem;
  currency: string;
  onAddToInquiry: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export function ProductCard({ item, currency, onAddToInquiry, onToggleFavorite, isFavorite }: ProductCardProps) {
  const imageUrl = item.product_images?.[0]?.image_url || item.image_url || "";
  const priceLabel = item.price_ht !== null
    ? new Intl.NumberFormat("fr-DZ", { style: "currency", currency, minimumFractionDigits: 0 }).format(item.price_ht)
    : "Prix sur demande";

  return (
    <div className="group rounded-3xl border bg-card/90 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-lg transition-all">
      <Link to={`/shop/product/${item.id}`} className="block">
        <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={item.description} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Aucune image</div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold line-clamp-2">{item.description}</p>
            {item.remaining === 0 ? (
              <Badge variant="destructive">Rupture</Badge>
            ) : (
              <Badge variant="outline">Dispo {item.remaining}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{item.reference || "Ref. interne"}</p>
          <div className="rounded-2xl border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Prix indicatif</p>
            <p className="text-sm font-bold text-foreground">{priceLabel}</p>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 flex items-center gap-2">
        <Button className="flex-1" size="sm" onClick={() => onAddToInquiry(item.id)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Demander devis
        </Button>
        {onToggleFavorite && (
          <Button
            variant="outline"
            size="sm"
            className={isFavorite ? "border-primary text-primary" : undefined}
            onClick={() => onToggleFavorite(item.id)}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary" : ""}`} />
          </Button>
        )}
      </div>
    </div>
  );
}
