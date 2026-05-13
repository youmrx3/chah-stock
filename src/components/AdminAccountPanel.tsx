import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, KeyRound, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminAccountPanelProps {
  adminEmail: string;
  onSignOut: () => Promise<void>;
}

export function AdminAccountPanel({ adminEmail, onSignOut }: AdminAccountPanelProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePasswordUpdate = async () => {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

    if (!newPassword || !strongPassword.test(newPassword)) {
      toast.error("Mot de passe faible: 12+ caracteres avec majuscule, minuscule, chiffre et symbole");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("La confirmation du mot de passe ne correspond pas");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Mot de passe admin mis a jour");
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Impossible de mettre a jour le mot de passe");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border bg-card/90 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Compte Admin
        </CardTitle>
        <CardDescription>Configuration de votre session admin Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Connecte en tant que</p>
          <p className="font-semibold">{adminEmail}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="12+ caracteres, maj/min/chiffre/symbole"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le mot de passe"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handlePasswordUpdate} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Mettre a jour mot de passe
          </Button>
          <Button type="button" variant="destructive" onClick={onSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Deconnexion
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
