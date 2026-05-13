import { useState } from "react";
import { StockItem } from "@/types/stock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, AlertCircle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface OrderStatusProps {
  product: StockItem;
  currency: string;
  onUpdatePayment: (id: string, paidAmount: number) => Promise<void>;
  onUpdateStatus?: (id: string, status: "pending" | "processing" | "completed") => Promise<void>;
}

type OrderStatus = "pending" | "processing" | "completed";

export function OrderStatus({ product, currency, onUpdatePayment, onUpdateStatus }: OrderStatusProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [newAmount, setNewAmount] = useState(product.paid_amount?.toString() || "0");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("pending");

  const total = (product.price_ht || 0) * product.quantity;
  const remaining = Math.max(0, total - (product.paid_amount || 0));
  const paymentPercentage = total > 0 ? ((product.paid_amount || 0) / total) * 100 : 0;

  // Determine status colors
  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case "completed":
        return "bg-emerald-100 text-emerald-900";
      case "processing":
        return "bg-blue-100 text-blue-900";
      case "pending":
      default:
        return "bg-amber-100 text-amber-900";
    }
  };

  const getStatusLabel = (s: OrderStatus) => {
    switch (s) {
      case "completed":
        return "Complété";
      case "processing":
        return "En cours";
      case "pending":
      default:
        return "En attente";
    }
  };

  const getStatusIcon = (s: OrderStatus) => {
    switch (s) {
      case "completed":
        return <CheckCircle2 size={16} />;
      case "processing":
        return <Clock size={16} />;
      case "pending":
      default:
        return <AlertCircle size={16} />;
    }
  };

  const handleUpdatePayment = async () => {
    const amount = parseFloat(newAmount) || 0;
    if (amount < 0) {
      toast.error("Le montant ne peut pas être négatif");
      return;
    }
    if (amount > total) {
      toast.error(`Le montant ne peut pas dépasser le total (${total})`);
      return;
    }

    try {
      setSaving(true);
      await onUpdatePayment(product.id, amount);
      setEditOpen(false);
      toast.success("Paiement mis à jour");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Paiement</Label>
          <span className="text-sm text-muted-foreground">
            {paymentPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
            style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Amount Details */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-muted-foreground text-xs">Total</p>
          <p className="font-semibold">
            {new Intl.NumberFormat("fr-DZ", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(total)}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs">Versé</p>
          <p className="font-semibold text-emerald-700">
            {new Intl.NumberFormat("fr-DZ", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(product.paid_amount || 0)}
          </p>
        </div>
        <div className={remaining > 0 ? "bg-red-50 rounded-lg p-3" : "bg-green-50 rounded-lg p-3"}>
          <p className="text-muted-foreground text-xs">Reste</p>
          <p className={`font-semibold ${remaining > 0 ? "text-red-700" : "text-green-700"}`}>
            {new Intl.NumberFormat("fr-DZ", {
              style: "currency",
              currency,
              minimumFractionDigits: 0,
            }).format(remaining)}
          </p>
        </div>
      </div>

      {/* Order Status */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold">Statut de la commande</Label>
        </div>
        <div className="flex gap-2">
          {(["pending", "processing", "completed"] as OrderStatus[]).map((s) => (
            <Button
              key={s}
              onClick={() => {
                setStatus(s);
                if (onUpdateStatus) onUpdateStatus(product.id, s);
              }}
              variant={status === s ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1"
            >
              {getStatusIcon(s)}
              <span className="hidden sm:inline">{getStatusLabel(s)}</span>
              <span className="sm:hidden">{s === "pending" ? "⏳" : s === "processing" ? "⚙️" : "✓"}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Edit Payment Button */}
      <div className="pt-2">
        <Button
          onClick={() => setEditOpen(true)}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <Edit size={16} />
          Modifier le paiement
        </Button>
      </div>

      {/* Edit Payment Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Total</Label>
              <div className="mt-2 p-3 bg-muted rounded text-sm font-medium">
                {new Intl.NumberFormat("fr-DZ", {
                  style: "currency",
                  currency,
                  minimumFractionDigits: 0,
                }).format(total)}
              </div>
            </div>

            <div>
              <Label htmlFor="new-amount" className="text-sm">
                Montant versé
              </Label>
              <Input
                id="new-amount"
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="mt-2"
                min="0"
                max={total}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max: {new Intl.NumberFormat("fr-DZ", {
                  style: "currency",
                  currency,
                  minimumFractionDigits: 0,
                }).format(total)}
              </p>
            </div>

            <div className="bg-muted/40 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reste à payer:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("fr-DZ", {
                    style: "currency",
                    currency,
                    minimumFractionDigits: 0,
                  }).format(Math.max(0, total - (parseFloat(newAmount) || 0)))}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdatePayment} disabled={saving}>
              {saving ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
