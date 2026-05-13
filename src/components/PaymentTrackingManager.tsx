import { useState, useMemo } from "react";
import { StockItem, Client, SubProduct } from "@/types/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Clock, CheckCircle, TrendingUp, Package } from "lucide-react";
import { toast } from "sonner";

interface PaymentRecord {
  id: string;
  client_id: string;
  product_id: string | null;
  sub_product_id: string | null;
  amount_willing_to_pay: number;
  amount_paid: number;
  status: "pending" | "partial" | "completed";
  notes?: string;
  created_at?: string;
  product?: StockItem;
  sub_product?: SubProduct;
  client?: Client;
}

interface PaymentTrackingManagerProps {
  items: StockItem[];
  clients: Client[];
  currency: string;
  paymentRecords: PaymentRecord[];
  onAddPayment: (
    clientId: string,
    productId: string | null,
    subProductId: string | null,
    amountWillingToPay: number,
    amountPaid: number,
    notes: string
  ) => Promise<void>;
  onUpdatePayment: (
    id: string,
    updates: {
      amount_paid?: number;
      amount_willing_to_pay?: number;
      status?: "pending" | "partial" | "completed";
      notes?: string;
    }
  ) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
}

export function PaymentTrackingManager({
  items,
  clients,
  currency,
  paymentRecords,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}: PaymentTrackingManagerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedSubProductId, setSelectedSubProductId] = useState<string>("");
  const [productQuantity, setProductQuantity] = useState<string>("1");
  const [subProductQuantity, setSubProductQuantity] = useState<string>("1");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "partial" | "completed">("pending");
  const [saving, setSaving] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    })
      .format(value)
      .replace(/[\u00A0\u202F]/g, " ");

  const selectedProduct = items.find((item) => item.id === selectedProductId);
  const selectedSubProduct = selectedProduct?.sub_products?.find(
    (sp) => sp.id === selectedSubProductId
  );

  // Calculate item total price based on quantity
  const getItemTotal = () => {
    const productQty = Math.max(1, parseInt(productQuantity) || 1);
    const subQty = selectedSubProduct ? Math.max(1, parseInt(subProductQuantity) || 1) : 0;
    const productTotal = (selectedProduct?.price_ht || 0) * productQty;
    const subProductTotal = selectedSubProduct ? (selectedSubProduct.price || 0) * subQty : 0;
    return productTotal + subProductTotal;
  };

  const isProductSelected = selectedProductId || selectedSubProductId;
  const itemTotal = getItemTotal();
  const productQty = Math.max(1, parseInt(productQuantity) || 1);
  const subQty = selectedSubProduct ? Math.max(1, parseInt(subProductQuantity) || 1) : 0;
  const availableProductQty = Math.max(0, selectedProduct?.remaining || 0);
  const availableSubProductQty = Math.max(0, selectedSubProduct?.quantity || 0);
  const productPart = (selectedProduct?.price_ht || 0) * productQty;
  const subProductPart = selectedSubProduct ? (selectedSubProduct.price || 0) * subQty : 0;
  const amountPaidNum = parseFloat(amountPaid) || 0;
  const remaining = Math.max(0, itemTotal - amountPaidNum);
  const percentage = itemTotal > 0 ? (amountPaidNum / itemTotal) * 100 : 0;

  const enrichedRecords: PaymentRecord[] = useMemo(() => {
    const subProductsById = new Map<string, SubProduct>();
    items.forEach((item) => {
      (item.sub_products || []).forEach((sp) => subProductsById.set(sp.id, sp));
    });

    return paymentRecords.map((record) => {
      const amountWilling = Math.max(0, Number(record.amount_willing_to_pay) || 0);
      const amountPaid = Math.max(0, Number(record.amount_paid) || 0);
      const normalizedStatus: PaymentRecord["status"] =
        amountPaid === 0
          ? "pending"
          : amountPaid >= amountWilling
          ? "completed"
          : "partial";

      return {
        ...record,
        amount_willing_to_pay: amountWilling,
        amount_paid: amountPaid,
        status: normalizedStatus,
        client: record.client || clients.find((c) => c.id === record.client_id),
        product: record.product || items.find((i) => i.id === record.product_id),
        sub_product:
          record.sub_product ||
          (record.sub_product_id ? subProductsById.get(record.sub_product_id) : undefined),
      };
    });
  }, [paymentRecords, items, clients]);

  const handleAddPayment = async () => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    if (!selectedProductId && !selectedSubProductId) {
      toast.error("Veuillez sélectionner un produit ou un sous-produit");
      return;
    }

    if (itemTotal <= 0) {
      toast.error("Le prix total doit être supérieur à 0");
      return;
    }

    if (amountPaidNum < 0) {
      toast.error("Le montant versé ne peut pas être négatif");
      return;
    }

    if (selectedProduct && productQty > availableProductQty) {
      toast.error(`Quantite produit insuffisante. Disponible: ${availableProductQty}`);
      return;
    }

    if (selectedSubProduct && subQty > availableSubProductQty) {
      toast.error(`Quantite sous-produit insuffisante. Disponible: ${availableSubProductQty}`);
      return;
    }

    // Validate status matches payment
    if (paymentStatus === "completed" && amountPaidNum < itemTotal) {
      toast.error("Si vous marquez comme 'Entièrement payé', le montant versé doit égaler le total");
      return;
    }

    if (paymentStatus === "pending" && amountPaidNum > 0) {
      toast.error("Si le client a payé quelque chose, marquez comme 'Paiement partiel' ou 'Entièrement payé'");
      return;
    }

    try {
      setSaving(true);
      await onAddPayment(
        selectedClientId,
        selectedSubProductId ? null : (selectedProductId || null),
        selectedSubProductId || null,
        itemTotal,
        amountPaidNum,
        [
          `Qté produit: ${productQty}`,
          selectedSubProduct ? `Qté sous-produit: ${subQty}` : null,
          notes.trim() || null,
        ]
          .filter(Boolean)
          .join(" | ")
      );

      toast.success("Suivi de paiement enregistré");
      // Reset form
      setAmountPaid("");
      setNotes("");
      setSelectedProductId("");
      setSelectedSubProductId("");
      setProductQuantity("1");
      setSubProductQuantity("1");
      setPaymentStatus("pending");
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsCompleted = async (record: PaymentRecord) => {
    try {
      await onUpdatePayment(record.id, {
        amount_paid: record.amount_willing_to_pay,
        status: "completed",
      });
      toast.success("Paiement marqué comme complet");
    } catch (error) {
      console.error("Error marking payment completed:", error);
      toast.error("Impossible de mettre à jour ce suivi");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await onDeletePayment(id);
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const recordsByStatus = useMemo(() => {
    return {
      pending: enrichedRecords.filter((r) => r.status === "pending"),
      partial: enrichedRecords.filter((r) => r.status === "partial"),
      completed: enrichedRecords.filter((r) => r.status === "completed"),
    };
  }, [enrichedRecords]);

  const totalWillingToPay = useMemo(
    () => enrichedRecords.reduce((sum, r) => sum + r.amount_willing_to_pay, 0),
    [enrichedRecords]
  );

  const totalPaid = useMemo(() => enrichedRecords.reduce((sum, r) => sum + r.amount_paid, 0), [enrichedRecords]);
  const totalRemaining = Math.max(0, totalWillingToPay - totalPaid);

  return (
    <div className="space-y-6">
      {/* Add Payment Form */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus size={20} />
            Enregistrer un suivi de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Client *</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name || client.email || "Client"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product & Quantity Selection */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Package size={16} />
              Produit/Service acheté *
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Produit *</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => {
                    setSelectedProductId(val);
                    setSelectedSubProductId("");
                    setProductQuantity("1");
                    setSubProductQuantity("1");
                  }}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        #{item.number} - {item.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Quantité produit *</Label>
                <Input
                  type="number"
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  className="text-sm"
                />
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">Disponible: {availableProductQty}</p>
                )}
              </div>
            </div>

            {/* Sub-Product Selection */}
            {selectedProduct?.sub_products && selectedProduct.sub_products.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">
                  Ou sélectionner un sous-produit (optionnel)
                </p>
                <Select
                  value={selectedSubProductId || "__none__"}
                  onValueChange={(value) => {
                    const nextValue = value === "__none__" ? "" : value;
                    setSelectedSubProductId(nextValue);
                    setSubProductQuantity("1");
                  }}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Aucun sous-produit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-32">
                    <SelectItem value="__none__">Aucun (utiliser le produit)</SelectItem>
                    {selectedProduct.sub_products?.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedSubProductId && (
                  <div className="pt-2">
                    <Label className="text-xs">Quantité sous-produit *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={subProductQuantity}
                      onChange={(e) => setSubProductQuantity(e.target.value)}
                      className="text-sm"
                    />
                    {selectedSubProduct && (
                      <p className="text-xs text-muted-foreground mt-1">Disponible: {availableSubProductQty}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Summary */}
          {isProductSelected && itemTotal > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produit:</span>
                  <span className="font-medium">
                    {selectedProduct?.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix unitaire:</span>
                  <span className="font-medium">
                    {formatCurrency(selectedProduct?.price_ht || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Qté produit:</span>
                  <span className="font-medium">{productQty}</span>
                </div>
                {selectedSubProduct && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-produit:</span>
                    <span className="font-medium">{selectedSubProduct.name}</span>
                  </div>
                )}
                {selectedSubProduct && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qté sous-produit:</span>
                    <span className="font-medium">{subQty}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Calcul:</span>
                  <span>{formatCurrency(productPart)} + {formatCurrency(subProductPart)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="font-semibold">Total à payer:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(itemTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment & Status Section */}
          {isProductSelected && itemTotal > 0 && (
            <div className="space-y-4">
              {/* Amount Paid */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Montant versé (DA) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  min="0"
                  max={itemTotal}
                  className="text-base"
                />
                {amountPaidNum > 0 && amountPaidNum < itemTotal && (
                  <p className="text-xs text-orange-600">
                    Reste à payer: {formatCurrency(itemTotal - amountPaidNum)}
                  </p>
                )}
              </div>

              {/* Payment Status Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Statut du paiement *</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="status"
                      value="pending"
                      checked={paymentStatus === "pending"}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      disabled={amountPaidNum > 0}
                    />
                    <div>
                      <p className="font-medium text-sm">En attente</p>
                      <p className="text-xs text-muted-foreground">Pas encore payé</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="status"
                      value="partial"
                      checked={paymentStatus === "partial"}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      disabled={amountPaidNum === 0 || amountPaidNum >= itemTotal}
                    />
                    <div>
                      <p className="font-medium text-sm">Paiement partiel</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(amountPaidNum)} payé</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 bg-green-50">
                    <input
                      type="radio"
                      name="status"
                      value="completed"
                      checked={paymentStatus === "completed"}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      disabled={amountPaidNum < itemTotal}
                    />
                    <div>
                      <p className="font-medium text-sm">Entièrement payé</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(itemTotal)} payé</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span className="text-lg">{formatCurrency(itemTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Versé:</span>
                    <span className="font-semibold">{formatCurrency(amountPaidNum)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between text-orange-700">
                      <span>Reste:</span>
                      <span className="font-semibold">{formatCurrency(remaining)}</span>
                    </div>
                  )}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(0)}% payé</p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes (optionnel)</Label>
                <Textarea
                  placeholder="Ajouter une note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleAddPayment}
            disabled={
              saving || !selectedClientId || !isProductSelected || itemTotal === 0
            }
            className="w-full gap-2 py-5 text-base"
          >
            <Plus size={18} />
            {saving ? "Enregistrement..." : "Enregistrer le suivi"}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {enrichedRecords.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Total inscrit</p>
                  <p className="text-sm sm:text-lg font-bold leading-tight break-all">{formatCurrency(totalWillingToPay)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Total versé</p>
                  <p className="text-sm sm:text-lg font-bold leading-tight break-all">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">À verser</p>
                  <p className="text-sm sm:text-lg font-bold leading-tight break-all">{formatCurrency(totalRemaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Enregistrements</p>
                  <p className="text-sm sm:text-lg font-bold leading-tight break-all">{enrichedRecords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Records by Status */}
      {enrichedRecords.length > 0 ? (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-muted/60 w-full justify-start overflow-x-auto whitespace-nowrap p-1 gap-1">
            <TabsTrigger value="all" className="shrink-0 text-[11px] sm:text-sm">Tous ({enrichedRecords.length})</TabsTrigger>
            <TabsTrigger value="pending" className="shrink-0 text-[11px] sm:text-sm">En attente ({recordsByStatus.pending.length})</TabsTrigger>
            <TabsTrigger value="partial" className="shrink-0 text-[11px] sm:text-sm">Partiels ({recordsByStatus.partial.length})</TabsTrigger>
            <TabsTrigger value="completed" className="shrink-0 text-[11px] sm:text-sm">Complétés ({recordsByStatus.completed.length})</TabsTrigger>
            <TabsTrigger value="history" className="shrink-0 text-[11px] sm:text-sm">Historique</TabsTrigger>
          </TabsList>

          {["all", "pending", "partial", "completed"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-3">
              {(tabValue === "all" ? enrichedRecords : enrichedRecords.filter((r) => r.status === tabValue)).map(
                (record) => (
                  <Card
                    key={record.id}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        record.status === "pending"
                          ? "hsl(var(--warning))"
                          : record.status === "partial"
                          ? "hsl(var(--secondary))"
                          : "hsl(var(--success))",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold break-words">{record.client?.name || record.client?.email || "-"}</p>
                              <Badge
                                variant={
                                  record.status === "pending"
                                    ? "outline"
                                    : record.status === "partial"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {record.status === "pending"
                                  ? "En attente"
                                  : record.status === "partial"
                                  ? "Partiel"
                                  : "Complété"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              {record.sub_product_id ? `Sous-produit: ${record.sub_product?.name}` : `Produit: ${record.product?.description}`}
                            </p>
                            {record.notes && (
                              <p className="text-sm text-muted-foreground italic break-words">Note: {record.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                            {record.status !== "completed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 flex-1 sm:flex-none"
                                onClick={() => handleMarkAsCompleted(record)}
                              >
                                Marquer payé
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 sm:w-auto text-destructive hover:text-destructive shrink-0"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                          <div className="min-w-0">
                            <p className="text-muted-foreground">Montant inscrit</p>
                            <p className="font-semibold break-all leading-tight">{formatCurrency(record.amount_willing_to_pay)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground">Montant versé</p>
                            <p className="font-semibold text-green-600 break-all leading-tight">{formatCurrency(record.amount_paid)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground">Reste</p>
                            <p className="font-semibold text-orange-600 break-all leading-tight">
                              {formatCurrency(Math.max(0, record.amount_willing_to_pay - record.amount_paid))}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-600"
                              style={{
                                width: `${
                                  record.amount_willing_to_pay > 0
                                    ? Math.min(100, (record.amount_paid / record.amount_willing_to_pay) * 100)
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">
                            {record.amount_willing_to_pay > 0
                              ? Math.min(100, (record.amount_paid / record.amount_willing_to_pay) * 100).toFixed(0)
                              : 0}
                            %
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Ajouté le: {record.created_at ? new Date(record.created_at).toLocaleDateString("fr-FR") : "-"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </TabsContent>
          ))}

          <TabsContent value="history" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique des transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {enrichedRecords.map((record) => {
                    const remainingAmount = Math.max(0, record.amount_willing_to_pay - record.amount_paid);
                    return (
                      <div key={`history-${record.id}`} className="rounded-lg border p-3 bg-muted/20">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <p className="font-medium text-sm break-words">
                            {record.client?.name || record.client?.email || "Client"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {record.created_at ? new Date(record.created_at).toLocaleString("fr-FR") : "-"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 break-words">
                          {record.sub_product_id
                            ? `Sous-produit: ${record.sub_product?.name || "-"}`
                            : `Produit: ${record.product?.description || "-"}`}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <p className="break-all">Total: <span className="font-semibold">{formatCurrency(record.amount_willing_to_pay)}</span></p>
                          <p className="break-all">Versé: <span className="font-semibold text-green-700">{formatCurrency(record.amount_paid)}</span></p>
                          <p className="break-all">Reste: <span className="font-semibold text-orange-700">{formatCurrency(remainingAmount)}</span></p>
                        </div>
                        {record.notes && (
                          <p className="text-xs text-muted-foreground mt-2">{record.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm text-muted-foreground">Aucun suivi de paiement pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
