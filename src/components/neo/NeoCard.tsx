import * as React from "react";
import { cn } from "@/lib/utils";

export interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante visual del card
   * - flat: sombra estándar para cards base
   * - elevated: sombra más pronunciada con hover effect
   * - pressed: efecto inset para elementos presionados
   */
  variant?: 'flat' | 'elevated' | 'pressed';
  
  /**
   * Tamaño del padding interno
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /**
   * Si true, el card es interactivo con hover effects
   */
  interactive?: boolean;
}

/**
 * NeoCard - Componente base para el sistema de diseño neoformista
 * 
 * Implementa sombras duales (light + dark) para crear profundidad visual.
 * Sigue la escala de espaciado de 8px y border radius de 24px para cards principales.
 * 
 * @example
 * ```tsx
 * <NeoCard variant="elevated" padding="md">
 *   <h3>Título</h3>
 *   <p>Contenido del card</p>
 * </NeoCard>
 * ```
 */
export const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
  ({ className, variant = 'flat', padding = 'md', interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-2xl transition-all duration-200',
          'bg-card border border-border/30',
          
          // Variant styles
          variant === 'flat' && 'shadow-[var(--neo-shadow-light),var(--neo-shadow-dark)]',
          variant === 'elevated' && [
            'shadow-[var(--neo-shadow-light),var(--neo-shadow-dark)]',
            interactive && 'hover:shadow-[var(--neo-shadow-light),var(--neo-shadow-dark),var(--neo-glow-primary)]',
            interactive && 'hover:scale-[1.01]',
          ],
          variant === 'pressed' && 'shadow-[var(--neo-shadow-pressed-light),var(--neo-shadow-pressed-dark)]',
          
          // Padding styles
          padding === 'none' && 'p-0',
          padding === 'sm' && 'p-4',
          padding === 'md' && 'p-6',
          padding === 'lg' && 'p-8',
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeoCard.displayName = "NeoCard";

/**
 * NeoCardHeader - Sección de encabezado para NeoCard
 */
export const NeoCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
);
NeoCardHeader.displayName = "NeoCardHeader";

/**
 * NeoCardTitle - Título principal del card
 */
export const NeoCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
NeoCardTitle.displayName = "NeoCardTitle";

/**
 * NeoCardDescription - Descripción secundaria del card
 */
export const NeoCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
NeoCardDescription.displayName = "NeoCardDescription";

/**
 * NeoCardContent - Contenido principal del card
 */
export const NeoCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  )
);
NeoCardContent.displayName = "NeoCardContent";

/**
 * NeoCardFooter - Footer del card para acciones
 */
export const NeoCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  )
);
NeoCardFooter.displayName = "NeoCardFooter";
