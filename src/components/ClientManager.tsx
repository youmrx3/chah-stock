import { useState } from "react";
import { Client } from "@/types/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Plus, Trash2, User } from "lucide-react";

interface ClientManagerProps {
  clients: Client[];
  onAdd: (payload: Partial<Client>) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Client>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ClientManager({ clients, onAdd, onUpdate, onDelete }: ClientManagerProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", notes: "" });
    setOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await onUpdate(editing.id, form);
    } else {
      await onAdd(form);
    }
    setOpen(false);
  };

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Clients</h3>
          <Button size="sm" className="rounded-lg h-8 text-xs" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
        <div className="p-4 sm:p-5">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun client pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 hover:bg-muted/30 hover:shadow-sm transition-all">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{client.name || "Sans nom"}</p>
                    <p className="text-xs text-muted-foreground truncate">{client.email || "Sans email"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(client)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(client.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {editing ? "Modifier client" : "Ajouter client"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" className="rounded-lg">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
