/**
 * Design Tokens - Sistema de Diseño Neoformista Premium
 * 
 * Todos los valores de diseño centralizados para garantizar consistencia.
 * Estos tokens se usan en conjunto con las variables CSS definidas en index.css
 */

export const colors = {
  // Base neomórfica - gris muy claro para light mode
  neo: {
    base: 'hsl(220, 18%, 92%)',      // Fondo principal #dfe4ed
    elevated: 'hsl(220, 18%, 95%)',  // Tarjetas elevadas
    pressed: 'hsl(220, 15%, 88%)',   // Estado pressed
  },
  
  // Sombras duales (light + dark) - definidas en CSS vars
  shadows: {
    neo: {
      light: 'var(--neo-shadow-light)',
      dark: 'var(--neo-shadow-dark)',
    },
    elevated: {
      light: 'var(--neo-shadow-light)',
      dark: 'var(--neo-shadow-dark)',
    },
    pressed: {
      light: 'var(--neo-shadow-pressed-light)',
      dark: 'var(--neo-shadow-pressed-dark)',
    },
    sm: {
      light: 'var(--neo-shadow-sm-light)',
      dark: 'var(--neo-shadow-sm-dark)',
    },
  },
  
  // Colores funcionales
  primary: {
    base: 'hsl(211, 75%, 59%)',     // Azul brillante #4A90E2
    glow: 'hsl(211, 80%, 64%)',     // Azul vibrante #5B9FED
    contrast: 'hsl(0, 0%, 100%)',
  },
  
  secondary: {
    base: 'hsl(119, 38%, 66%)',     // Verde suave
    contrast: 'hsl(0, 0%, 11%)',
  },
  
  accent: {
    base: 'hsl(175, 61%, 56%)',     // Turquesa #45D6C9
    glow: '0 0 24px rgba(69, 214, 201, 0.5)',
  },
} as const;

/**
 * Espaciado basado en escala de 8px
 */
export const spacing = {
  micro: '2px',   // 0.5 - badges, separadores
  tiny: '4px',    // 1 - padding interno
  xs: '8px',      // 2 - separación íconos
  sm: '12px',     // 3 - elementos relacionados
  base: '16px',   // 4 - secciones menores
  md: '24px',     // 6 - tarjetas principales
  lg: '32px',     // 8 - secciones mayores
  xl: '48px',     // 12 - estados vacíos
  xxl: '64px',    // 16 - hero sections
} as const;

/**
 * Border Radius con jerarquía clara
 */
export const borderRadius = {
  sm: '8px',      // Botones pequeños
  md: '12px',     // Botones y elementos internos
  lg: '16px',     // Tarjetas secundarias
  xl: '24px',     // Tarjetas principales (marca distintiva)
  full: '9999px', // Pills, badges, avatars
} as const;

/**
 * Tipografía con escala modular
 */
export const typography = {
  font: {
    family: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  sizes: {
    xs: '12px',    // Captions, metadatos
    sm: '14px',    // Body, labels
    base: '16px',  // Body principal
    lg: '18px',    // Lead text
    xl: '20px',    // H3, card titles
    '2xl': '24px', // H2, section titles
    '3xl': '28px', // H1, page titles
    '4xl': '36px', // Hero titles
  },
  lineHeight: {
    tight: 1.2,    // Títulos
    normal: 1.5,   // Body
    relaxed: 1.7,  // Long-form content
  },
} as const;

/**
 * Motion & Transitions
 */
export const motion = {
  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Suave y natural
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Efecto rebote sutil
    enter: 'cubic-bezier(0, 0, 0.2, 1)',         // Entrada
    exit: 'cubic-bezier(0.4, 0, 1, 1)',          // Salida
  },
} as const;

/**
 * Elevaciones (Z-index)
 */
export const elevation = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const;
