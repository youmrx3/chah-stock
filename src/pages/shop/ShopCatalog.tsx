import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useShopCatalog } from "@/hooks/useShopCatalog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";
import { useInquiryCart } from "@/hooks/useInquiryCart";
import { useShopFavorites } from "@/hooks/useShopFavorites";
import { useShopAuth } from "@/hooks/useShopAuth";

export default function ShopCatalog() {
  const { settings } = useSiteSettings();
  const { items, categories, brands, origins, isLoading } = useShopCatalog();
  const { addItem } = useInquiryCart();
  const { user } = useShopAuth();
  const { favorites, toggleFavorite } = useShopFavorites(user?.id ?? null);
  const [params, setParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(params.get("q") || "");
  const [categoryId, setCategoryId] = useState(params.get("category") || "all");
  const [brandId, setBrandId] = useState(params.get("brand") || "all");
  const [originId, setOriginId] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reference || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (categoryId !== "all" && item.category_id !== categoryId) return false;
      if (brandId !== "all" && item.brand_id !== brandId) return false;
      if (originId !== "all" && item.origin_id !== originId) return false;

      if (availability === "in" && item.remaining <= 0) return false;
      if (availability === "out" && item.remaining > 0) return false;

      const price = item.price_ht || 0;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;

      return true;
    });
  }, [items, searchTerm, categoryId, brandId, originId, availability, minPrice, maxPrice]);

  const hasFilters =
    searchTerm ||
    categoryId !== "all" ||
    brandId !== "all" ||
    originId !== "all" ||
    availability !== "all" ||
    minPrice ||
    maxPrice;

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryId("all");
    setBrandId("all");
    setOriginId("all");
    setAvailability("all");
    setMinPrice("");
    setMaxPrice("");
    setParams({});
  };

  return (
    <div className="container space-y-8">
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catalogue produits</h1>
            <p className="text-sm text-muted-foreground">{filteredItems.length} produits disponibles</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/shop/cart">Demande de devis</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un produit, reference..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtres avances
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes marques</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={originId} onValueChange={setOriginId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Origine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes origines</SelectItem>
              {origins.map((origin) => (
                <SelectItem key={origin.id} value={origin.id}>{origin.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Disponibilite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous stocks</SelectItem>
              <SelectItem value="in">En stock</SelectItem>
              <SelectItem value="out">Rupture</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Prix min"
            className="h-9"
          />
          <Input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Prix max"
            className="h-9"
          />
        </div>
      </section>

      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="h-72 rounded-2xl border bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <ShopEmptyState title="Aucun produit ne correspond" description="Ajustez les filtres ou contactez-nous pour un besoin specifique." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                currency={settings.currency}
                onAddToInquiry={addItem}
                onToggleFavorite={user ? toggleFavorite : undefined}
                isFavorite={favorites.includes(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {user && favorites.length > 0 && (
        <section className="rounded-3xl border bg-card/80 p-4 sm:p-6 animate-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Favoris</Badge>
            {favorites.length} produits en favoris.
          </div>
        </section>
      )}
    </div>
  );
}
