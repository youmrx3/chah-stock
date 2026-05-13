import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Brand, Origin, Fournisseur, Category } from "@/types/stock";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: "all" | "in-stock" | "low-stock" | "out-of-stock";
  onFilterChange: (value: "all" | "in-stock" | "low-stock" | "out-of-stock") => void;
  brands?: Brand[];
  origins?: Origin[];
  fournisseurs?: Fournisseur[];
  categories?: Category[];
  filterBrandId?: string;
  onFilterBrandChange?: (value: string) => void;
  filterOriginId?: string;
  onFilterOriginChange?: (value: string) => void;
  filterFournisseurId?: string;
  onFilterFournisseurChange?: (value: string) => void;
  filterCategoryId?: string;
  onFilterCategoryChange?: (value: string) => void;
  filterPriceMin?: string;
  onFilterPriceMinChange?: (value: string) => void;
  filterPriceMax?: string;
  onFilterPriceMaxChange?: (value: string) => void;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  brands = [],
  origins = [],
  fournisseurs = [],
  categories = [],
  filterBrandId = "all",
  onFilterBrandChange,
  filterOriginId = "all",
  onFilterOriginChange,
  filterFournisseurId = "all",
  onFilterFournisseurChange,
  filterCategoryId = "all",
  onFilterCategoryChange,
  filterPriceMin = "",
  onFilterPriceMinChange,
  filterPriceMax = "",
  onFilterPriceMaxChange,
}: SearchBarProps) {
  const isMobile = useIsMobile();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filterLabels = {
    all: "Tous",
    "in-stock": "En stock",
    "low-stock": "Stock bas",
    "out-of-stock": "Rupture",
  };

  const hasAdvancedFilters = filterBrandId !== "all" || filterOriginId !== "all" || filterFournisseurId !== "all" || filterCategoryId !== "all" || filterPriceMin || filterPriceMax;

  const clearAllFilters = () => {
    onFilterChange("all");
    onFilterBrandChange?.("all");
    onFilterOriginChange?.("all");
    onFilterFournisseurChange?.("all");
    onFilterCategoryChange?.("all");
    onFilterPriceMinChange?.("");
    onFilterPriceMaxChange?.("");
    onSearchChange("");
  };

  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-2.5 sm:p-4 shadow-sm space-y-2.5 sm:space-y-3">
      {/* Main search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative w-full sm:flex-1 sm:min-w-[220px] sm:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, référence, fournisseur..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-background/85 border-border/70"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-10 px-3 sm:px-4 border-border/70 bg-background/80">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-sm">{filterLabels[filterStatus]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuRadioGroup
                value={filterStatus}
                onValueChange={(value) =>
                  onFilterChange(value as typeof filterStatus)
                }
              >
                <DropdownMenuRadioItem value="all">Tous les produits</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="in-stock">En stock</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="low-stock">Stock bas</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="out-of-stock">Rupture de stock</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl text-xs"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
            >
              {showAdvancedFilters ? "Masquer filtres" : "Plus de filtres"}
            </Button>
          )}

          {hasAdvancedFilters && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-destructive h-10 rounded-xl" onClick={clearAllFilters}>
              <X className="h-3.5 w-3.5" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Row */}
      {(!isMobile || showAdvancedFilters) && (
      <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 flex-wrap pt-1">
        {fournisseurs.length > 0 && onFilterFournisseurChange && (
          <Select value={filterFournisseurId} onValueChange={onFilterFournisseurChange}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm rounded-xl bg-background/85 border-border/70">
              <SelectValue placeholder="Fournisseur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous fournisseurs</SelectItem>
              {fournisseurs.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {categories.length > 0 && onFilterCategoryChange && (
          <Select value={filterCategoryId} onValueChange={onFilterCategoryChange}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm rounded-xl bg-background/85 border-border/70">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {brands.length > 0 && onFilterBrandChange && (
          <Select value={filterBrandId} onValueChange={onFilterBrandChange}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm rounded-xl bg-background/85 border-border/70">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes marques</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {origins.length > 0 && onFilterOriginChange && (
          <Select value={filterOriginId} onValueChange={onFilterOriginChange}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm rounded-xl bg-background/85 border-border/70">
              <SelectValue placeholder="Origine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes origines</SelectItem>
              {origins.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {onFilterPriceMinChange && onFilterPriceMaxChange && (
          <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto sm:flex sm:items-center">
            <Input
              type="number"
              placeholder="Min"
              value={filterPriceMin}
              onChange={(e) => onFilterPriceMinChange(e.target.value)}
              className="w-full sm:w-[100px] h-9 text-sm rounded-xl bg-background/85 border-border/70"
              min={0}
            />
            <span className="hidden sm:inline text-muted-foreground text-xs">–</span>
            <Input
              type="number"
              placeholder="Max"
              value={filterPriceMax}
              onChange={(e) => onFilterPriceMaxChange(e.target.value)}
              className="w-full sm:w-[100px] h-9 text-sm rounded-xl bg-background/85 border-border/70"
              min={0}
            />
          </div>
        )}
      </div>
      )}
    </div>
  );
}
