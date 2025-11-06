import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeoCard } from "./NeoCard";

export interface NeoKPICardProps {
  /**
   * Label descriptivo del KPI (ej: "Seguidores", "Engagement Rate")
   */
  label: string;
  
  /**
   * Valor principal del KPI
   */
  value: string | number;
  
  /**
   * Delta opcional que muestra cambio porcentual
   */
  delta?: {
    value: number;
    direction: 'up' | 'down';
    label?: string; // ej: "vs. semana anterior"
  };
  
  /**
   * Insight accionable que ayuda al usuario a entender qué hacer
   */
  insight?: string;
  
  /**
   * Ícono opcional que representa el KPI
   */
  icon?: LucideIcon;
  
  /**
   * Variante de color para diferentes tipos de KPIs
   */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  
  /**
   * Si true, el card es clickeable
   */
  onClick?: () => void;
}

const variantStyles = {
  default: {
    icon: "text-muted-foreground/60",
    delta: "",
  },
  primary: {
    icon: "text-primary/60",
    delta: "text-primary",
  },
  success: {
    icon: "text-green-600/60 dark:text-green-400/60",
    delta: "text-green-600 dark:text-green-400",
  },
  warning: {
    icon: "text-yellow-600/60 dark:text-yellow-400/60",
    delta: "text-yellow-600 dark:text-yellow-400",
  },
  danger: {
    icon: "text-destructive/60",
    delta: "text-destructive",
  },
};

/**
 * NeoKPICard - Card especializado para mostrar KPIs con insights
 * 
 * Características:
 * - Diseño neoformista con elevación sutil
 * - Delta visual con dirección clara (↑/↓)
 * - Insight accionable con ícono de lightbulb
 * - Variantes de color según tipo de métrica
 * - Responsive y accesible
 * 
 * @example
 * ```tsx
 * <NeoKPICard
 *   label="Seguidores"
 *   value="12,453"
 *   delta={{ value: 8.5, direction: 'up', label: 'vs. semana anterior' }}
 *   insight="Tu crecimiento está 15% por encima del promedio. Mantén la frecuencia de publicación."
 *   icon={Users}
 *   variant="success"
 * />
 * ```
 */
export const NeoKPICard = React.forwardRef<HTMLDivElement, NeoKPICardProps>(
  ({ label, value, delta, insight, icon: Icon, variant = 'default', onClick }, ref) => {
    const styles = variantStyles[variant];
    const isInteractive = !!onClick;
    
    return (
      <NeoCard
        ref={ref}
        variant="elevated"
        padding="md"
        interactive={isInteractive}
        onClick={onClick}
        className={cn(
          "h-full",
          isInteractive && "cursor-pointer"
        )}
      >
        {/* Header con label e ícono */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {Icon && (
            <Icon 
              className={cn("h-5 w-5", styles.icon)} 
              aria-hidden="true"
            />
          )}
        </div>
        
        {/* Valor principal y delta */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold tracking-tight">
            {value}
          </span>
          
          {delta && (
            <div className="flex items-center gap-1">
              {delta.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  delta.direction === 'up' 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-destructive"
                )}
              >
                {Math.abs(delta.value)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Label del delta */}
        {delta?.label && (
          <p className="text-xs text-muted-foreground mb-2">
            {delta.label}
          </p>
        )}
        
        {/* Insight accionable */}
        {insight && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
              <span className="text-sm" aria-hidden="true">💡</span>
              <span className="flex-1">{insight}</span>
            </p>
          </div>
        )}
      </NeoCard>
    );
  }
);

NeoKPICard.displayName = "NeoKPICard";

/**
 * NeoKPIGrid - Grid container optimizado para KPI cards
 */
export interface NeoKPIGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
}

export const NeoKPIGrid = React.forwardRef<HTMLDivElement, NeoKPIGridProps>(
  ({ className, columns = 4, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-6",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeoKPIGrid.displayName = "NeoKPIGrid";
