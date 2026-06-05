import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useShopCatalog } from "@/hooks/useShopCatalog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";
import { useInquiryCart } from "@/hooks/useInquiryCart";
import { Search } from "lucide-react";
import { useState } from "react";

export default function ShopLanding() {
  const { settings } = useSiteSettings();
  const { items, categories, isLoading } = useShopCatalog();
  const { addItem } = useInquiryCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const featuredItems = items.slice(0, 6);
  const featuredCategories = categories.slice(0, 6);

  return (
    <div className="container space-y-10">
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-5">
            <Badge variant="outline">Catalogue professionnel</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {settings.company_name}
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Accedez a nos disponibilites et demandez un devis rapide. Commande possible avec ou sans compte.
              Les prix sont confirmes apres validation.
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]" id="shop-search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher un produit ou une reference"
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => navigate(`/shop/catalog${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`)}
              >
                Rechercher
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link to="/shop/catalog">Voir le catalogue</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/shop/cart">Demande de devis</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border bg-gradient-to-br from-muted/40 via-card/80 to-card/60 p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold">Ce que vous recevez</p>
              <p className="text-sm text-muted-foreground">Un devis clair, avec disponibilite et delais.</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Temps de reponse</p>
                <p className="text-sm font-semibold">Sous 24h ouvrables</p>
              </div>
              <div className="rounded-2xl border bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Suivi client</p>
                <p className="text-sm font-semibold">Un interlocuteur unique</p>
              </div>
              <div className="rounded-2xl border bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Paiement</p>
                <p className="text-sm font-semibold">Modalites flexibles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Categories phares</h2>
            <p className="text-sm text-muted-foreground">Acces rapide aux gammes principales.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop/categories">Tout voir</Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl border bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : featuredCategories.length === 0 ? (
          <ShopEmptyState title="Aucune categorie disponible" description="Ajoutez des categories dans l'administration." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                to={`/shop/catalog?category=${category.id}`}
                className="rounded-2xl border bg-card/70 p-5 flex items-center justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs text-muted-foreground">Voir les produits</p>
                </div>
                <Badge variant="outline">Catalogue</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Produits en vitrine</h2>
            <p className="text-sm text-muted-foreground">Une selection mise en avant.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop/catalog">Tout le catalogue</Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 rounded-2xl border bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : featuredItems.length === 0 ? (
          <ShopEmptyState title="Aucun produit disponible" description="Ajoutez des produits dans l'administration." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {featuredItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                currency={settings.currency}
                onAddToInquiry={addItem}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
