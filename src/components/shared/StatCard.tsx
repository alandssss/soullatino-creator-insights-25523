import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  loading?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    card: 'border-border',
    icon: 'text-muted-foreground bg-muted',
    value: 'text-foreground',
  },
  primary: {
    card: 'border-primary/50 bg-primary/5',
    icon: 'text-primary bg-primary/10',
    value: 'text-primary',
  },
  accent: {
    card: 'border-accent/50 bg-accent/5',
    icon: 'text-accent bg-accent/10',
    value: 'bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent',
  },
  success: {
    card: 'border-green-500/50 bg-green-500/5',
    icon: 'text-green-600 bg-green-100',
    value: 'text-green-600',
  },
  warning: {
    card: 'border-yellow-500/50 bg-yellow-500/5',
    icon: 'text-yellow-600 bg-yellow-100',
    value: 'text-yellow-600',
  },
  danger: {
    card: 'border-destructive/50 bg-destructive/5',
    icon: 'text-destructive bg-destructive/10',
    value: 'text-destructive',
  },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default', 
  subtitle,
  trend,
  loading,
  className 
}: StatCardProps) {
  const styles = variantStyles[variant];

  if (loading) {
    return (
      <Card className={cn("rounded-2xl border-2 p-6", className)}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300",
      "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
      styles.card,
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className={cn("text-3xl font-bold leading-none tracking-tight", styles.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              trend.value >= 0 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            )}>
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}{trend.label || ''}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "rounded-xl p-3 transition-transform group-hover:scale-110",
          styles.icon
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
