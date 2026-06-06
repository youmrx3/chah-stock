import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ShopLayout } from "@/components/shop/ShopLayout";
import ShopLanding from "@/pages/shop/ShopLanding";
import ShopCatalog from "@/pages/shop/ShopCatalog";
import ShopProduct from "@/pages/shop/ShopProduct";
import ShopCategories from "@/pages/shop/ShopCategories";
import ShopBrands from "@/pages/shop/ShopBrands";
import ShopCart from "@/pages/shop/ShopCart";
import ShopAccount from "@/pages/shop/ShopAccount";
import ShopAuth from "@/pages/shop/ShopAuth";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/shop" element={<ShopLayout />}>
              <Route index element={<ShopLanding />} />
              <Route path="catalog" element={<ShopCatalog />} />
              <Route path="product/:id" element={<ShopProduct />} />
              <Route path="categories" element={<ShopCategories />} />
              <Route path="brands" element={<ShopBrands />} />
              <Route path="cart" element={<ShopCart />} />
              <Route path="account" element={<ShopAccount />} />
              <Route path="auth" element={<ShopAuth />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
