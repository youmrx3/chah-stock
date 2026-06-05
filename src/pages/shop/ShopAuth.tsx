import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShopAuth } from "@/hooks/useShopAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ShopAuth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useShopAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Connexion reussie");
    navigate("/shop/account");
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte cree. Verifiez votre email si requis.");
    navigate("/shop/account");
  };

  return (
    <div className="container max-w-lg">
      <div className="rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-sm space-y-4 animate-in">
        <div>
          <h1 className="text-2xl font-bold">Espace client</h1>
          <p className="text-sm text-muted-foreground">Gerez vos demandes et favoris en un espace.</p>
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button onClick={handleSignIn} disabled={loading} className="w-full">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button onClick={handleSignUp} disabled={loading} className="w-full">
              {loading ? "Creation..." : "Creer un compte"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
