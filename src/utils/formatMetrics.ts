/**
 * FASE 1: Formato consistente de métricas en toda la aplicación
 * Todos los números de días, horas, diamantes y porcentajes deben usar estas funciones
 */

export const formatMetrics = {
  /**
   * Formatea días (siempre entero)
   */
  days: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0';
    return Math.round(value).toString();
  },

  /**
   * Formatea horas (1 decimal máximo)
   */
  hours: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0.0h';
    return value.toFixed(1) + 'h';
  },

  /**
   * Formatea diamantes (sin decimales, con separadores de miles)
   */
  diamonds: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0';
    return Math.round(value).toLocaleString('es-MX', { maximumFractionDigits: 0 });
  },

  /**
   * Formatea porcentaje con signo (1 decimal)
   */
  percentage: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0.0%';
    const formatted = value.toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  },

  /**
   * Formatea moneda USD (2 decimales)
   */
  currency: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '$0.00 USD';
    return `$${value.toFixed(2)} USD`;
  },

  /**
   * Formatea números en formato abreviado (K, M)
   */
  abbreviated: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0';
    
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`;
    }
    return Math.round(value).toString();
  },

  /**
   * Formatea delta (diferencia) con color semántico
   */
  delta: (value: number | null | undefined): {
    text: string;
    isPositive: boolean;
    isNeutral: boolean;
  } => {
    if (value === null || value === undefined || value === 0) {
      return { text: '—', isPositive: false, isNeutral: true };
    }

    const formatted = Math.abs(value).toFixed(1);
    return {
      text: value > 0 ? `+${formatted}` : `-${formatted}`,
      isPositive: value > 0,
      isNeutral: false,
    };
  },

  /**
   * Formatea fecha a texto legible
   */
  date: (value: string | Date | null | undefined): string => {
    if (!value) return '—';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  },

  /**
   * Formatea fecha relativa (ej: "hace 3 días")
   */
  dateRelative: (value: string | Date | null | undefined): string => {
    if (!value) return '—';
    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  },
};

/**
 * Valida que un número sea válido (no NaN, no Infinity)
 */
export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Sanitiza un número a 0 si es inválido
 */
export const sanitizeNumber = (value: any, defaultValue: number = 0): number => {
  if (isValidNumber(value)) return value;
  return defaultValue;
};
