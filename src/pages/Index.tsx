import { useState, useMemo, useEffect } from "react";
import { useStock } from "@/hooks/useStock";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useDynamicBranding } from "@/hooks/useDynamicBranding";
import { StockTable } from "@/components/StockTable";
import { StockDialog } from "@/components/StockDialog";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { StatsCard } from "@/components/StatsCard";
import { SearchBar } from "@/components/SearchBar";
import { StatisticsPanel } from "@/components/StatisticsPanel";
import { CustomFieldsManager } from "@/components/CustomFieldsManager";
import { SiteSettingsPanel } from "@/components/SiteSettingsPanel";
import { BrandOriginManager } from "@/components/BrandOriginManager";
import { CategoryManager } from "@/components/CategoryManager";
import { ClientManagement } from "@/components/ClientManagement";
import { PaymentTrackingManager } from "@/components/PaymentTrackingManager";
import { FournisseurSection } from "@/components/FournisseurSection";
import { SubproductManager } from "@/components/SubproductManager";
import { AdminAccountPanel } from "@/components/AdminAccountPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockItem } from "@/types/stock";
import { exportProductsToExcel, exportProductsToExcelDetailed, exportCatalogPdf } from "@/lib/exports";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Package,
  PackageCheck,
  PackageX,
  AlertTriangle,
  Plus,
  BarChart3,
  Settings,
  Loader2,
  Download,
  Users,
  Truck,
  TrendingUp,
  Wallet,
  ChevronDown,
  FileText,
  FileJson2,
  BookOpen,
  CreditCard,
  Trash2,
  ArrowLeft,
  LogOut,
  Home,
  Sparkles,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IndexProps {
  adminEmail?: string;
  onSignOut?: () => Promise<void>;
}

const APP_CURRENCY = "DZD";

