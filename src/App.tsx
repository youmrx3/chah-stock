import { useEffect, useMemo, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AdminAuthPage } from "@/components/AdminAuthPage";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoadingAuth(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoadingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const adminAllowList = useMemo(() => {
    const raw = String(import.meta.env.VITE_ADMIN_EMAILS || "").trim();
    const emails = raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    return emails;
  }, []);

  const adminAllowListConfigured = adminAllowList.length > 0;
  const requireAdminAllowList = useMemo(() => {
    const raw = String(import.meta.env.VITE_REQUIRE_ADMIN_ALLOWLIST ?? (import.meta.env.PROD ? "true" : "false"))
      .trim()
      .toLowerCase();
    return raw === "true" || raw === "1" || raw === "yes";
  }, []);

  const isAllowedAdmin = useMemo(() => {
    if (!user?.email) return false;
    if (!adminAllowListConfigured) return !requireAdminAllowList;
    return adminAllowList.includes(user.email.toLowerCase());
  }, [user?.email, adminAllowList, adminAllowListConfigured, requireAdminAllowList]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen flex items-center justify-center">Chargement session admin...</div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const unauthenticated = !session || !user;
  const unauthorized = session && user && !isAllowedAdmin;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                unauthenticated ? (
                  <AdminAuthPage />
                ) : unauthorized ? (
                  <div className="min-h-screen flex items-center justify-center px-4 text-center">
                    <div className="space-y-3">
                      <h1 className="text-xl font-bold">Acces refuse</h1>
                      <p className="text-muted-foreground">
                        {!adminAllowListConfigured && requireAdminAllowList
                          ? "Configuration manquante: definissez VITE_ADMIN_EMAILS pour autoriser les comptes admin."
                          : "Cet utilisateur n'est pas dans la liste admin autorisee."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Index adminEmail={user.email || "admin"} onSignOut={handleSignOut} />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
