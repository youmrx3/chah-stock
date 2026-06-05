import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useShopCatalog } from "@/hooks/useShopCatalog";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";

export default function ShopBrands() {
  const { brands, items, isLoading } = useShopCatalog();

  if (isLoading) {
    return (
      <div className="container">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl border bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="container">
        <ShopEmptyState title="Aucune marque disponible" />
      </div>
    );
  }

  return (
    <div className="container space-y-8">
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <h1 className="text-2xl font-bold">Marques</h1>
        <p className="text-sm text-muted-foreground">Nos partenaires et fabricants.</p>
      </section>
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {brands.map((brand) => {
            const count = items.filter((item) => item.brand_id === brand.id).length;
            return (
              <Link
                key={brand.id}
                to={`/shop/catalog?brand=${brand.id}`}
                className="rounded-2xl border bg-card/70 p-5 flex items-center justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <p className="font-semibold">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">{count} produits</p>
                </div>
                <Badge variant="outline">Voir</Badge>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
