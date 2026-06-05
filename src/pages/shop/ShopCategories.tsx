import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useShopCatalog } from "@/hooks/useShopCatalog";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";

export default function ShopCategories() {
  const { categories, items, isLoading } = useShopCatalog();

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

  if (categories.length === 0) {
    return (
      <div className="container">
        <ShopEmptyState title="Aucune categorie disponible" />
      </div>
    );
  }

  return (
    <div className="container space-y-8">
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">Parcourez les gammes de produits.</p>
      </section>
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {categories.map((category) => {
            const count = items.filter((item) => item.category_id === category.id).length;
            return (
              <Link
                key={category.id}
                to={`/shop/catalog?category=${category.id}`}
                className="rounded-2xl border bg-card/70 p-5 flex items-center justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <p className="font-semibold">{category.name}</p>
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
