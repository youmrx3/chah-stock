import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Client, StockItem } from "@/types/stock";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, XCircle, CheckCircle2, UserPlus, CreditCard, Package } from "lucide-react";

const statuses = ["submitted", "reviewing", "quoted", "paid", "canceled", "closed"] as const;

type Status = (typeof statuses)[number];

const statusLabels: Record<Status, string> = {
  submitted: "Soumise",
  reviewing: "En cours",
  quoted: "Devisé",
  paid: "Payée",
  canceled: "Annulée",
  closed: "Clôturée",
};

const statusVariants: Record<Status, "default" | "secondary" | "outline" | "destructive"> = {
  submitted: "secondary",
  reviewing: "default",
  quoted: "outline",
  paid: "default",
  canceled: "destructive",
  closed: "outline",
};

interface InquiryItem {
  id: string;
  inquiry_id: string;
  stock_item_id: string | null;
  quantity: number;
  note: string | null;
  created_at: string;
  stock_items: { description: string; reference: string; price_ht: number | null } | null;
}

interface InquiryWithItems {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
  shop_inquiry_items: InquiryItem[];
}

interface ShopInquiryPanelProps {
  clients: Client[];
  stockItems: StockItem[];
  currency: string;
  onCreatePayment: (
    clientId: string,
    productId: string | null,
    subProductId: string | null,
    amountWillingToPay: number,
    amountPaid: number,
    notes: string
  ) => Promise<void>;
}

export function ShopInquiryPanel({ clients, stockItems, currency, onCreatePayment }: ShopInquiryPanelProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const inquiriesQuery = useQuery({
    queryKey: ["admin-shop-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_inquiries")
        .select("*, shop_inquiry_items(*, stock_items(description, reference, price_ht))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as InquiryWithItems[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("shop_inquiries")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shop-inquiries"] });
    },
    onError: (err) => {
      toast.error("Erreur de mise à jour: " + String(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shop_inquiries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demande supprimée");
      queryClient.invalidateQueries({ queryKey: ["admin-shop-inquiries"] });
    },
    onError: (err) => {
      toast.error("Erreur de suppression: " + String(err));
    },
  });

  const handleUpdateStatus = (id: string, status: Status) => {
    updateMutation.mutate({ id, updates: { status } });
  };

  const handleLinkClient = (id: string, clientId: string) => {
    updateMutation.mutate({ id, updates: { client_id: clientId || null } });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleConvertToPayment = async (inquiry: InquiryWithItems, markAsPaid: boolean) => {
    if (!inquiry.client_id) {
      toast.error("Veuillez d'abord lier un client à cette demande");
      return;
    }

    setConvertingId(inquiry.id);
    try {
      for (const item of inquiry.shop_inquiry_items) {
        if (!item.stock_item_id || !item.stock_items) continue;

        const unitPrice = item.stock_items.price_ht || 0;
        const totalAmount = unitPrice * item.quantity;
        const amountPaid = markAsPaid ? totalAmount : 0;

        await onCreatePayment(
          inquiry.client_id,
          item.stock_item_id,
          null,
          totalAmount,
          amountPaid,
          `Demande #${inquiry.id.slice(0, 6)} - ${inquiry.message || ""}`
        );
      }

      await updateMutation.mutateAsync({ id: inquiry.id, updates: { status: markAsPaid ? "paid" : "reviewing" } });

      toast.success(markAsPaid ? "Demande marquée comme payée" : "Suivi de paiement créé");
    } catch (err) {
      console.error("Error converting inquiry to payment:", err);
    } finally {
      setConvertingId(null);
    }
  };

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const stockItemPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    stockItems.forEach((s) => {
      if (s.price_ht) map.set(s.id, s.price_ht);
    });
    return map;
  }, [stockItems]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency, minimumFractionDigits: 0 }).format(value);

  const inquiries = inquiriesQuery.data || [];

  if (inquiriesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card/80 p-6 text-sm text-muted-foreground text-center">
        <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        Aucune demande client pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => {
        const client = inquiry.client_id ? clientMap.get(inquiry.client_id) : null;
        const itemsTotal = inquiry.shop_inquiry_items.reduce((sum, item) => {
          const price = item.stock_items?.price_ht || stockItemPriceMap.get(item.stock_item_id || "") || 0;
          return sum + price * item.quantity;
        }, 0);
        const isPending = inquiry.status === "submitted" || inquiry.status === "reviewing";

        return (
          <div key={inquiry.id} className="rounded-2xl border bg-card/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold">Demande #{String(inquiry.id).slice(0, 6)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(inquiry.created_at).toLocaleString("fr-CA")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusVariants[inquiry.status as Status] || "outline"}>
                  {statusLabels[inquiry.status as Status] || inquiry.status}
                </Badge>
                <Select
                  value={inquiry.status}
                  onValueChange={(value) => handleUpdateStatus(inquiry.id, value as Status)}
                >
                  <SelectTrigger className="h-9 w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {client ? (
                <span className="text-sm font-medium text-primary">{client.name || client.email}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Aucun client lié</span>
              )}
              <Select
                value={inquiry.client_id || "none"}
                onValueChange={(value) => handleLinkClient(inquiry.id, value === "none" ? "" : value)}
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue placeholder="Lier un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name || c.email || "Sans nom"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inquiry.message && (
              <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                {inquiry.message}
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-2">Produits demandés</p>
              <ul className="space-y-1.5">
                {inquiry.shop_inquiry_items.map((item) => {
                  const unitPrice = item.stock_items?.price_ht || stockItemPriceMap.get(item.stock_item_id || "") || 0;
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.stock_items?.description || "Produit"}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.quantity} × {formatPrice(unitPrice)} = {formatPrice(unitPrice * item.quantity)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {itemsTotal > 0 && (
                <div className="mt-2 pt-2 border-t flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span>{formatPrice(itemsTotal)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPending && inquiry.client_id && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                    disabled={convertingId === inquiry.id}
                    onClick={() => handleConvertToPayment(inquiry, false)}
                  >
                    {convertingId === inquiry.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5" />
                    )}
                    Convertir en suivi
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    disabled={convertingId === inquiry.id}
                    onClick={() => handleConvertToPayment(inquiry, true)}
                  >
                    {convertingId === inquiry.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Marquer payé
                  </Button>
                </>
              )}
              {inquiry.status !== "canceled" && inquiry.status !== "closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive"
                  onClick={() => handleUpdateStatus(inquiry.id, "canceled")}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Annuler
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-destructive ml-auto"
                onClick={() => setDeleteId(inquiry.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
            </div>
          </div>
        );
      })}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la demande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
