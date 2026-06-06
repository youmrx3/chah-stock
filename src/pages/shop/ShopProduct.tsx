import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useShopProduct } from "@/hooks/useShopProduct";
import { useInquiryCart } from "@/hooks/useInquiryCart";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";
import { ChevronLeft, MessageSquare } from "lucide-react";

export default function ShopProduct() {
  const { id } = useParams();
  const { settings } = useSiteSettings();
  const { addItem } = useInquiryCart();
  const { data, isLoading } = useShopProduct(id ?? null);

  const item = data?.item || null;
  const customFields = useMemo(() => (data?.customFields || []).filter((f) => f.is_active), [data]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="h-80 rounded-2xl border bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container py-10">
        <ShopEmptyState title="Produit introuvable" description="Ce produit n'est plus disponible." />
      </div>
    );
  }

  const images = item.product_images?.length ? item.product_images.map((img) => img.image_url) : item.image_url ? [item.image_url] : [];
  const displayImage = images[0];
  const priceLabel = item.price_ht !== null
    ? new Intl.NumberFormat("en-CA", { style: "currency", currency: settings.currency, minimumFractionDigits: 0 }).format(item.price_ht)
    : "Prix sur demande";

  return (
    <div className="container space-y-8">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/shop/catalog">
          <ChevronLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>
      </Button>

      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-card/80 overflow-hidden">
            {displayImage ? (
              <img src={displayImage} alt={item.description} className="w-full h-96 object-cover" />
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">Aucune image</div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold">{item.description}</h1>
              {item.remaining > 0 ? (
                <Badge variant="success">Disponible</Badge>
              ) : (
                <Badge variant="destructive">Rupture</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Ref: {item.reference || "-"}</p>
            <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-semibold">Prix indicatif</p>
              <p className="text-2xl font-bold">{priceLabel}</p>
              <p className="text-xs text-muted-foreground">Le prix final est confirme apres validation de votre demande.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {item.category?.name && <Badge variant="outline">{item.category.name}</Badge>}
              {item.brand?.name && <Badge variant="outline">{item.brand.name}</Badge>}
              {item.origin?.name && <Badge variant="outline">{item.origin.name}</Badge>}
            </div>
            <Button className="gap-2" onClick={() => addItem(item.id)}>
              <MessageSquare className="h-4 w-4" />
              Ajouter a la demande
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
          <h2 className="text-lg font-semibold">Specifications</h2>
          {customFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune specification personnalisee.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {customFields.map((field) => {
                const value = item.custom_field_values?.find((v) => v.custom_field_id === field.id)?.value || "-";
                return (
                  <div key={field.id} className="rounded-2xl border bg-card/70 p-3">
                    <p className="text-xs text-muted-foreground">{field.name}</p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                );
              })}
            </div>
          )}
          {item.notes && (
            <div className="rounded-2xl border bg-card/70 p-4">
              <h3 className="text-sm font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
            </div>
          )}
        </div>
        <div className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
          <h2 className="text-lg font-semibold">Disponibilite</h2>
          <div className="rounded-2xl border bg-card/70 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Quantite</p>
            <p className="text-xl font-bold">{item.quantity}</p>
            <p className="text-sm text-muted-foreground">Restant: {item.remaining}</p>
            <p className="text-sm text-muted-foreground">Reserve: {item.reserved}</p>
          </div>
          {item.sub_products && item.sub_products.length > 0 && (
            <div className="rounded-2xl border bg-card/70 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Sous-produits</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                {item.sub_products.map((sub) => (
                  <li key={sub.id}>{sub.name} — {sub.quantity}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
