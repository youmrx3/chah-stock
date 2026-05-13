import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatsCard({ title, value, icon: Icon, variant = "default" }: StatsCardProps) {
  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };

  const borderStyles = {
    default: "border-l-primary",
    success: "border-l-success",
    warning: "border-l-warning",
    danger: "border-l-destructive",
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-l-[3px] ${borderStyles[variant]} bg-card/90 backdrop-blur-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${iconStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight break-words mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