const Index = ({ adminEmail = "admin", onSignOut }: IndexProps) => {
  const isMobile = useIsMobile();
  const {
    items,
    allItems,
    customFields,
    clients,
    clientFeatureAvailable,
    brands,
    origins,
    fournisseurs,
    categories,
    paymentTrackings,
    loading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    addItem,
    updateItem,
    deleteItem,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    updateCustomFieldValue,
    replaceProductImages,
    addClient,
    updateClient,
    deleteClient,
    addBrand,
    updateBrand,
    deleteBrand,
    addOrigin,
    updateOrigin,
    deleteOrigin,
    addCategory,
    updateCategory,
    deleteCategory,
    addFournisseur,
    updateFournisseur,
    deleteFournisseur,
    addSubProduct,
    updateSubProduct,
    deleteSubProduct,
    addPaymentTracking,
    updatePaymentTracking,
    deletePaymentTracking,
    stats,
  } = useStock();

  const { settings, updateSetting } = useSiteSettings();
  useDynamicBranding(settings);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [settingsAnchor, setSettingsAnchor] = useState<"categories" | null>(null);
  const [subProductsProductId, setSubProductsProductId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<StockItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Advanced filter states
  const [filterBrandId, setFilterBrandId] = useState("all");
  const [filterOriginId, setFilterOriginId] = useState("all");
  const [filterFournisseurId, setFilterFournisseurId] = useState("all");
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");

  // Apply advanced filters on top of hook-level search/status filter
  const advancedFilteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterBrandId !== "all" && item.brand_id !== filterBrandId) return false;
      if (filterOriginId !== "all" && item.origin_id !== filterOriginId) return false;
      if (filterFournisseurId !== "all" && item.fournisseur_id !== filterFournisseurId) return false;
      if (filterCategoryId !== "all" && item.category_id !== filterCategoryId) return false;
      if (filterPriceMin) {
        const minPrice = parseFloat(filterPriceMin);
        if (!isNaN(minPrice) && (item.price_ht || 0) < minPrice) return false;
      }
      if (filterPriceMax) {
        const maxPrice = parseFloat(filterPriceMax);
        if (!isNaN(maxPrice) && (item.price_ht || 0) > maxPrice) return false;
      }
      return true;
    });
  }, [items, filterBrandId, filterOriginId, filterFournisseurId, filterCategoryId, filterPriceMin, filterPriceMax]);

  // Lucide Truck imported from lucide-react

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: APP_CURRENCY,
      minimumFractionDigits: 0,
    }).format(value);

  const heroTotalValue = allItems.reduce((sum, item) => {
    const productValue = (item.price_ht || 0) * item.quantity;
    const subProductsValue = (item.sub_products || []).reduce(
      (subSum, subProduct) => subSum + (subProduct.price || 0) * subProduct.quantity,
      0
    );
    return sum + productValue + subProductsValue;
  }, 0);
  const heroTotalTracked = paymentTrackings.reduce((sum, record) => sum + (record.amount_willing_to_pay || 0), 0);
  const heroTotalPaid = paymentTrackings.reduce((sum, record) => sum + (record.amount_paid || 0), 0);
  const heroTotalDue = Math.max(0, heroTotalTracked - heroTotalPaid);

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete);
      setItemToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const confirmBulkDelete = async () => {
    if (selectedItemIds.length === 0) {
      setBulkDeleteDialogOpen(false);
      return;
    }

    await Promise.all(selectedItemIds.map((id) => deleteItem(id)));
    setSelectedItemIds([]);
    setBulkDeleteDialogOpen(false);
  };

  useEffect(() => {
    const allIds = new Set(allItems.map((item) => item.id));
    setSelectedItemIds((prev) => prev.filter((id) => allIds.has(id)));
  }, [allItems]);

  useEffect(() => {
    if (!detailItem) return;
    const refreshed = allItems.find((item) => item.id === detailItem.id);
    if (refreshed) {
      setDetailItem(refreshed);
    }
  }, [allItems, detailItem]);

  useEffect(() => {
    if (!editingItem) return;
    const refreshed = allItems.find((item) => item.id === editingItem.id);
    if (refreshed) {
      setEditingItem(refreshed);
    }
  }, [allItems, editingItem]);

  useEffect(() => {
    if (activeTab !== "settings" || !settingsAnchor) return;

    const targetId = settingsAnchor === "categories" ? "settings-categories-section" : null;
    if (!targetId) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setSettingsAnchor(null);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [activeTab, settingsAnchor]);

  const handleAddNew = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };
  const handleViewDetail = (item: StockItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleViewSubProductsPage = (item: StockItem) => {
    setSubProductsProductId(item.id);
    setActiveTab("sub-products");
  };

  const selectedSubProductsProduct = useMemo(
    () => allItems.find((item) => item.id === subProductsProductId) || null,
    [allItems, subProductsProductId]
  );

  const nextNumber = allItems.length > 0 ? Math.max(...allItems.map((i) => i.number)) + 1 : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-in">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Package className="h-8 w-8 text-white animate-pulse-soft" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Chargement du stock</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Veuillez patienter...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-[0_1px_0_hsl(var(--border))]">
        <div className="container py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-4">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain ring-1 ring-border" />
              ) : (
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
                  <Package className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold tracking-tight">{settings.company_name}</h1>
                <p className="text-xs text-muted-foreground">
                  {settings.company_subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
              {onSignOut && (
                <Button variant="outline" size="sm" className="gap-2 text-xs px-2 sm:px-3" onClick={onSignOut}>
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Deconnexion</span>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-xs px-2 sm:px-3">
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Export</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportProductsToExcel(allItems, APP_CURRENCY)}>
                    <FileJson2 className="h-4 w-4 mr-2" />
                    <span>Excel Basique</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportProductsToExcelDetailed(allItems, APP_CURRENCY, {
                    company_name: settings.company_name,
                    company_subtitle: settings.company_subtitle,
                    company_address: settings.company_address,
                    company_email: settings.company_email,
                    company_phone: settings.company_phone,
                    logo_url: settings.logo_url,
                    currency: APP_CURRENCY,
                  })}>
                    <FileJson2 className="h-4 w-4 mr-2" />
                    <span>Excel Détaillé (Avec Images)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportCatalogPdf(allItems, {
                    company_name: settings.company_name,
                    company_subtitle: settings.company_subtitle,
                    company_address: settings.company_address,
                    company_email: settings.company_email,
                    company_phone: settings.company_phone,
                    logo_url: settings.logo_url,
                    currency: APP_CURRENCY,
                  }, "Catalogue de Produits")}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>PDF Catalogue</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddNew} size="sm" className="gap-2 gradient-primary border-0 text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all px-2 sm:px-3">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nouveau produit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Summary */}
      <div className="border-b bg-gradient-to-b from-card/50 to-background">
        <div className="container py-4 sm:py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="group relative overflow-hidden rounded-xl border bg-card/90 backdrop-blur-sm p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Valeur Totale Stock</p>
                  <p className="text-lg font-bold tracking-tight">{formatCurrency(heroTotalValue)}</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-xl border bg-card/90 backdrop-blur-sm p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Versements (Suivi)</p>
                  <p className="text-lg font-bold tracking-tight text-success">{formatCurrency(heroTotalPaid)}</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-xl border bg-card/90 backdrop-blur-sm p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Reste Global à Payer (Suivi)</p>
                  <p className="text-lg font-bold tracking-tight text-warning">{formatCurrency(heroTotalDue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container max-w-[1900px] py-4 sm:py-6 pb-28 md:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {isMobile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card/70 p-2">
                <p className="text-xs text-muted-foreground">Section active</p>
                <p className="text-sm font-semibold">
                  {activeTab === "stock" && "Stock"}
                  {activeTab === "statistics" && "Statistiques"}
                  {activeTab === "clients" && "Clients"}
                  {activeTab === "payment-tracking" && "Suivi Paiement"}
                  {activeTab === "fournisseurs" && "Fournisseurs"}
                  {activeTab === "settings" && "Paramètres"}
                  {activeTab === "sub-products" && "Sous-produits"}
                </p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Button
                  variant={activeTab === "statistics" ? "default" : "outline"}
                  size="sm"
                  className="h-9 rounded-xl text-xs shrink-0"
                  onClick={() => setActiveTab("statistics")}
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Stats
                </Button>
                <Button
                  variant={activeTab === "sub-products" ? "default" : "outline"}
                  size="sm"
                  className="h-9 rounded-xl text-xs shrink-0"
                  onClick={() => setActiveTab("sub-products")}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Sous-produits
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-xs shrink-0"
                  onClick={() => {
                    setActiveTab("settings");
                    setSettingsAnchor("categories");
                  }}
                >
                  Lien Catégories
                </Button>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Clients: {clients.length} • Suivi: {paymentTrackings.length}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <TabsList className="h-12 p-1 bg-card/70 border backdrop-blur-sm rounded-2xl shadow-sm w-full justify-start overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="stock" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/70 px-3 sm:px-4 text-xs sm:text-sm transition-all">
                <Package className="h-4 w-4" />
                <span>Stock</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/70 px-3 sm:px-4 text-xs sm:text-sm transition-all">
                <BarChart3 className="h-4 w-4" />
                <span>{isMobile ? "Stats" : "Statistiques"}</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/70 px-3 sm:px-4 text-xs sm:text-sm transition-all">
                <Users className="h-4 w-4" />
                <span>Clients</span>
              </TabsTrigger>
              <TabsTrigger value="payment-tracking" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/70 px-3 sm:px-4 text-xs sm:text-sm transition-all">
                <CreditCard className="h-4 w-4" />
                <span>{isMobile ? "Suivi" : "Suivi Paiement"}</span>
              </TabsTrigger>
              <TabsTrigger value="fournisseurs" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/70 px-3 sm:px-4 text-xs sm:text-sm transition-all">
                <Truck className="h-4 w-4" />
                <span>{isMobile ? "Fourn." : "Fournisseurs"}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/70 px-3 sm:px-4 text-xs sm:text-sm transition-all">
                <Settings className="h-4 w-4" />
                <span>{isMobile ? "Reglages" : "Paramètres"}</span>
              </TabsTrigger>
              <TabsTrigger value="sub-products" className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/70 px-3 sm:px-4 text-xs sm:text-sm transition-all">
                <Package className="h-4 w-4" />
                <span>{isMobile ? "Sous-prod" : "Sous-produits"}</span>
              </TabsTrigger>
              </TabsList>
            </div>
          )}

          <TabsContent value="stock" className="space-y-6 animate-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Produits"
                value={stats.totalItems}
                icon={Package}
              />
              <StatsCard
                title="Quantité Totale"
                value={stats.totalQuantity}
                icon={PackageCheck}
                variant="success"
              />
              <StatsCard
                title="Stock Bas"
                value={stats.lowStock}
                icon={AlertTriangle}
                variant="warning"
              />
              <StatsCard
                title="Rupture"
                value={stats.outOfStock}
                icon={PackageX}
                variant="danger"
              />
            </div>

            {/* Search and Filter */}
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              brands={brands}
              origins={origins}
              fournisseurs={fournisseurs}
              categories={categories}
              filterBrandId={filterBrandId}
              onFilterBrandChange={setFilterBrandId}
              filterOriginId={filterOriginId}
              onFilterOriginChange={setFilterOriginId}
              filterFournisseurId={filterFournisseurId}
              onFilterFournisseurChange={setFilterFournisseurId}
              filterCategoryId={filterCategoryId}
              onFilterCategoryChange={setFilterCategoryId}
              filterPriceMin={filterPriceMin}
              onFilterPriceMinChange={setFilterPriceMin}
              filterPriceMax={filterPriceMax}
              onFilterPriceMaxChange={setFilterPriceMax}
            />

            {/* Table */}
            {selectedItemIds.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-sm">
                  {selectedItemIds.length} produit(s) sélectionné(s)
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer la sélection
                </Button>
              </div>
            )}

            <StockTable 
              items={advancedFilteredItems} 
              customFields={customFields}
              currency={APP_CURRENCY}
              selectedIds={selectedItemIds}
              onSelectionChange={setSelectedItemIds}
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onViewDetail={handleViewDetail}
              onViewSubProducts={handleViewSubProductsPage}
            />

            {/* Results count */}
            <div className="flex items-center justify-center">
              <p className="text-xs text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full">
                {advancedFilteredItems.length} sur {allItems.length} produits
              </p>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="animate-in">
            <StatisticsPanel
              stats={stats}
              items={allItems}
              clients={clients}
              paymentTrackings={paymentTrackings}
              currency={APP_CURRENCY}
            />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6 animate-in">
            <ClientManagement
              clients={clients}
              items={allItems}
              paymentTrackings={paymentTrackings}
              currency={APP_CURRENCY}
              onAdd={addClient}
              onUpdate={updateClient}
              onDelete={deleteClient}
            />
          </TabsContent>

          <TabsContent value="payment-tracking" className="space-y-6 animate-in">
            <PaymentTrackingManager
              items={allItems}
              clients={clients}
              currency={APP_CURRENCY}
              paymentRecords={paymentTrackings}
              onAddPayment={addPaymentTracking}
              onUpdatePayment={updatePaymentTracking}
              onDeletePayment={deletePaymentTracking}
            />
          </TabsContent>

          <TabsContent value="fournisseurs" className="space-y-6 animate-in">
            <FournisseurSection
              fournisseurs={fournisseurs}
              onAdd={addFournisseur}
              onUpdate={updateFournisseur}
              onDelete={deleteFournisseur}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-in">
            {onSignOut && (
              <AdminAccountPanel adminEmail={adminEmail} onSignOut={onSignOut} />
            )}
            <SiteSettingsPanel
              settings={settings}
              onUpdate={updateSetting}
            />
            <div className="max-w-2xl">
              <CustomFieldsManager
                fields={customFields}
                onAdd={addCustomField}
                onUpdate={updateCustomField}
                onDelete={deleteCustomField}
              />
            </div>
            <BrandOriginManager
              brands={brands}
              origins={origins}
              onAddBrand={addBrand}
              onUpdateBrand={updateBrand}
              onDeleteBrand={deleteBrand}
              onAddOrigin={addOrigin}
              onUpdateOrigin={updateOrigin}
              onDeleteOrigin={deleteOrigin}
            />
            <div id="settings-categories-section">
              <CategoryManager
                categories={categories}
                onAdd={addCategory}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
              />
            </div>
          </TabsContent>

          <TabsContent value="sub-products" className="space-y-6 animate-in">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 rounded-lg border p-4 bg-card">
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">Choisir le produit principal</p>
                  <Select
                    value={subProductsProductId || "none"}
                    onValueChange={(value) => setSubProductsProductId(value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="none">Aucun</SelectItem>
                      {allItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          #{item.number} - {item.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => setActiveTab("stock")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour au stock
                </Button>
              </div>

              {selectedSubProductsProduct ? (
                <>
                  <div className="rounded-lg border p-4 bg-card">
                    <p className="text-xs text-muted-foreground">Produit principal</p>
                    <p className="font-semibold">#{selectedSubProductsProduct.number} - {selectedSubProductsProduct.description}</p>
                  </div>

                  <SubproductManager
                    subproducts={selectedSubProductsProduct.sub_products || []}
                    currency={APP_CURRENCY}
                    onAdd={async (name, quantity, price) => {
                      await addSubProduct(selectedSubProductsProduct.id, name, quantity, price);
                    }}
                    onUpdate={async (id, quantity) => {
                      await updateSubProduct(id, quantity);
                    }}
                    onDelete={async (id) => {
                      await deleteSubProduct(id);
                    }}
                  />
                </>
              ) : (
                <div className="rounded-lg border p-6 text-center text-muted-foreground">
                  Sélectionnez un produit pour afficher et gérer ses sous-produits.
                </div>
              )}

              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b bg-muted/30 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm">Détails Produits et Sous-produits</h3>
                  <p className="text-xs text-muted-foreground">{allItems.length} produits • {stats.totalSubProducts} sous-produits</p>
                </div>
                <div className="p-4 sm:p-5">
                  {allItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun produit disponible</p>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {allItems.map((item) => (
                        <div key={item.id} className="rounded-lg border p-3 bg-background">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <p className="font-medium text-sm">#{item.number} - {item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Qté: {item.quantity} • Réservé: {item.reserved} • Reste: {item.remaining}
                            </p>
                          </div>

                          {(item.sub_products || []).length > 0 ? (
                            <div className="space-y-1.5">
                              {item.sub_products?.map((sp) => (
                                <div key={sp.id} className="text-xs rounded-md bg-muted/50 px-2 py-1.5 flex items-center justify-between gap-2">
                                  <span>{sp.name}</span>
                                  <span className="text-muted-foreground">Qté: {sp.quantity} • Prix: {formatCurrency(sp.price || 0)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Aucun sous-produit</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add/Edit Dialog */}
      <StockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        currency={APP_CURRENCY}
        customFields={customFields}
        brands={brands}
        origins={origins}
        fournisseurs={fournisseurs}
        categories={categories}
        onSave={addItem}
        onUpdate={updateItem}
        onUpdateCustomFieldValue={updateCustomFieldValue}
        onReplaceProductImages={replaceProductImages}
        onAddSubProduct={addSubProduct}
        onDeleteSubProduct={deleteSubProduct}
        nextNumber={nextNumber}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la sélection</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous supprimer {selectedItemIds.length} produit(s) sélectionné(s) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Detail */}
      <ProductDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={detailItem}
        customFields={customFields}
        companyProfile={{
          company_name: settings.company_name,
          company_subtitle: settings.company_subtitle,
          company_address: settings.company_address,
          company_email: settings.company_email,
          company_phone: settings.company_phone,
          logo_url: settings.logo_url,
          currency: APP_CURRENCY,
        }}
        onAddSubProduct={addSubProduct}
        onUpdateSubProduct={updateSubProduct}
        onDeleteSubProduct={deleteSubProduct}
      />

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.10)] px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
          <div className="grid grid-cols-5 gap-1">
            <Button
              variant={activeTab === "stock" ? "default" : "ghost"}
              size="sm"
              className="h-12 rounded-xl text-[10px] flex flex-col gap-0.5"
              onClick={() => setActiveTab("stock")}
            >
              <Home className="h-4 w-4" />
              <span>Stock</span>
            </Button>
            <Button
              variant={activeTab === "clients" ? "default" : "ghost"}
              size="sm"
              className="h-12 rounded-xl text-[10px] flex flex-col gap-0.5"
              onClick={() => setActiveTab("clients")}
            >
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </Button>
            <Button
              variant={activeTab === "payment-tracking" ? "default" : "ghost"}
              size="sm"
              className="h-12 rounded-xl text-[10px] flex flex-col gap-0.5"
              onClick={() => setActiveTab("payment-tracking")}
            >
              <CreditCard className="h-4 w-4" />
              <span>Suivi</span>
            </Button>
            <Button
              variant={activeTab === "fournisseurs" ? "default" : "ghost"}
              size="sm"
              className="h-12 rounded-xl text-[10px] flex flex-col gap-0.5"
              onClick={() => setActiveTab("fournisseurs")}
            >
              <Truck className="h-4 w-4" />
              <span>Fourn.</span>
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              className="h-12 rounded-xl text-[10px] flex flex-col gap-0.5"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4" />
              <span>Reglages</span>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Index;
