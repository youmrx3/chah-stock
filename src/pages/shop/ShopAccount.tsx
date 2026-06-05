import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShopAuth } from "@/hooks/useShopAuth";
import { useShopInquiries } from "@/hooks/useShopInquiries";
import { Link } from "react-router-dom";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";

export default function ShopAccount() {
  const { user, signOut } = useShopAuth();
  const { inquiries, loading } = useShopInquiries(user?.id ?? null);

  if (!user) {
    return (
      <div className="container space-y-6">
        <ShopEmptyState title="Connectez-vous" description="Accedez a vos demandes et favoris." />
        <Button asChild>
          <Link to="/shop/auth">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container space-y-8">
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in">
        <div>
          <h1 className="text-2xl font-bold">Mon compte</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>Se deconnecter</Button>
      </section>

      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
        <h2 className="text-lg font-semibold">Mes demandes</h2>
        {loading ? (
          <div className="h-32 rounded-2xl border bg-muted/40 animate-pulse" />
        ) : inquiries.length === 0 ? (
          <ShopEmptyState title="Aucune demande" description="Ajoutez des produits et envoyez une demande." />
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-2xl border bg-card/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Demande #{inquiry.id.slice(0, 6)}</p>
                  <Badge variant="outline">{inquiry.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Envoyee le {new Date(inquiry.created_at || "").toLocaleDateString("fr-FR")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
