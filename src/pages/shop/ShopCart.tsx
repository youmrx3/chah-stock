import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useInquiryCart } from "@/hooks/useInquiryCart";
import { useShopCatalog } from "@/hooks/useShopCatalog";
import { useShopAuth } from "@/hooks/useShopAuth";
import { useShopInquiries } from "@/hooks/useShopInquiries";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";

export default function ShopCart() {
  const navigate = useNavigate();
  const { items: cartItems, updateItem, removeItem, clear } = useInquiryCart();
  const { items: catalogItems } = useShopCatalog();
  const { user } = useShopAuth();
  const { submitInquiry } = useShopInquiries(user?.id ?? null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const detailedItems = useMemo(() => {
    return cartItems.map((cartItem) => {
      const product = catalogItems.find((item) => item.id === cartItem.stock_item_id);
      return { ...cartItem, product };
    });
  }, [cartItems, catalogItems]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Connectez-vous pour envoyer une demande.");
      navigate("/shop/account");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Ajoutez au moins un produit.");
      return;
    }

    setSubmitting(true);
    try {
      await submitInquiry({
        userId: user.id,
        message,
        items: cartItems,
      });
      clear();
      setMessage("");
      toast.success("Demande envoyee. Nous revenons vers vous rapidement.");
      navigate("/shop/account");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi de la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container space-y-6">
        <ShopEmptyState title="Votre demande est vide" description="Ajoutez des produits depuis le catalogue." />
        <div>
          <Button asChild>
            <Link to="/shop/catalog">Voir le catalogue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-8">
      <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm animate-in">
        <h1 className="text-2xl font-bold">Demande de devis</h1>
        <p className="text-sm text-muted-foreground">Envoyez votre liste d'interet et nous confirmerons les prix.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
          {detailedItems.map((item) => (
            <div key={item.stock_item_id} className="rounded-2xl border bg-card/70 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold">{item.product?.description || "Produit"}</p>
                <p className="text-xs text-muted-foreground">{item.product?.reference || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateItem(item.stock_item_id, { quantity: Number(event.target.value) })}
                  className="w-20"
                />
                <Button variant="outline" size="sm" onClick={() => removeItem(item.stock_item_id)}>
                  Retirer
                </Button>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
          <Badge variant="outline">Infos supplementaires</Badge>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Precisez votre besoin, quantites, delais..."
            className="min-h-[140px]"
          />
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Envoi en cours..." : "Envoyer la demande"}
          </Button>
          <p className="text-xs text-muted-foreground">Les prix sont confirmes apres validation.</p>
        </section>
      </div>
    </div>
  );
}
