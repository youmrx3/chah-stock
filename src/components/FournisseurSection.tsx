import { useMemo, useState } from "react";
import { Fournisseur } from "@/types/stock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Search, Plus, Edit2, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

interface FournisseurSectionProps {
  fournisseurs: Fournisseur[];
  onAdd: (payload: Partial<Fournisseur>) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Fournisseur>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FournisseurSection({ fournisseurs, onAdd, onUpdate, onDelete }: FournisseurSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const filteredFournisseurs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return fournisseurs;
    return fournisseurs.filter((f) => {
      const fText = [f.name, f.email, f.phone, f.address, f.notes].filter(Boolean).join(" ").toLowerCase();
      return fText.includes(query);
    });
  }, [fournisseurs, searchTerm]);

  const openAddForm = () => {
    setEditingFournisseur(null);
    setFormData({ name: "", email: "", phone: "", address: "", notes: "" });
    setFormOpen(true);
  };

  const openEditForm = (f: Fournisseur) => {
    setEditingFournisseur(f);
    setFormData({
      name: f.name || "",
      email: f.email || "",
      phone: f.phone || "",
      address: f.address || "",
      notes: f.notes || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du fournisseur est requis");
      return;
    }

    if (editingFournisseur) {
      await onUpdate(editingFournisseur.id, formData);
    } else {
      await onAdd(formData);
    }
    setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Fournisseurs enregistrés</p>
              <p className="text-lg font-bold tracking-tight">{fournisseurs.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Fournisseurs affichés</p>
              <p className="text-lg font-bold tracking-tight">{filteredFournisseurs.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b bg-muted/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Gestion des fournisseurs</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher fournisseur..."
                  className="pl-9 h-9 text-sm bg-background"
                />
              </div>
              <Button onClick={openAddForm} size="sm" className="gap-1.5 whitespace-nowrap h-9 gradient-primary border-0 text-white shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {filteredFournisseurs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Aucun fournisseur enregistre.</p>
          ) : (
            <div className="space-y-3">
              {filteredFournisseurs.map((f) => (
                <div key={f.id} className="rounded-xl border p-4 space-y-3 hover:bg-muted/20 hover:shadow-sm transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{f.name}</p>
                        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                          {f.email && <span>{f.email}</span>}
                          {f.phone && <span>{f.email ? "•" : ""} {f.phone}</span>}
                        </div>
                        {f.address && <p className="text-xs text-muted-foreground mt-1">{f.address}</p>}
                        {f.notes && <p className="text-xs text-muted-foreground mt-1">{f.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">Fournisseur</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => openEditForm(f)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(f.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingFournisseur ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="f-name">Nom *</Label>
              <Input
                id="f-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="f-email">Email</Label>
                <Input
                  id="f-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-phone">Telephone</Label>
                <Input
                  id="f-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+213..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-address">Adresse</Label>
              <Input
                id="f-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse du fournisseur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-notes">Notes</Label>
              <Textarea
                id="f-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingFournisseur ? "Mettre a jour" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fournisseur</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer ce fournisseur ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
