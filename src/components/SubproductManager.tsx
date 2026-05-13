import { useState } from "react";
import { SubProduct } from "@/types/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface SubproductManagerProps {
  subproducts: SubProduct[];
  currency?: string;
  onAdd: (name: string, quantity: number, price: number) => Promise<void>;
  onUpdate?: (id: string, quantity: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function SubproductManager({
  subproducts,
  currency = "DZD",
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
}: SubproductManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Veuillez entrer un nom de sous-produit");
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    const priceNum = parseFloat(price) || 0;
    if (priceNum < 0) {
      toast.error("Le prix ne peut pas être négatif");
      return;
    }

    try {
      setAdding(true);
      await onAdd(name, qty, priceNum);
      setName("");
      setQuantity("1");
      setPrice("");
      setShowForm(false);
      toast.success("Sous-produit ajouté");
    } catch (error) {
      console.error("Error adding subproduct:", error);
      toast.error("Erreur lors de l'ajout du sous-produit");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const qty = parseInt(editQuantity);
    if (qty <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    try {
      setUpdating(true);
      if (onUpdate) {
        await onUpdate(id, qty);
        setEditingId(null);
        setEditQuantity("");
        toast.success("Sous-produit mis à jour");
      }
    } catch (error) {
      console.error("Error updating subproduct:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await onDelete(id);
      toast.success("Sous-produit supprimé");
    } catch (error) {
      console.error("Error deleting subproduct:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestion des Sous-produits</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {subproducts.length} sous-produit{subproducts.length !== 1 ? "s" : ""} ajouté{subproducts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowForm(!showForm)}
          size="sm"
          variant={showForm ? "secondary" : "default"}
          className="gap-2"
        >
          <Plus size={16} />
          Ajouter
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="sp-name">Nom du sous-produit</Label>
                  <Input
                    id="sp-name"
                    placeholder="Ex: Écran LCD, Connecteur, Batterie..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="sp-quantity">Quantité</Label>
                  <Input
                    id="sp-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="sp-price">Prix unitaire ({currency})</Label>
                  <Input
                    id="sp-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding || isLoading}
                  className="flex-1"
                >
                  {adding ? "Ajout..." : "Ajouter"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subproducts List */}
      {subproducts.length > 0 ? (
        <div className="space-y-2">
          {subproducts.map((sp) => (
            <div
              key={sp.id}
              className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                {editingId === sp.id ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium flex-1">{sp.name}</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Qté:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="w-16 h-8"
                      />
                      <Button
                        type="button"
                        onClick={() => handleUpdate(sp.id)}
                        disabled={updating}
                        size="sm"
                        className="gap-1"
                      >
                        {updating ? "..." : "OK"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditQuantity("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{sp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sp.quantity} × {formatCurrency(sp.price || 0)} = {formatCurrency((sp.price || 0) * sp.quantity)}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      Qté: {sp.quantity}
                    </Badge>
                  </div>
                )}
              </div>

              {editingId !== sp.id && (
                <div className="flex gap-2 ml-2">
                  {onUpdate && (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditingId(sp.id);
                        setEditQuantity(sp.quantity.toString());
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Éditer"
                    >
                      <Edit2 size={16} />
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => handleDelete(sp.id)}
                    disabled={deleting === sp.id}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun sous-produit ajouté pour le moment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
