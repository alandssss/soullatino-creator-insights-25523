import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neoButtonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl font-medium transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /**
         * Primary - Botón principal con gradiente y glow effect
         */
        primary: [
          "bg-gradient-to-br from-primary to-primary/90",
          "text-primary-foreground shadow-[var(--neo-shadow-sm-light),var(--neo-shadow-sm-dark)]",
          "hover:shadow-[var(--neo-shadow-light),var(--neo-shadow-dark),var(--neo-glow-primary)]",
          "hover:scale-[1.02]",
          "active:scale-[0.98] active:shadow-[var(--neo-shadow-pressed-light),var(--neo-shadow-pressed-dark)]",
        ],
        
        /**
         * Secondary - Botón secundario con efecto neoformista
         */
        secondary: [
          "bg-card text-card-foreground border border-border/40",
          "shadow-[var(--neo-shadow-sm-light),var(--neo-shadow-sm-dark)]",
          "hover:shadow-[var(--neo-shadow-light),var(--neo-shadow-dark)]",
          "hover:scale-[1.02] hover:text-primary",
          "active:shadow-[var(--neo-shadow-pressed-light),var(--neo-shadow-pressed-dark)]",
          "active:scale-[0.98]",
        ],
        
        /**
         * Ghost - Botón sutil sin bordes ni sombras
         */
        ghost: [
          "hover:bg-muted/50 hover:text-foreground",
          "active:bg-muted",
        ],
        
        /**
         * Destructive - Botón para acciones destructivas
         */
        destructive: [
          "bg-card text-destructive border border-destructive/30",
          "shadow-[var(--neo-shadow-sm-light),var(--neo-shadow-sm-dark)]",
          "hover:shadow-[var(--neo-shadow-light),var(--neo-shadow-dark)]",
          "hover:border-destructive/50",
          "active:shadow-[var(--neo-shadow-pressed-light),var(--neo-shadow-pressed-dark)]",
        ],
        
        /**
         * Success - Botón para acciones exitosas
         */
        success: [
          "bg-card text-green-600 dark:text-green-400 border border-green-500/30",
          "shadow-[var(--neo-shadow-sm-light),var(--neo-shadow-sm-dark)]",
          "hover:shadow-[var(--neo-shadow-light),var(--neo-shadow-dark),0_0_20px_hsl(142_76%_56%/0.3)]",
          "hover:scale-[1.02]",
          "active:shadow-[var(--neo-shadow-pressed-light),var(--neo-shadow-pressed-dark)]",
          "active:scale-[0.98]",
        ],
        
        /**
         * Link - Botón estilo link
         */
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs min-h-[36px]",
        md: "h-11 px-6 text-base min-h-[44px]",
        lg: "h-12 px-8 text-lg min-h-[52px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface NeoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neoButtonVariants> {
  asChild?: boolean;
}

/**
 * NeoButton - Botón con diseño neoformista premium
 * 
 * Implementa:
 * - Sombras duales para profundidad
 * - Estados hover/active con feedback táctil
 * - Transiciones suaves (150ms)
 * - Targets táctiles accesibles (≥44px)
 * - Focus states visibles con ring
 * 
 * @example
 * ```tsx
 * <NeoButton variant="primary" size="md">
 *   Guardar cambios
 * </NeoButton>
 * 
 * <NeoButton variant="secondary" size="sm">
 *   Cancelar
 * </NeoButton>
 * ```
 */
export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(neoButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

NeoButton.displayName = "NeoButton";

export { neoButtonVariants };
