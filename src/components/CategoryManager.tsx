import { useRef, useState } from "react";
import { Category } from "@/types/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadCategoryImage } from "@/lib/storage";
import { Trash2, Pencil, Plus, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (payload: Partial<Category>) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryManager({ categories, onAdd, onUpdate, onDelete }: CategoryManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (isEdit = false, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    setUploading(true);
    const url = await uploadCategoryImage(file);
    setUploading(false);

    if (!url) {
      toast.error("Erreur lors du téléchargement de l'image");
      return;
    }

    if (isEdit) {
      setEditImageUrl(url);
    } else {
      setImageUrl(url);
    }
    toast.success("Image téléchargée");
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Le nom de la categorie est requis");
      return;
    }

    try {
      setLoading(true);
      await onAdd({ name: name.trim(), image_url: imageUrl || null });
      setName("");
      setImageUrl(null);
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Erreur lors de l'ajout de la categorie");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name || "");
    setEditImageUrl(category.image_url || null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editName.trim()) {
      toast.error("Le nom de la categorie est requis");
      return;
    }

    try {
      setLoading(true);
      await onUpdate(editingId, {
        name: editName.trim(),
        image_url: editImageUrl || null,
      });
      setEditingId(null);
      setEditName("");
      setEditImageUrl(null);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Erreur lors de la mise a jour de la categorie");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await onDelete(id);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Erreur lors de la suppression de la categorie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1 space-y-2">
            <Label htmlFor="category-name">Nom</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Consommables"
            />
          </div>
          <div className="md:col-span-1 space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative">
                  <img src={imageUrl} alt="category" className="h-12 w-12 rounded-md border object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 w-12 border-2 border-dashed rounded-lg flex items-center justify-center"
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(false, e.target.files?.[0])}
              />
            </div>
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button onClick={handleAdd} disabled={loading} className="w-full gap-2">
              <Plus size={16} />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune categorie</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="border rounded-md p-3">
                {editingId === category.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nom"
                    />
                    <div className="flex items-center gap-2 border rounded-md px-2">
                      {editImageUrl ? (
                        <img src={editImageUrl} alt="category" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pas d'image</span>
                      )}
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="ml-auto text-xs text-primary"
                      >
                        Changer
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(true, e.target.files?.[0])}
                      />
                    </div>
                    <Button onClick={handleSaveEdit} disabled={loading} className="h-10">Enregistrer</Button>
                    <Button variant="outline" onClick={() => setEditingId(null)} className="h-10">Annuler</Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="h-9 w-9 rounded-md border object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-md border bg-muted" />
                      )}
                      <div>
                        <p className="font-medium">{category.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:self-auto self-end">
                      <Button variant="outline" size="sm" className="h-9 w-9 px-0" onClick={() => handleStartEdit(category)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 px-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
