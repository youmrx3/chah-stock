import { useState } from "react";
import { StockItem, CustomField } from "@/types/stock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SubproductManager } from "@/components/SubproductManager";
import { CompanyExportProfile, exportProductToDoc, exportProductToPdf } from "@/lib/exports";
import { Download, FileText as FileTextIcon, Image as ImageIcon, Package, Tag, Hash, Calendar, Building2, Globe, Truck, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockItem | null;
  customFields: CustomField[];
  companyProfile: CompanyExportProfile;
  onAddSubProduct: (parentProductId: string, name: string, quantity: number, price: number) => Promise<void>;
  onUpdateSubProduct: (subProductLinkId: string, quantity: number) => Promise<void>;
  onDeleteSubProduct: (subProductLinkId: string) => Promise<void>;
}

function getStockStatus(remaining: number, quantity: number) {
  if (remaining === 0) return { label: "Rupture", variant: "destructive" as const };
  if (remaining <= quantity * 0.2) return { label: "Stock bas", variant: "warning" as const };
  return { label: "En stock", variant: "success" as const };
}

export function ProductDetailDialog({
  open,
  onOpenChange,
  item,
  customFields,
  companyProfile,
  onAddSubProduct,
  onUpdateSubProduct,
  onDeleteSubProduct,
}: ProductDetailDialogProps) {
  const [extraText, setExtraText] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!item) return null;

  const status = getStockStatus(item.remaining, item.quantity);
  const activeCustomFields = customFields.filter(f => f.is_active);

  const formatPrice = (price: number | null) => {
    if (price === null) return "-";
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: companyProfile.currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalAmount = (item.price_ht || 0) * item.quantity;
  const remainingPayment = Math.max(0, totalAmount - (item.paid_amount || 0));
  const images = item.product_images && item.product_images.length > 0
    ? item.product_images.map((img) => img.image_url)
    : item.image_url
      ? [item.image_url]
      : [];
  const displayedImage = images[activeImageIndex] || images[0];

  const getCustomFieldValue = (fieldId: string) => {
    const cfv = item.custom_field_values?.find(v => v.custom_field_id === fieldId);
    return cfv?.value || "-";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0">
        {images.length > 0 ? (
          <div className="relative w-full h-56 bg-muted">
            <img
              src={displayedImage}
              alt={item.description}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <div className="absolute top-3 right-3">
              <Badge variant={status.variant} className="text-sm px-3 py-1">
                {status.label}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-40 bg-muted flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
            <div className="absolute top-3 right-3">
              <Badge variant={status.variant} className="text-sm px-3 py-1">
                {status.label}
              </Badge>
            </div>
          </div>
        )}

        <div className="px-6 pb-6 space-y-5">
          <DialogHeader className="pt-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground font-mono">N° {item.number}</p>
                <DialogTitle className="text-xl mt-1">{item.description}</DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, index) => (
                <button key={`${url}-${index}`} type="button" onClick={() => setActiveImageIndex(index)}>
                  <img
                    src={url}
                    alt={`img-${index}`}
                    className={`h-16 w-16 rounded-md border object-cover ${index === activeImageIndex ? "ring-2 ring-primary" : ""}`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <MetricCard icon={Package} label="Quantité" value={item.quantity.toString()} />
            <MetricCard icon={Tag} label="Réservé" value={item.reserved.toString()} accent="warning" />
            <MetricCard icon={Hash} label="Restant" value={item.remaining.toString()} accent="success" />
            <MetricCard icon={Tag} label="Prix HT" value={formatPrice(item.price_ht)} />
            <MetricCard icon={Tag} label="Reste" value={formatPrice(remainingPayment)} accent="destructive" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricCard icon={Tag} label="Total" value={formatPrice(totalAmount)} />
            <MetricCard icon={Tag} label="Versement" value={formatPrice(item.paid_amount || 0)} accent="success" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Truck className="h-3 w-3" />Fournisseur</p>
              <p className="font-semibold text-sm">{item.fournisseur?.name || "-"}</p>
              {item.fournisseur?.phone && <p className="text-xs text-muted-foreground">{item.fournisseur.phone}</p>}
            </div>
            <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3" />Marque</p>
              <p className="font-semibold text-sm">{item.brand?.name || "-"}</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Globe className="h-3 w-3" />Origine</p>
              <p className="font-semibold text-sm">{item.origin?.name || "-"}</p>
            </div>
          </div>

          {/* Reference */}
          {item.reference && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted-foreground">Référence:</span>
              <code className="px-2 py-0.5 bg-muted rounded-md text-xs font-mono">{item.reference}</code>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileTextIcon className="h-4 w-4" />
                  Notes
                </div>
                <p className="text-sm leading-relaxed">{item.notes}</p>
              </div>
            </>
          )}

          {/* Custom fields */}
          {activeCustomFields.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Informations supplémentaires</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {activeCustomFields.map(field => (
                    <div key={field.id} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">{field.name}</span>
                      <span className="font-medium">{getCustomFieldValue(field.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Sous-produits</h4>
            <SubproductManager
              subproducts={item.sub_products || []}
              currency={companyProfile.currency}
              onAdd={async (name, quantity, price) => {
                await onAddSubProduct(item.id, name, quantity, price);
              }}
              onUpdate={async (id, quantity) => {
                await onUpdateSubProduct(id, quantity);
              }}
              onDelete={async (id) => {
                await onDeleteSubProduct(id);
              }}
            />
          </div>

          {/* Dates */}
          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Texte additionnel pour export</h4>
            <Textarea
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              placeholder="Ajouter un texte pour le cahier des charges..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs" onClick={() => { void exportProductToPdf(item, companyProfile, extraText); }}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs" onClick={() => exportProductToDoc(item, companyProfile, extraText)}>
                <Download className="h-3.5 w-3.5" /> DOC
              </Button>
            </div>
          </div>

          <Separator />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Créé: {item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR") : "-"}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Modifié: {item.updated_at ? new Date(item.updated_at).toLocaleDateString("fr-FR") : "-"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: string }) {
  const accentClass = accent === "warning" ? "text-warning" : accent === "success" ? "text-success" : accent === "destructive" ? "text-destructive" : "";
  return (
    <div className="rounded-xl border bg-muted/20 p-2.5 text-center space-y-0.5">
      <Icon className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
      <p className={`text-sm font-bold tracking-tight tabular-nums ${accentClass}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
