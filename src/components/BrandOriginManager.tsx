import { useRef, useState } from "react";
import { Brand, Origin } from "@/types/stock";
import { uploadBrandOriginLogo } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Edit2, Globe, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Entity = Brand | Origin;

type EntityManagerProps = {
  title: string;
  icon: "brand" | "origin";
  items: Entity[];
  onAdd: (payload: Partial<Entity>) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Entity>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function EntityManager({ title, icon, items, onAdd, onUpdate, onDelete }: EntityManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", logo_url: null as string | null });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", logo_url: null });
    setOpen(true);
  };

  const openEdit = (entity: Entity) => {
    setEditing(entity);
    setForm({ name: entity.name, logo_url: entity.logo_url });
    setOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    setUploading(true);
    const url = await uploadBrandOriginLogo(file);
    setUploading(false);

    if (url) {
      setForm((prev) => ({ ...prev, logo_url: url }));
      toast.success("Logo téléchargé");
    } else {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

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
          <h3 className="font-semibold text-sm">{title}</h3>
          <Button size="sm" className="rounded-lg h-9 text-xs" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
        <div className="p-4 sm:p-5">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun élément.</p>
          ) : (
            <div className="space-y-2">
              {items.map((entity) => (
                <div key={entity.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/30 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    {entity.logo_url ? (
                      <img src={entity.logo_url} alt={entity.name} className="h-9 w-9 rounded-md border object-contain" />
                    ) : (
                      <div className="h-9 w-9 rounded-md border flex items-center justify-center bg-muted">
                        {icon === "brand" ? <Building2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      </div>
                    )}
                    <p className="font-medium truncate">{entity.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => openEdit(entity)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                      onClick={() => onDelete(entity.id)}
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
        <DialogContent className="w-[95vw] sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editing ? `Modifier ${title}` : `Ajouter ${title}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <div className="relative">
                    <img src={form.logo_url} alt="logo" className="w-16 h-16 object-contain rounded-lg border p-1" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logo_url: null }))}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </div>
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

interface BrandOriginManagerProps {
  brands: Brand[];
  origins: Origin[];
  onAddBrand: (payload: Partial<Brand>) => Promise<void>;
  onUpdateBrand: (id: string, payload: Partial<Brand>) => Promise<void>;
  onDeleteBrand: (id: string) => Promise<void>;
  onAddOrigin: (payload: Partial<Origin>) => Promise<void>;
  onUpdateOrigin: (id: string, payload: Partial<Origin>) => Promise<void>;
  onDeleteOrigin: (id: string) => Promise<void>;
}

export function BrandOriginManager({
  brands,
  origins,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
  onAddOrigin,
  onUpdateOrigin,
  onDeleteOrigin,
}: BrandOriginManagerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <EntityManager title="Marques" icon="brand" items={brands} onAdd={onAddBrand} onUpdate={onUpdateBrand} onDelete={onDeleteBrand} />
      <EntityManager title="Origines" icon="origin" items={origins} onAdd={onAddOrigin} onUpdate={onUpdateOrigin} onDelete={onDeleteOrigin} />
    </div>
  );
}
