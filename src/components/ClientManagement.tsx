import { useState, useMemo } from "react";
import { Client, StockItem, PaymentTracking } from "@/types/stock";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Edit, Trash2, Users, Package, Mail, Phone, FileText } from "lucide-react";
import { toast } from "sonner";

interface ClientManagementProps {
  clients: Client[];
  items: StockItem[];
  paymentTrackings: PaymentTracking[];
  currency: string;
  onAdd: (payload: Partial<Client>) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Client>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  })
    .format(value)
    .replace(/[\u00A0\u202F]/g, " ");
}

export function ClientManagement({
  clients,
  items,
  paymentTrackings,
  currency,
  onAdd,
  onUpdate,
  onDelete,
}: ClientManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      (client.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (client.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const getClientMetrics = (clientId: string) => {
    const clientItems = items.filter((item) => item.client_id === clientId);
    const totalAmount = clientItems.reduce(
      (sum, item) => sum + ((item.price_ht || 0) * item.quantity),
      0
    );

    return {
      itemCount: clientItems.length,
      totalAmount,
      items: clientItems,
    };
  };

  const getClientTrackingMetrics = (clientId: string) => {
    const payments = paymentTrackings.filter((p) => p.client_id === clientId);
    const totalTracked = payments.reduce((sum, p) => sum + (p.amount_willing_to_pay || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const pendingCount = payments.filter((p) => p.status !== "completed").length;

    return {
      payments,
      count: payments.length,
      totalTracked,
      totalPaid,
      remaining: Math.max(0, totalTracked - totalPaid),
      pendingCount,
    };
  };

  const overallMetrics = useMemo(() => {
    const all = clients.map((c) => getClientMetrics(c.id));
    const allPayments = clients.map((c) => getClientTrackingMetrics(c.id));
    return {
      totalClients: clients.length,
      totalOrders: all.reduce((sum, m) => sum + m.itemCount, 0),
      totalRevenue: all.reduce((sum, m) => sum + m.totalAmount, 0),
      totalTrackings: allPayments.reduce((sum, m) => sum + m.count, 0),
      totalTrackedAmount: allPayments.reduce((sum, m) => sum + m.totalTracked, 0),
      totalRemainingAmount: allPayments.reduce((sum, m) => sum + m.remaining, 0),
    };
  }, [clients, paymentTrackings]);

  const getClientPayments = (clientId: string) => {
    return paymentTrackings.filter((p) => p.client_id === clientId);
  };

  const findProductDescription = (productId?: string | null) => {
    if (!productId) return "-";
    return items.find((item) => item.id === productId)?.description || "-";
  };

  const findSubProductName = (subProductId?: string | null) => {
    if (!subProductId) return "-";
    for (const item of items) {
      const found = (item.sub_products || []).find((sp) => sp.id === subProductId);
      if (found) return found.name;
    }
    return "-";
  };

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        notes: client.notes || "",
      });
    } else {
      setEditingClient(null);
      setFormData({ name: "", email: "", phone: "", notes: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Veuillez entrer un nom de client");
      return;
    }

    try {
      if (editingClient) {
        await onUpdate(editingClient.id, formData);
        toast.success("Client mis à jour");
      } else {
        await onAdd(formData);
        toast.success("Client ajouté");
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await onDelete(deleteTarget.id);
      toast.success("Client supprimé");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-xl sm:text-2xl font-bold leading-tight break-all">{overallMetrics.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Suivis</p>
                <p className="text-xl sm:text-2xl font-bold leading-tight break-all">{overallMetrics.totalTrackings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total suivi</p>
                <p className="text-sm sm:text-xl font-bold leading-tight break-all">{formatMoney(overallMetrics.totalTrackedAmount || overallMetrics.totalRevenue, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Reste à encaisser</p>
                <p className="text-sm sm:text-xl font-bold leading-tight break-all">{formatMoney(overallMetrics.totalRemainingAmount, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Chercher client par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter Client
        </Button>
      </div>

      {/* Clients List */}
      <div className="grid gap-3">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun client trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const trackingMetrics = getClientTrackingMetrics(client.id);
            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                setSelectedClient(client);
                setDetailsOpen(true);
              }}>
                <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-2">{client.name}</h3>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {client.phone}
                          </div>
                        )}
                        {client.notes && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                            <FileText className="h-4 w-4 mt-0.5" />
                            <p className="line-clamp-2">{client.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:ml-4 sm:text-right space-y-2">
                      <div className="flex gap-2 sm:justify-end flex-wrap">
                        <Badge variant="outline" className="font-semibold">
                          {trackingMetrics.count} suivi{trackingMetrics.count !== 1 ? "s" : ""}
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-900 font-semibold max-w-full break-all text-left">
                          {formatMoney(trackingMetrics.totalTracked, currency)}
                        </Badge>
                        {trackingMetrics.pendingCount > 0 && (
                          <Badge className="bg-orange-100 text-orange-900 font-semibold">
                            {trackingMetrics.pendingCount} en attente
                          </Badge>
                        )}
                      </div>
                      {trackingMetrics.payments.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1 mt-2 sm:text-right break-all">
                          {trackingMetrics.payments.slice(0, 2).map((payment) => (
                            <p key={payment.id}>
                              {payment.sub_product_id
                                ? `Sous-produit: ${findSubProductName(payment.sub_product_id)}`
                                : `Produit: ${findProductDescription(payment.product_id)}`}
                              {" • "}
                              {formatMoney(payment.amount_paid || 0, currency)} / {formatMoney(payment.amount_willing_to_pay || 0, currency)}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 sm:justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenForm(client)}
                          className="h-9 w-9 px-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeleteTarget(client);
                            setDeleteOpen(true);
                          }}
                          className="h-9 w-9 px-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Modifier Client" : "Ajouter Client"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                placeholder="Nom du client"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                placeholder="+213 5XX XXX XXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes ou informations supplémentaires..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {editingClient ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Details Dialog */}
      {selectedClient && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedClient.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium mt-1">{selectedClient.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Téléphone</p>
                  <p className="text-sm font-medium mt-1">{selectedClient.phone || "—"}</p>
                </div>
              </div>

              {selectedClient.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
                    <p className="text-sm font-medium mt-2">{selectedClient.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Statistiques</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Suivis enregistrés</p>
                    <p className="text-2xl font-bold mt-1">{getClientTrackingMetrics(selectedClient.id).count}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Montant suivi</p>
                    <p className="text-base sm:text-lg font-bold mt-1 leading-tight break-all">{formatMoney(getClientTrackingMetrics(selectedClient.id).totalTracked, currency)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Montant versé</p>
                    <p className="text-base sm:text-lg font-bold mt-1 text-green-700 leading-tight break-all">{formatMoney(getClientTrackingMetrics(selectedClient.id).totalPaid, currency)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Reste</p>
                    <p className="text-base sm:text-lg font-bold mt-1 text-orange-700 leading-tight break-all">{formatMoney(getClientTrackingMetrics(selectedClient.id).remaining, currency)}</p>
                  </div>
                </div>
              </div>

              {getClientMetrics(selectedClient.id).items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Produits achetés</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getClientMetrics(selectedClient.id).items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-right break-all">{formatMoney((item.price_ht || 0) * item.quantity, currency)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {getClientPayments(selectedClient.id).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Suivi paiements</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getClientPayments(selectedClient.id).map((payment) => {
                        const total = payment.amount_willing_to_pay || 0;
                        const paid = payment.amount_paid || 0;
                        const remaining = Math.max(0, total - paid);
                        return (
                          <div key={payment.id} className="p-2 bg-muted rounded text-sm space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {payment.sub_product_id
                                  ? `Sous-produit: ${findSubProductName(payment.sub_product_id)}`
                                  : `Produit: ${findProductDescription(payment.product_id)}`}
                              </p>
                              <Badge
                                variant={
                                  payment.status === "completed"
                                    ? "default"
                                    : payment.status === "partial"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {payment.status === "completed"
                                  ? "Complété"
                                  : payment.status === "partial"
                                  ? "Partiel"
                                  : "En attente"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <p className="break-all">Total: <span className="font-semibold">{formatMoney(total, currency)}</span></p>
                              <p className="break-all">Versé: <span className="font-semibold text-green-700">{formatMoney(paid, currency)}</span></p>
                              <p className="break-all">Reste: <span className="font-semibold text-orange-700">{formatMoney(remaining, currency)}</span></p>
                            </div>
                            {payment.notes && (
                              <p className="text-xs text-muted-foreground">Note: {payment.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Supprimer ce client?</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le client "{deleteTarget?.name}"? Cette action ne peut pas être annulée.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
