import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AdminAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Entrez votre email et mot de passe");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      toast.success("Connexion reussie");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Email ou mot de passe invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-100/40 via-emerald-100/30 to-background" />
      <Card className="w-full max-w-md rounded-2xl border bg-card/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-2">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Espace Admin</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte admin Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Mot de passe</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
