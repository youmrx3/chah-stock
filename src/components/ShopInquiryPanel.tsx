import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statuses = ["submitted", "reviewing", "quoted", "closed"] as const;

type Status = (typeof statuses)[number];

export function ShopInquiryPanel() {
  const inquiriesQuery = useQuery({
    queryKey: ["admin-shop-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_inquiries")
        .select("*, shop_inquiry_items(*, stock_items(description, reference))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleUpdateStatus = async (id: string, status: Status) => {
    const { error } = await supabase
      .from("shop_inquiries")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Impossible de mettre a jour le statut.");
      return;
    }

    toast.success("Statut mis a jour.");
    await inquiriesQuery.refetch();
  };

  const items = useMemo(() => inquiriesQuery.data || [], [inquiriesQuery.data]);

  if (inquiriesQuery.isLoading) {
    return <div className="h-40 rounded-2xl border bg-muted/40 animate-pulse" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-card/80 p-6 text-sm text-muted-foreground">
        Aucune demande client pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((inquiry: any) => (
        <div key={inquiry.id} className="rounded-2xl border bg-card/80 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold">Demande #{String(inquiry.id).slice(0, 6)}</p>
              <p className="text-xs text-muted-foreground">{new Date(inquiry.created_at).toLocaleString("fr-FR")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{inquiry.status}</Badge>
              <Select value={inquiry.status} onValueChange={(value) => handleUpdateStatus(inquiry.id, value as Status)}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {inquiry.message && (
            <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
              {inquiry.message}
            </div>
          )}

          <div className="rounded-xl border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-2">Produits demandes</p>
            <ul className="space-y-1">
              {(inquiry.shop_inquiry_items || []).map((item: any) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.stock_items?.description || "Produit"}</span>
                  <span className="text-xs text-muted-foreground">Qt: {item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(inquiry.id, "reviewing")}>Marquer en cours</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
