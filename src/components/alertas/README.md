# Sistema de Diseño - Alertas y Sugerencias

## Espaciado (Scale 8px)

Todos los componentes siguen una escala base de 8px con múltiplos consistentes:

- **Micro (2px)**: `gap-0.5` - Separación mínima entre badges
- **Tiny (4px)**: `gap-1` - Separación dentro de badges y etiquetas
- **Small (8px)**: `gap-2, p-2` - Separación entre íconos y texto
- **Base (12px)**: `gap-3, p-3` - Separación estándar entre elementos relacionados
- **Medium (16px)**: `gap-4, p-4` - Separación entre secciones menores
- **Large (24px)**: `gap-6, p-6` - Padding de tarjetas principales
- **XLarge (32px)**: `gap-8, p-8` - Separación entre secciones mayores
- **XXLarge (48px)**: `gap-12, p-12` - Espaciado en estados vacíos

## Tipografía

### Jerarquía de títulos
- **H1** (Page Title): `text-2xl font-semibold` - Título principal de página
- **H2** (Section Title): `text-xl font-semibold` - Títulos de sección
- **H3** (Card Title): `text-lg font-semibold` - Títulos de tarjeta
- **Body**: `text-sm` - Texto base
- **Caption**: `text-xs uppercase tracking-wider` - Etiquetas y metadatos

### Pesos
- **Regular**: Font weight 400 (por defecto)
- **Medium**: Font weight 500 (`font-medium`)
- **Semibold**: Font weight 600 (`font-semibold`)

## Sistema de Colores

Usamos semantic tokens del design system (evitar colores hardcodeados):

### Variantes de componentes
- **Default**: `border-border, text-foreground, bg-background`
- **Danger**: `border-destructive/50, bg-destructive/5, text-destructive`
- **Warning**: `border-yellow-500/50, bg-yellow-500/5, text-yellow-600`
- **Success**: `border-green-500/50, bg-green-500/5, text-green-600`

### Estados
- **Hover**: `hover:shadow-lg, hover:scale-105`
- **Active**: `active:scale-95`
- **Focus**: `ring-2 ring-offset-2 ring-primary`
- **Disabled**: `opacity-50 pointer-events-none`

## Bordes y Sombras

- **Border radius**: `rounded-2xl` (16px) para tarjetas principales
- **Border radius small**: `rounded-xl` (12px) para botones y elementos internos
- **Border radius full**: `rounded-full` para badges y chips
- **Border width**: `border-2` para énfasis, `border` para sutil
- **Shadow**: `shadow-md` para hover, sin shadow por defecto

## Iconografía

- **Tamaño estándar**: `h-4 w-4` (16px) para íconos en botones
- **Tamaño medio**: `h-5 w-5` (20px) para íconos en cards
- **Tamaño grande**: `h-6 w-6` (24px) para íconos principales
- **Stroke width**: 2 (por defecto en lucide-react)

## Targets táctiles

Todos los elementos interactivos cumplen con WCAG AA:
- **Mínimo**: 40x40px (`min-h-[40px]` en botones)
- **Recomendado**: 44x44px (`min-h-[44px]` para CTAs principales)

## Componentes

### KpiCard
Tarjeta de métricas con:
- Padding: `p-6`
- Border radius: `rounded-2xl`
- Variantes: default, danger, warning, success
- Incluye trend opcional

### FilterChips
Chips de filtro con:
- Padding: `px-4 py-2`
- Border radius: `rounded-full`
- Animación: `hover:scale-105 active:scale-95`
- Contador de resultados en badge

### RiskTable
Tarjetas de creadores con:
- Padding: `p-6`
- Border radius: `rounded-2xl`
- Grid responsive: `grid-cols-2 md:grid-cols-4`
- Spacing interno: `gap-4, gap-6`

### ActionCell
Botones de acción con:
- Min height: `min-h-[40px]`
- Border radius: `rounded-xl`
- Tooltips informativos
- Estados disabled claros

### EmptyState
Estados vacíos con:
- Padding: `p-12`
- Max width: `max-w-md`
- Spacing: `space-y-6`
- Íconos grandes: `h-12 w-12`

### UploaderModal
Modal de carga con:
- Max width: `sm:max-w-2xl`
- Border radius: `rounded-2xl`
- Padding: `p-12`
- Drag & drop visual

## Accesibilidad

- **Contraste**: Mínimo AA (4.5:1 para texto normal)
- **Focus states**: Siempre visibles con `ring-2`
- **ARIA labels**: En todos los botones e inputs
- **Keyboard navigation**: Tab order lógico
- **Screen readers**: Labels descriptivos
- **Targets táctiles**: ≥40px

## Responsive

### Breakpoints
- **Mobile**: 390px - 767px
- **Tablet**: 768px - 1023px
- **Laptop**: 1024px - 1279px
- **Desktop**: 1280px+

### Estrategias
- Grid adaptativo: `grid-cols-2 md:grid-cols-4`
- Flex wrap: `flex-wrap`
- Hidden en móvil: `hidden sm:inline`
- Stack en móvil: `flex-col sm:flex-row`
