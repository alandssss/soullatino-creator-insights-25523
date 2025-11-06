import * as React from "react";
import { cn } from "@/lib/utils";

export interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Si true, muestra un borde de error rojo
   */
  error?: boolean;
  
  /**
   * Label opcional que se muestra encima del input
   */
  label?: string;
  
  /**
   * Mensaje de ayuda o error que se muestra debajo del input
   */
  helperText?: string;
}

/**
 * NeoInput - Input con diseño neoformista
 * 
 * Implementa:
 * - Sombra inset para efecto "hundido"
 * - Border que cambia a primary en focus
 * - Transiciones suaves
 * - Estados de error claros
 * - Accesibilidad con labels y helper text
 * 
 * @example
 * ```tsx
 * <NeoInput
 *   label="Nombre del creador"
 *   placeholder="Ingresa el nombre"
 *   helperText="Mínimo 3 caracteres"
 * />
 * 
 * <NeoInput
 *   type="email"
 *   error
 *   helperText="Email inválido"
 * />
 * ```
 */
export const NeoInput = React.forwardRef<HTMLInputElement, NeoInputProps>(
  ({ className, type, error, label, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground block"
          >
            {label}
          </label>
        )}
        
        <input
          type={type}
          id={inputId}
          className={cn(
            // Base styles
            "flex h-11 w-full rounded-xl bg-card px-4 py-3",
            "text-base transition-all duration-150",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            
            // Neomorphic effect - inset shadow
            "shadow-[var(--neo-shadow-inset-light),var(--neo-shadow-inset-dark)]",
            
            // Border states
            error
              ? "border-2 border-destructive focus:border-destructive"
              : "border-2 border-transparent focus:border-primary",
            
            // Focus state
            "focus:shadow-[var(--neo-shadow-light),var(--neo-shadow-dark)]",
            "focus:outline-none",
            
            // File input
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            
            className
          )}
          ref={ref}
          {...props}
        />
        
        {helperText && (
          <p
            className={cn(
              "text-xs leading-relaxed",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

NeoInput.displayName = "NeoInput";

/**
 * NeoTextarea - Textarea con diseño neoformista
 */
export interface NeoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

export const NeoTextarea = React.forwardRef<HTMLTextAreaElement, NeoTextareaProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground block"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            // Base styles
            "flex min-h-[120px] w-full rounded-xl bg-card px-4 py-3",
            "text-base transition-all duration-150",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            
            // Neomorphic effect
            "shadow-[var(--neo-shadow-inset-light),var(--neo-shadow-inset-dark)]",
            
            // Border states
            error
              ? "border-2 border-destructive focus:border-destructive"
              : "border-2 border-transparent focus:border-primary",
            
            // Focus state
            "focus:shadow-[var(--neo-shadow-light),var(--neo-shadow-dark)]",
            "focus:outline-none",
            
            className
          )}
          ref={ref}
          {...props}
        />
        
        {helperText && (
          <p
            className={cn(
              "text-xs leading-relaxed",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

NeoTextarea.displayName = "NeoTextarea";
