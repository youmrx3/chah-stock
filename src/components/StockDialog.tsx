import { useEffect, useState, useRef } from "react";
import { StockItem, CustomField, Brand, Origin, Fournisseur, Category, SubProduct } from "@/types/stock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadProductImage } from "@/lib/storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubproductManager } from "@/components/SubproductManager";

interface LocalSubProduct extends SubProduct {
  id: string;
}

interface StockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: StockItem | null;
  currency?: string;
  customFields: CustomField[];
  brands: Brand[];
  origins: Origin[];
  fournisseurs: Fournisseur[];
  categories: Category[];
  onSave: (item: Omit<StockItem, "id" | "created_at" | "updated_at">) => Promise<unknown>;
  onUpdate: (id: string, item: Partial<StockItem>) => Promise<void>;
  onUpdateCustomFieldValue: (stockItemId: string, customFieldId: string, value: string) => Promise<void>;
  onReplaceProductImages: (stockItemId: string, imageUrls: string[]) => Promise<void>;
  onAddSubProduct: (parentProductId: string, name: string, quantity: number, price: number) => Promise<void>;
  onDeleteSubProduct: (subProductLinkId: string) => Promise<void>;
  nextNumber: number;
}

export function StockDialog({
  open,
  onOpenChange,
  item,
  currency = "DZD",
  customFields,
  brands,
  origins,
  fournisseurs,
  categories,
  onSave,
  onUpdate,
  onUpdateCustomFieldValue,
  onReplaceProductImages,
  onAddSubProduct,
  onDeleteSubProduct,
  nextNumber,
}: StockDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [enableSubProducts, setEnableSubProducts] = useState(false);
  const [stagedSubProducts, setStagedSubProducts] = useState<LocalSubProduct[]>([]);
  const [editSubProducts, setEditSubProducts] = useState<LocalSubProduct[]>([]);
  const [currentStep, setCurrentStep] = useState<"product" | "subproducts">("product");
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [createdProductLabel, setCreatedProductLabel] = useState<string>("");
  
  const [formData, setFormData] = useState({
    number: nextNumber,
    description: "",
    quantity: 0,
    reference: "",
    price_ht: "",
    price_currency: "DZD" as "DZD",
    paid_amount: "0",
    reserved: 0,
    notes: "",
    image_url: null as string | null,
    client_id: "",
    brand_id: "",
    origin_id: "",
    fournisseur_id: "",
    category_id: "",
  });

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setCurrentStep("product");
      setCreatedProductId(null);
      setCreatedProductLabel("");
      setFormData({
        number: item.number,
        description: item.description,
        quantity: item.quantity,
        reference: item.reference || "",
        price_ht: item.price_ht?.toString() || "",
        price_currency: "DZD",
        paid_amount: (item.paid_amount || 0).toString(),
        reserved: item.reserved,
        notes: item.notes || "",
        image_url: item.image_url,
        client_id: item.client_id || "",
        brand_id: item.brand_id || "",
        origin_id: item.origin_id || "",
        fournisseur_id: item.fournisseur_id || "",
        category_id: item.category_id || "",
      });

      const mappedImages = (item.product_images || []).map((image) => image.image_url);
      setImages(mappedImages.length > 0 ? mappedImages : item.image_url ? [item.image_url] : []);
      setEditSubProducts((item.sub_products || []) as LocalSubProduct[]);
      
      // Set custom field values
      const values: Record<string, string> = {};
      item.custom_field_values?.forEach(cfv => {
        values[cfv.custom_field_id] = cfv.value || "";
      });
      setCustomFieldValues(values);
    } else {
      setCurrentStep("product");
      setCreatedProductId(null);
      setCreatedProductLabel("");
      setFormData({
        number: nextNumber,
        description: "",
        quantity: 0,
        reference: "",
        price_ht: "",
        price_currency: "DZD",
        paid_amount: "0",
        reserved: 0,
        notes: "",
        image_url: null,
        client_id: "",
        brand_id: "",
        origin_id: "",
        fournisseur_id: "",
        category_id: "",
      });
      setCustomFieldValues({});
      setImages([]);
      setEditSubProducts([]);
      setEnableSubProducts(false);
      setStagedSubProducts([]);
    }
  }, [item, nextNumber, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner des images valides");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Une image dépasse 5MB");
        continue;
      }
      const url = await uploadProductImage(file);
      if (url) urls.push(url);
    }

    setUploading(false);

    if (urls.length > 0) {
      setImages((prev) => {
        const next = [...prev, ...urls];
        setFormData((curr) => ({ ...curr, image_url: next[0] || null }));
        return next;
      });
      toast.success("Images téléchargées");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      number: formData.number,
      description: formData.description,
      quantity: formData.quantity,
      reference: formData.reference,
      price_ht: formData.price_ht ? parseFloat(formData.price_ht) : null,
      price_currency: "DZD" as "DZD",
      paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : 0,
      reserved: formData.reserved,
      remaining: formData.quantity - formData.reserved,
      notes: formData.notes,
      image_url: images[0] || null,
      client_id: formData.client_id || null,
      brand_id: formData.brand_id || null,
      origin_id: formData.origin_id || null,
      fournisseur_id: formData.fournisseur_id || null,
      category_id: formData.category_id || null,
    };

    try {
      if (item) {
        await onUpdate(item.id, data);
        await onReplaceProductImages(item.id, images);
        // Update custom field values
        for (const [fieldId, value] of Object.entries(customFieldValues)) {
          await onUpdateCustomFieldValue(item.id, fieldId, value);
        }
      } else {
        const newItem = await onSave(data);
        // Add custom field values for new item
        if (newItem && typeof newItem === 'object' && 'id' in newItem) {
          const createdId = (newItem as StockItem).id;
          await onReplaceProductImages(createdId, images);
          for (const [fieldId, value] of Object.entries(customFieldValues)) {
            if (value) {
              await onUpdateCustomFieldValue(createdId, fieldId, value);
            }
          }
          if (enableSubProducts) {
            setCreatedProductId(createdId);
            setCreatedProductLabel(formData.description || `Produit #${formData.number}`);
            setCurrentStep("subproducts");
            return;
          }
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const activeCustomFields = customFields.filter(f => f.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg">
            {currentStep === "subproducts"
              ? "Étape 2: Ajouter des sous-produits"
              : item
              ? "Modifier le produit"
              : "Ajouter un produit"}
          </DialogTitle>
        </DialogHeader>
        {currentStep === "subproducts" && createdProductId ? (
          <div className="p-6 pt-4 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">Produit créé:</p>
              <p className="font-semibold">{createdProductLabel}</p>
            </div>

            <SubproductManager
              subproducts={stagedSubProducts}
              currency={currency}
              onAdd={async (name, quantity, price) => {
                await onAddSubProduct(createdProductId, name, quantity, price);
                setStagedSubProducts((prev) => [
                  ...prev,
                  {
                    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    parent_product_id: createdProductId,
                    name,
                    quantity,
                    price,
                  },
                ]);
              }}
              onDelete={async (id) => {
                if (!id.startsWith("local-")) {
                  await onDeleteSubProduct(id);
                }
                setStagedSubProducts((prev) => prev.filter((sp) => sp.id !== id));
              }}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Terminer
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Images du produit</Label>
            <div className="flex flex-wrap items-center gap-2">
              {images.map((url, index) => (
                <div className="relative" key={`${url}-${index}`}>
                  <img src={url} alt={`Produit ${index + 1}`} className="w-16 h-16 object-cover rounded-xl border" />
                  <button
                    type="button"
                    onClick={() => {
                      setImages((prev) => {
                        const next = prev.filter((_, i) => i !== index);
                        setFormData((curr) => ({ ...curr, image_url: next[0] || null }));
                        return next;
                      });
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs">Ajouter</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="number" className="text-xs">Numéro</Label>
              <Input
                id="number"
                type="number"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-xs">Référence</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                placeholder="Ex: YSX100GM"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>                        
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Nom du produit"
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reserved" className="text-xs">Réservé</Label>
              <Input
                id="reserved"
                type="number"
                value={formData.reserved}
                onChange={(e) =>
                  setFormData({ ...formData, reserved: parseInt(e.target.value) || 0 })
                }
                min={0}
                max={formData.quantity}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_ht" className="text-xs">Prix HT</Label>
              <Input
                id="price_ht"
                type="number"
                value={formData.price_ht}
                onChange={(e) =>
                  setFormData({ ...formData, price_ht: e.target.value })
                }
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Marque</Label>
              <Select value={formData.brand_id || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, brand_id: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune marque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Origine</Label>
              <Select value={formData.origin_id || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, origin_id: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune origine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {origins.map((origin) => (
                    <SelectItem key={origin.id} value={origin.id}>
                      {origin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Catégorie</Label>
              <Select value={formData.category_id || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Fournisseur</Label>
            <Select value={formData.fournisseur_id || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, fournisseur_id: value === "none" ? "" : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {fournisseurs.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Fournisseur, destination, etc."
              rows={2}
            />
          </div>

          {!item && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Ajouter des sous-produits</Label>
                  <p className="text-xs text-muted-foreground">Activer pour passer à une page dédiée après création du produit</p>
                </div>
                <Switch checked={enableSubProducts} onCheckedChange={setEnableSubProducts} />
              </div>
            </div>
          )}

          {item && (
            <div className="space-y-3 rounded-lg border p-3">
              <Label className="text-xs">Sous-produits</Label>
              <SubproductManager
                subproducts={editSubProducts}
                currency={currency}
                onAdd={async (name, quantity, price) => {
                  await onAddSubProduct(item.id, name, quantity, price);
                  setEditSubProducts((prev) => [
                    ...prev,
                    {
                      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      parent_product_id: item.id,
                      name,
                      quantity,
                      price,
                    },
                  ]);
                }}
                onDelete={async (id) => {
                  if (!id.startsWith("local-")) {
                    await onDeleteSubProduct(id);
                  }
                  setEditSubProducts((prev) => prev.filter((sp) => sp.id !== id));
                }}
              />
            </div>
          )}

          {activeCustomFields.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Champs personnalisés</h4>
              <div className="grid grid-cols-2 gap-3">
                {activeCustomFields.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id} className="text-xs">{field.name}</Label>
                    {field.field_type === 'boolean' ? (
                      <select
                        id={field.id}
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) => setCustomFieldValues(prev => ({
                          ...prev,
                          [field.id]: e.target.value
                        }))}
                        className="w-full h-10 px-3 rounded-md border bg-background"
                      >
                        <option value="">-</option>
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                      </select>
                    ) : (
                      <Input
                        id={field.id}
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) => setCustomFieldValues(prev => ({
                          ...prev,
                          [field.id]: e.target.value
                        }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" className="rounded-lg" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {item ? "Mettre à jour" : enableSubProducts ? "Continuer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
