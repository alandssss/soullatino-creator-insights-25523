import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const variantStyles = {
  default: 'border-border',
  danger: 'border-destructive/50 bg-destructive/5',
  warning: 'border-yellow-500/50 bg-yellow-500/5',
  success: 'border-green-500/50 bg-green-500/5',
};

const iconVariantStyles = {
  default: 'text-muted-foreground',
  danger: 'text-destructive',
  warning: 'text-yellow-600',
  success: 'text-green-600',
};

export function KpiCard({ title, value, icon: Icon, variant = 'default', trend }: KpiCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden rounded-2xl border-2 p-6 transition-all hover:shadow-md",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-semibold leading-none tracking-tight">
            {value}
          </p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "rounded-xl bg-background/50 p-3",
          iconVariantStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
