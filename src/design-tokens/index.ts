/**
 * Design Tokens - Sistema de Diseño Premium "Command Center"
 * 
 * Theme: Obsidiana & Azul Eléctrico - Professional B2B SaaS
 */

export const colors = {
  // Fondos Obsidiana (Oscuros Premium)
  background: {
    primary: 'hsl(220, 15%, 11%)',      // #1A1D24 - Fondo principal
    card: 'hsl(220, 15%, 16%)',         // #252932 - Tarjetas
    elevated: 'hsl(220, 15%, 19%)',     // #2D3139 - Elementos elevados
    hover: 'hsl(220, 15%, 22%)',        // Hover states
  },
  
  // Acentos Premium
  accent: {
    primary: 'hsl(211, 100%, 50%)',     // #007AFF - Azul eléctrico
    primaryHover: 'hsl(211, 100%, 43%)', // #0066DD - Hover
    gold: 'hsl(45, 100%, 51%)',         // #FFC107 - Dorado (logros, dinero)
    goldGlow: 'hsl(45, 100%, 65%)',     // Glow effect
  },
  
  // Semántica de Estado
  semantic: {
    error: 'hsl(4, 76%, 57%)',          // #E53935 - Alertas críticas
    warning: 'hsl(36, 100%, 50%)',      // #FF9800 - Advertencias
    success: 'hsl(122, 39%, 49%)',      // #4CAF50 - Éxito
    info: 'hsl(207, 90%, 54%)',         // #2196F3 - Info
  },
  
  // Textos
  text: {
    primary: 'hsl(0, 0%, 100%)',        // #FFFFFF - Texto principal
    secondary: 'hsl(0, 0%, 63%)',       // #A0A0A0 - Texto secundario
    tertiary: 'hsl(0, 0%, 44%)',        // #707070 - Texto terciario
    muted: 'hsl(0, 0%, 35%)',           // #595959 - Muy muted
  },
  
  // Bordes
  border: {
    default: 'hsl(220, 15%, 22%)',      // #3A3F47 - Bordes normales
    hover: 'hsl(211, 100%, 50%)',       // #007AFF - Bordes en hover
    muted: 'hsl(220, 15%, 18%)',        // Bordes sutiles
  },
  
  // Sombras Neoformistas (mantenidas para compatibilidad)
  shadows: {
    neo: {
      light: 'var(--neo-shadow-light)',
      dark: 'var(--neo-shadow-dark)',
    },
    elevated: {
      light: 'var(--neo-shadow-light)',
      dark: 'var(--neo-shadow-dark)',
    },
  },
} as const;

/**
 * Espaciado basado en escala de 4px (más compacto para dashboards)
 */
export const spacing = {
  micro: '2px',   // 0.5
  tiny: '4px',    // 1
  xs: '8px',      // 2
  sm: '12px',     // 3
  base: '16px',   // 4
  md: '24px',     // 6
  lg: '32px',     // 8
  xl: '48px',     // 12
  xxl: '64px',    // 16
} as const;

/**
 * Border Radius - Más pronunciado para diseño premium
 */
export const borderRadius = {
  sm: '6px',      // Pequeños elementos
  md: '10px',     // Botones, inputs
  lg: '14px',     // Tarjetas secundarias
  xl: '18px',     // Tarjetas principales
  xxl: '24px',    // Elementos hero
  full: '9999px', // Pills, badges, avatars
} as const;

/**
 * Tipografía - Inter como fuente principal
 */
export const typography = {
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  sizes: {
    xs: '11px',    // Captions, metadata
    sm: '13px',    // Body pequeño, labels
    base: '15px',  // Body principal
    lg: '17px',    // Lead text
    xl: '19px',    // H4, subtítulos
    '2xl': '24px', // H3, card titles
    '3xl': '30px', // H2, section titles
    '4xl': '36px', // H1, page titles
    '5xl': '48px', // Hero titles
  },
  lineHeight: {
    tight: 1.25,   // Títulos
    normal: 1.5,   // Body
    relaxed: 1.75, // Long-form
  },
} as const;

/**
 * Motion & Transitions - Suaves y profesionales
 */
export const motion = {
  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Ease-in-out
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce
    enter: 'cubic-bezier(0, 0, 0.2, 1)',         // Ease-out
    exit: 'cubic-bezier(0.4, 0, 1, 1)',          // Ease-in
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

/**
 * Breakpoints para responsive design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
