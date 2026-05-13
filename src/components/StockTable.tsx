import { StockItem, CustomField } from "@/types/stock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, Image as ImageIcon, Package } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StockTableProps {
  items: StockItem[];
  customFields: CustomField[];
  currency: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
  onViewDetail: (item: StockItem) => void;
  onViewSubProducts: (item: StockItem) => void;
}

function getStockStatus(remaining: number, quantity: number) {
  if (remaining === 0) return { label: "Rupture", variant: "destructive" as const, dot: "bg-destructive" };
  if (remaining <= quantity * 0.2) return { label: "Stock bas", variant: "warning" as const, dot: "bg-warning" };
  return { label: "En stock", variant: "success" as const, dot: "bg-success" };
}

export function StockTable({ items, customFields, currency, selectedIds, onSelectionChange, onEdit, onDelete, onViewDetail, onViewSubProducts }: StockTableProps) {
  const isMobile = useIsMobile();

  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const activeCustomFields = customFields.filter(f => f.is_active);

  const getCustomFieldValue = (item: StockItem, fieldId: string) => {
    const cfv = item.custom_field_values?.find(v => v.custom_field_id === fieldId);
    return cfv?.value || "—";
  };

  const itemIds = items.map((item) => item.id);
  const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedIds.includes(id));
  const someSelected = itemIds.some((id) => selectedIds.includes(id));

  const handleToggleAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      onSelectionChange(Array.from(new Set([...selectedIds, ...itemIds])));
      return;
    }
    onSelectionChange(selectedIds.filter((id) => !itemIds.includes(id)));
  };

  const handleToggleOne = (id: string, checked: boolean | "indeterminate") => {
    if (checked) {
      onSelectionChange(Array.from(new Set([...selectedIds, id])));
      return;
    }
    onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="rounded-2xl border bg-card/90 backdrop-blur-sm overflow-hidden shadow-sm">
      {isMobile ? (
        <div className="p-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-3">Aucun produit trouve</p>
            </div>
          ) : (
            items.map((item) => {
              const status = getStockStatus(item.remaining, item.quantity);
              const productImage = item.product_images?.[0]?.image_url || item.image_url;
              const subCount = item.sub_products?.length || 0;
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-3 bg-background/70 space-y-3"
                  onClick={() => onViewDetail(item)}
                >
                  <div className="flex items-start justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start gap-3 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToggleOne(item.id, checked)}
                        aria-label={`Selectionner produit ${item.number}`}
                      />
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={item.description}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border bg-muted/50 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">#{item.number} - {item.description}</p>
                        <p className="text-xs text-muted-foreground truncate">Ref: {item.reference || "-"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{status.label}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground">Qte</p>
                      <p className="font-semibold">{item.quantity}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground">Reserve</p>
                      <p className="font-semibold">{item.reserved}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                      <p className="text-muted-foreground">Dispo</p>
                      <p className="font-semibold">{item.remaining}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Prix HT</span>
                    <span className="font-semibold">{formatPrice(item.price_ht)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sous-produits</span>
                    <Badge variant="outline">{subCount}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      className="h-10 rounded-lg"
                      onClick={() => onEdit(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-lg"
                      onClick={() => onViewSubProducts(item)}
                    >
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
      <div className="overflow-hidden [&_th]:border-r [&_th]:border-border/60 [&_th:last-child]:border-r-0 [&_td]:border-r [&_td]:border-border/40 [&_td:last-child]:border-r-0">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35 border-b">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={handleToggleAll}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead className="w-14 font-semibold text-xs uppercase tracking-wider text-muted-foreground">N°</TableHead>
              <TableHead className="w-20 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Image</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground min-w-[160px]">Description</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Réf.</TableHead>
              <TableHead className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">Qté</TableHead>
              <TableHead className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">Rés.</TableHead>
              <TableHead className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">Disp.</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Prix HT</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Fourn.</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Catégorie</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Marque</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Origine</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-44">Sous-produits</TableHead>
              {activeCustomFields.map(field => (
                <TableHead key={field.id} className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  {field.name}
                </TableHead>
              ))}
              <TableHead className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Statut</TableHead>
              <TableHead className="w-28 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-4 sticky right-0 bg-muted/35 z-10 border-l">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const status = getStockStatus(item.remaining, item.quantity);
              const productImage = item.product_images?.[0]?.image_url || item.image_url;
              const subCount = item.sub_products?.length || 0;
              return (
                <TableRow key={item.id} className="group cursor-pointer hover:bg-muted/25 transition-colors border-b border-border/50" onClick={() => onViewDetail(item)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(checked) => handleToggleOne(item.id, checked)}
                      aria-label={`Sélectionner produit ${item.number}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.number}
                  </TableCell>
                  <TableCell className="py-2">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={item.description}
                        className="w-12 h-12 object-cover rounded-lg border shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border bg-muted/50 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm leading-tight">{item.description}</p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.reference ? (
                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                        {item.reference}
                      </code>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium text-sm tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {item.reserved > 0 ? (
                      <span className="text-warning font-medium">{item.reserved}</span>
                    ) : (
                      <span className="text-muted-foreground/50">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium text-sm tabular-nums">{item.remaining}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatPrice(item.price_ht)}</TableCell>
                  <TableCell className="text-sm">{item.fournisseur?.name || <span className="text-muted-foreground/50">—</span>}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {item.category?.image_url ? (
                        <img src={item.category.image_url} alt={item.category.name} className="h-6 w-6 rounded border object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded border bg-muted" />
                      )}
                      <span>{item.category?.name || <span className="text-muted-foreground/50">—</span>}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {item.brand?.logo_url ? (
                        <img src={item.brand.logo_url} alt={item.brand.name} className="h-6 w-6 rounded border object-contain bg-white" />
                      ) : (
                        <div className="h-6 w-6 rounded border bg-muted" />
                      )}
                      <span>{item.brand?.name || <span className="text-muted-foreground/50">—</span>}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {item.origin?.logo_url ? (
                        <img src={item.origin.logo_url} alt={item.origin.name} className="h-6 w-6 rounded border object-contain bg-white" />
                      ) : (
                        <div className="h-6 w-6 rounded border bg-muted" />
                      )}
                      <span>{item.origin?.name || <span className="text-muted-foreground/50">—</span>}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm" onClick={(e) => e.stopPropagation()}>
                    {subCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{subCount}</Badge>
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => onViewSubProducts(item)}>
                          Voir
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  {activeCustomFields.map(field => (
                    <TableCell key={field.id} className="text-sm">
                      {getCustomFieldValue(item, field.id)}
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      <span className="text-xs font-medium">{status.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 align-middle sticky right-0 bg-card/95 backdrop-blur-sm z-10 border-l">
                    <div className="flex gap-2 justify-end opacity-70 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border/70"
                        onClick={() => onEdit(item)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border/70 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={16 + activeCustomFields.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Aucun produit trouvé</p>
                      <p className="text-xs text-muted-foreground/70">Essayez de modifier vos filtres</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
