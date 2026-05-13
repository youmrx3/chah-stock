import { useMemo, useState } from "react";
import { Client, StockItem } from "@/types/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientManager } from "@/components/ClientManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface ClientSectionProps {
  clients: Client[];
  items: StockItem[];
  currency: string;
  clientFeatureAvailable: boolean;
  onAdd: (payload: Partial<Client>) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Client>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateItem: (id: string, updates: Partial<StockItem>) => Promise<void>;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}

export function ClientSection({ clients, items, currency, clientFeatureAvailable, onAdd, onUpdate, onDelete, onUpdateItem }: ClientSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string>("none");
  const [addingPaid, setAddingPaid] = useState<string>("0");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPaid, setEditingPaid] = useState<string>("0");

  const getClientMetrics = (clientId: string) => {
    const clientItems = items.filter((item) => item.client_id === clientId);
    const total = clientItems.reduce((sum, item) => sum + (item.price_ht || 0) * item.quantity, 0);
    const paid = clientItems.reduce((sum, item) => sum + (item.paid_amount || 0), 0);
    const due = Math.max(0, total - paid);
    return { clientItems, total, paid, due };
  };

  const openClientDetails = (client: Client) => {
    setSelectedClient(client);
    setDetailsOpen(true);
    setAddingProductId("none");
    setAddingPaid("0");
    setEditingProductId(null);
    setEditingPaid("0");
  };

  const handleAddSuivi = async () => {
    if (!selectedClient) return;
    if (addingProductId === "none") {
      toast.error("Choisissez un produit à associer");
      return;
    }

    await onUpdateItem(addingProductId, {
      client_id: selectedClient.id,
      paid_amount: Number.isFinite(Number(addingPaid)) ? Number(addingPaid) : 0,
    });

    setAddingProductId("none");
    setAddingPaid("0");
    toast.success("Suivi client ajouté");
  };

  const handleStartEditSuivi = (item: StockItem) => {
    setEditingProductId(item.id);
    setEditingPaid(String(item.paid_amount || 0));
  };

  const handleSaveEditSuivi = async (item: StockItem) => {
    await onUpdateItem(item.id, {
      paid_amount: Number.isFinite(Number(editingPaid)) ? Number(editingPaid) : 0,
      client_id: selectedClient?.id || null,
    });
    setEditingProductId(null);
    setEditingPaid("0");
    toast.success("Suivi client modifié");
  };

  const handleDeleteSuivi = async (item: StockItem) => {
    await onUpdateItem(item.id, {
      client_id: null,
      paid_amount: 0,
    });
    toast.success("Suivi client supprimé");
  };

  const totalDue = useMemo(() => {
    return clients.reduce((sum, client) => {
      const clientItems = items.filter((item) => item.client_id === client.id);
      const total = clientItems.reduce((acc, item) => acc + (item.price_ht || 0) * item.quantity, 0);
      const paid = clientItems.reduce((acc, item) => acc + (item.paid_amount || 0), 0);
      return sum + Math.max(0, total - paid);
    }, 0);
  }, [clients, items]);

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) => {
      const clientItems = items.filter((item) => item.client_id === client.id);
      const clientText = [client.name, client.email, client.phone, client.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const productsText = clientItems
        .map((item) => [item.number, item.description, item.reference, item.notes].filter(Boolean).join(" "))
        .join(" ")
        .toLowerCase();

      return clientText.includes(query) || productsText.includes(query);
    });
  }, [clients, items, searchTerm]);

  return (
    <div className="space-y-6">
      {!clientFeatureAvailable && (
        <Alert>
          <AlertTitle>Module clients non disponible</AlertTitle>
          <AlertDescription>
            La table/policy `clients` n'est pas accessible sur Supabase. Exécutez la dernière migration SQL puis rechargez la page.
          </AlertDescription>
        </Alert>
      )}

      <div className="max-w-2xl">
        <ClientManager clients={clients} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Clients enregistrés</p>
              <p className="text-lg font-bold tracking-tight">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Clients affichés</p>
              <p className="text-lg font-bold tracking-tight">{filteredClients.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Search className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reste global clients</p>
              <p className="text-lg font-bold tracking-tight text-warning">{formatMoney(totalDue, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b bg-muted/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-sm">Suivi des clients</h3>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher client, email, produit..."
                className="pl-9 h-9 text-sm bg-background"
              />
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {filteredClients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Aucun client enregistré.</p>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => {
                const { clientItems, paid, due } = getClientMetrics(client.id);

                return (
                  <div
                    key={client.id}
                    className="rounded-xl border p-4 space-y-3 cursor-pointer hover:bg-muted/20 hover:shadow-sm transition-all"
                    onClick={() => openClientDetails(client)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{(client.name || "?")[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{client.name || "Sans nom"}</p>
                          <p className="text-xs text-muted-foreground">{client.email || "Sans email"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{clientItems.length} produits</Badge>
                        <Badge variant="outline" className="text-xs">Versé: {formatMoney(paid, currency)}</Badge>
                        <Badge variant={due > 0 ? "warning" : "success"} className="text-xs">Reste: {formatMoney(due, currency)}</Badge>
                      </div>
                    </div>

                    {clientItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucun produit associé.</p>
                    ) : (
                      <div className="space-y-1 pt-1">
                        {clientItems.map((item) => {
                          const itemTotal = (item.price_ht || 0) * item.quantity;
                          const itemDue = Math.max(0, itemTotal - (item.paid_amount || 0));

                          return (
                            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-xs">
                              <p className="font-medium">#{item.number} - {item.description}</p>
                              <p className="text-muted-foreground tabular-nums">
                                Versé {formatMoney(item.paid_amount || 0, currency)} / Reste {formatMoney(itemDue, currency)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto">
          {!selectedClient ? null : (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">Suivi détaillé client</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="rounded-xl border p-4 space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{(selectedClient.name || "?")[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedClient.name || "Sans nom"}</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.email || "Sans email"}</p>
                    </div>
                  </div>
                  {selectedClient.phone && <p className="text-sm text-muted-foreground mt-2">{selectedClient.phone}</p>}
                  {selectedClient.notes && <p className="text-sm mt-2">{selectedClient.notes}</p>}
                </div>

                {(() => {
                  const { clientItems, total, paid, due } = getClientMetrics(selectedClient.id);
                  const availableItems = items.filter((item) => item.client_id !== selectedClient.id);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border p-3">
                          <p className="text-xs font-medium text-muted-foreground">Total Client</p>
                          <p className="text-lg font-bold tracking-tight mt-0.5">{formatMoney(total, currency)}</p>
                        </div>
                        <div className="rounded-xl border p-3">
                          <p className="text-xs font-medium text-muted-foreground">Total Versé</p>
                          <p className="text-lg font-bold tracking-tight mt-0.5 text-success">{formatMoney(paid, currency)}</p>
                        </div>
                        <div className="rounded-xl border p-3">
                          <p className="text-xs font-medium text-muted-foreground">Reste à payer</p>
                          <p className="text-lg font-bold tracking-tight mt-0.5 text-warning">{formatMoney(due, currency)}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="font-medium">Ajouter un suivi client</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <Select value={addingProductId} onValueChange={setAddingProductId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un produit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Choisir un produit</SelectItem>
                                {availableItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    #{item.number} - {item.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            value={addingPaid}
                            onChange={(e) => setAddingPaid(e.target.value)}
                            placeholder="Versement"
                          />
                        </div>
                        <Button size="sm" onClick={handleAddSuivi}>Ajouter au suivi</Button>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-medium">Produits liés</h4>
                        {clientItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucun produit lié à ce client.</p>
                        ) : (
                          clientItems.map((item) => {
                            const itemTotal = (item.price_ht || 0) * item.quantity;
                            const itemDue = Math.max(0, itemTotal - (item.paid_amount || 0));
                            const isEditing = editingProductId === item.id;
                            return (
                              <div key={item.id} className="rounded-md border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-medium">#{item.number} - {item.description}</p>
                                  <Badge variant={itemDue > 0 ? "warning" : "success"}>
                                    {itemDue > 0 ? "Partiellement payé" : "Soldé"}
                                  </Badge>
                                </div>
                                {isEditing ? (
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Input
                                      className="max-w-[180px]"
                                      type="number"
                                      min={0}
                                      value={editingPaid}
                                      onChange={(e) => setEditingPaid(e.target.value)}
                                    />
                                    <Button size="sm" onClick={() => handleSaveEditSuivi(item)}>Enregistrer</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingProductId(null)}>Annuler</Button>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Versé {formatMoney(item.paid_amount || 0, currency)} / Reste {formatMoney(itemDue, currency)}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                      <Button size="sm" variant="outline" onClick={() => handleStartEditSuivi(item)}>Modifier suivi</Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleDeleteSuivi(item)}>Supprimer suivi</Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
