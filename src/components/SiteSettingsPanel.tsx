import { useState, useRef, useEffect } from "react";
import { SiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadProductImage } from "@/lib/storage";
import { ImagePlus, Loader2, X, Building2, Globe } from "lucide-react";
import { toast } from "sonner";

interface SiteSettingsPanelProps {
  settings: SiteSettings;
  onUpdate: (key: string, value: string | null) => Promise<void>;
}

export function SiteSettingsPanel({ settings, onUpdate }: SiteSettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [companySubtitle, setCompanySubtitle] = useState(settings.company_subtitle);
  const [companyAddress, setCompanyAddress] = useState(settings.company_address);
  const [companyEmail, setCompanyEmail] = useState(settings.company_email);
  const [companyPhone, setCompanyPhone] = useState(settings.company_phone);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.low_stock_threshold);

  useEffect(() => {
    setCompanyName(settings.company_name);
    setCompanySubtitle(settings.company_subtitle);
    setCompanyAddress(settings.company_address);
    setCompanyEmail(settings.company_email);
    setCompanyPhone(settings.company_phone);
    setLowStockThreshold(settings.low_stock_threshold);
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }
    setUploading(true);
    const url = await uploadProductImage(file);
    setUploading(false);
    if (url) {
      await onUpdate("logo_url", url);
    } else {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleSaveCompany = async () => {
    await onUpdate("company_name", companyName);
    await onUpdate("company_subtitle", companySubtitle);
    await onUpdate("company_address", companyAddress);
    await onUpdate("company_email", companyEmail);
    await onUpdate("company_phone", companyPhone);
  };

  const handleSaveStockSettings = async () => {
    await onUpdate("low_stock_threshold", lowStockThreshold);
  };

  return (
    <div className="space-y-6">
      {/* Company branding */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b bg-muted/30 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-sm">Identité de l'entreprise</h3>
            <p className="text-xs text-muted-foreground">Logo et nom affichés dans l'en-tête</p>
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {settings.logo_url ? (
                <div className="relative">
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-20 h-20 object-contain rounded-xl border bg-background p-1"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdate("logo_url", null)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Ajouter</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Company name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nom de l'entreprise</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sous-titre</Label>
              <Input
                value={companySubtitle}
                onChange={(e) => setCompanySubtitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Adresse</Label>
              <Input
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveCompany} size="sm" className="rounded-lg w-full sm:w-auto">
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Product settings */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b bg-muted/30 flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-sm">Paramètres du stock</h3>
            <p className="text-xs text-muted-foreground">Configuration globale des produits</p>
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Seuil de stock bas</Label>
              <Input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                Alerte quand le stock restant est ≤ cette valeur
              </p>
            </div>
          </div>
          <Button onClick={handleSaveStockSettings} size="sm" className="rounded-lg w-full sm:w-auto">
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
