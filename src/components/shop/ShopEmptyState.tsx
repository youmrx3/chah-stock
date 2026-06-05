import { PackageSearch } from "lucide-react";

interface ShopEmptyStateProps {
  title: string;
  description?: string;
}

export function ShopEmptyState({ title, description }: ShopEmptyStateProps) {
  return (
    <div className="rounded-3xl border bg-card/80 p-10 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
        <PackageSearch className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
    </div>
  );
}
