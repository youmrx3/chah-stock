import { useState } from "react";
import { CustomField } from "@/types/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";

interface CustomFieldsManagerProps {
  fields: CustomField[];
  onAdd: (field: Omit<CustomField, "id" | "created_at">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<CustomField>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CustomFieldsManager({ fields, onAdd, onUpdate, onDelete }: CustomFieldsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    field_type: "text",
    is_active: true,
  });

  const handleOpenAdd = () => {
    setEditingField(null);
    setFormData({ name: "", field_type: "text", is_active: true });
    setDialogOpen(true);
  };

  const handleOpenEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      field_type: field.field_type,
      is_active: field.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingField) {
      await onUpdate(editingField.id, formData);
    } else {
      await onAdd({
        ...formData,
        display_order: fields.length,
      });
    }
    setDialogOpen(false);
  };

  const handleToggleActive = async (field: CustomField) => {
    await onUpdate(field.id, { is_active: !field.is_active });
  };

  const fieldTypeLabels: Record<string, string> = {
    text: "Texte",
    number: "Nombre",
    date: "Date",
    boolean: "Oui/Non",
  };

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Champs personnalisés</h3>
          <Button size="sm" className="rounded-lg h-8 text-xs" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
        <div className="p-4 sm:p-5">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun champ personnalisé. Cliquez sur "Ajouter" pour créer le premier.
            </p>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 hover:shadow-sm transition-all"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{field.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fieldTypeLabels[field.field_type] || field.field_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.is_active}
                      onCheckedChange={() => handleToggleActive(field)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(field)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(field.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Modifier le champ" : "Ajouter un champ"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du champ</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Fournisseur"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, field_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="number">Nombre</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Oui/Non</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="active">Afficher dans le tableau principal</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" className="rounded-lg">
                {editingField ? "Mettre à jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
