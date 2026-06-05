import type { SiteSettings } from "@/hooks/useSiteSettings";

interface ShopFooterProps {
  settings: SiteSettings;
}

export function ShopFooter({ settings }: ShopFooterProps) {
  return (
    <footer className="border-t bg-card/60">
      <div className="container py-10 grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{settings.company_name}</h3>
          <p className="text-sm text-muted-foreground">
            {settings.company_subtitle || "Catalogue professionnel et demandes de devis personnalisees."}
          </p>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Contact</p>
          <p>{settings.company_address}</p>
          <p>{settings.company_email}</p>
          <p>{settings.company_phone}</p>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Infos utiles</p>
          <p>Les prix affiches sont indicatifs et soumis a validation.</p>
          <p>Demandez un devis pour confirmer disponibilite et remises.</p>
        </div>
      </div>
    </footer>
  );
}
