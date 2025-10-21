# Sistema de Diseño - Soullatino Analytics

## 🎨 Filosofía de Diseño

Este proyecto sigue un sistema de diseño profesional basado en:
- **Espaciado consistente** (escala base 8px)
- **Jerarquía visual clara**
- **Accesibilidad WCAG AA**
- **Componentes reutilizables**
- **Animaciones sutiles y performantes**

## 📐 Espaciado (Scale 8px)

Todos los componentes siguen una escala base de 8px:

```tsx
// Micro espaciado
gap-0.5  // 2px - Separación mínima
gap-1    // 4px - Dentro de elementos pequeños

// Espaciado pequeño
gap-2    // 8px - Entre íconos y texto
p-2      // 8px - Padding mínimo

// Espaciado base
gap-3    // 12px - Elementos relacionados
p-3      // 12px - Padding pequeño

// Espaciado medio
gap-4    // 16px - Secciones menores
p-4      // 16px - Padding estándar

// Espaciado grande
gap-6    // 24px - Cards y containers
p-6      // 24px - Padding de cards

// Espaciado XL
gap-8    // 32px - Secciones mayores
p-8      // 32px - Padding de páginas

// Espaciado XXL
gap-12   // 48px - Separación mayor
p-12     // 48px - Estados vacíos
```

## 🔤 Tipografía

### Jerarquía de Títulos

```tsx
// H1 - Título de página
<h1 className="text-2xl font-semibold leading-none tracking-tight">
  Dashboard
</h1>

// H2 - Título de sección
<h2 className="text-xl font-semibold">
  Panel de Bonificaciones
</h2>

// H3 - Título de card
<h3 className="text-lg font-semibold">
  Métricas del Mes
</h3>

// Body - Texto base
<p className="text-sm leading-relaxed">
  Contenido principal
</p>

// Caption - Etiquetas y metadata
<p className="text-xs uppercase tracking-wider text-muted-foreground">
  Total Creadores
</p>
```

### Pesos de Fuente

- **Regular**: 400 (por defecto)
- **Medium**: 500 (`font-medium`)
- **Semibold**: 600 (`font-semibold`)
- **Bold**: 700 (`font-bold`)

## 🎨 Sistema de Colores

### Tokens Semánticos

**NUNCA usar colores hardcodeados.** Siempre usar tokens del design system:

```tsx
// ✅ CORRECTO
className="text-primary bg-primary/10 border-primary/50"

// ❌ INCORRECTO  
className="text-blue-600 bg-blue-100 border-blue-500"
```

### Variantes de Componentes

```tsx
// Default
border-border text-foreground bg-background

// Primary
border-primary/50 text-primary bg-primary/5

// Accent
border-accent/50 text-accent bg-accent/5

// Success
border-green-500/50 text-green-600 bg-green-500/5

// Warning
border-yellow-500/50 text-yellow-600 bg-yellow-500/5

// Danger
border-destructive/50 text-destructive bg-destructive/5
```

## 🔘 Bordes y Sombras

```tsx
// Bordes redondeados
rounded-2xl  // 16px - Cards principales
rounded-xl   // 12px - Botones y elementos internos
rounded-full // Completo - Badges y chips

// Grosor de borde
border-2  // Énfasis y cards principales
border    // Sutil y normal

// Sombras
hover:shadow-lg // Hover en cards
shadow-md       // Elevación media
```

## 🎭 Estados Interactivos

```tsx
// Hover
hover:shadow-lg 
hover:scale-[1.02]
hover:bg-muted/50

// Active
active:scale-[0.98]

// Focus (OBLIGATORIO para accesibilidad)
focus:outline-none 
focus:ring-2 
focus:ring-primary 
focus:ring-offset-2

// Disabled
disabled:opacity-50 
disabled:pointer-events-none
```

## 📱 Responsive Design

### Breakpoints

```tsx
// Mobile first
className="text-sm md:text-base lg:text-lg"

// Grid responsive
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

// Flex adaptativo
className="flex-col sm:flex-row"

// Ocultar en móvil
className="hidden sm:inline"
```

### Estrategias

- **Mobile**: 390px - 767px
- **Tablet**: 768px - 1023px
- **Laptop**: 1024px - 1279px
- **Desktop**: 1280px+

## ♿ Accesibilidad

### Targets Táctiles

```tsx
// Mínimo (botones secundarios)
min-h-[40px]

// Recomendado (CTAs principales)
min-h-[44px]
```

### Contraste

- **Texto normal**: Mínimo 4.5:1
- **Texto grande**: Mínimo 3:1
- Usar `text-muted-foreground` para texto secundario

### ARIA y Semántica

```tsx
// Botones con estado
<button aria-pressed={active}>
  {active ? 'Activo' : 'Inactivo'}
</button>

// Elementos informativos
<div role="status" aria-live="polite">
  {message}
</div>

// Labels descriptivos
<input aria-label="Buscar creador por nombre" />
```

## 🔧 Componentes Base Reutilizables

### StatCard

```tsx
import { StatCard } from "@/components/shared/StatCard";

<StatCard
  title="Total Creadores"
  value={150}
  icon={Users}
  variant="primary"
  trend={{ value: 12, label: '%' }}
/>
```

### PageHeader

```tsx
import { PageHeader } from "@/components/shared/PageHeader";

<PageHeader
  title="Dashboard"
  description="Panel de control principal"
  actions={
    <Button>Acción Principal</Button>
  }
/>
```

### EmptyStateCard

```tsx
import { EmptyStateCard } from "@/components/shared/EmptyStateCard";

<EmptyStateCard
  icon={FileSpreadsheet}
  title="No hay datos"
  description="Sube un archivo Excel para comenzar"
  action={{
    label: "Subir Excel",
    onClick: () => openUploader()
  }}
/>
```

### LoadingState

```tsx
import { LoadingState } from "@/components/shared/LoadingState";

<LoadingState count={4} variant="cards" />
```

## ✨ Animaciones

### Transiciones Básicas

```tsx
// Smooth transition (default)
transition-all duration-300

// Scale animation
hover:scale-[1.02] active:scale-[0.98]

// Fade in
animate-fade-in

// Loading spinner
animate-spin
```

### Animaciones de Entrada

```tsx
// Cards con entrada suave
<Card className="animate-fade-in">
  ...
</Card>

// Stagger para listas
{items.map((item, i) => (
  <div 
    key={item.id}
    style={{ animationDelay: `${i * 50}ms` }}
    className="animate-fade-in"
  >
    {item.content}
  </div>
))}
```

## 📋 Checklist de Implementación

### Al crear un nuevo componente:

- [ ] Usa tokens semánticos (no colores hardcodeados)
- [ ] Sigue escala de espaciado 8px
- [ ] Usa `rounded-2xl` para cards principales
- [ ] Targets táctiles ≥ 40px
- [ ] States de hover/focus/disabled
- [ ] Responsive (mobile first)
- [ ] ARIA labels cuando sea necesario
- [ ] Animaciones sutiles (opcional)
- [ ] Contraste AA mínimo

### Al refactorizar:

- [ ] Elimina colores directos (text-blue-600 → text-primary)
- [ ] Unifica espaciado a escala 8px
- [ ] Extrae componentes repetidos
- [ ] Aplica bordes rounded-2xl/rounded-xl
- [ ] Agrega estados interactivos
- [ ] Verifica accesibilidad

## 🚀 Ejemplos de Uso

### Card Básico

```tsx
<Card className="rounded-2xl border-2 border-border/50 p-6">
  <CardHeader className="pb-4">
    <CardTitle className="text-xl font-semibold">
      Título del Card
    </CardTitle>
  </CardHeader>
  <CardContent>
    Contenido
  </CardContent>
</Card>
```

### Botón con Variantes

```tsx
// Primary
<Button className="rounded-xl gap-2 min-h-[44px]">
  <Icon className="h-4 w-4" />
  Acción Principal
</Button>

// Secondary
<Button 
  variant="outline" 
  className="rounded-xl gap-2 min-h-[40px]"
>
  Acción Secundaria
</Button>
```

### Grid Responsive

```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard {...props} />
  <StatCard {...props} />
  <StatCard {...props} />
  <StatCard {...props} />
</div>
```

## 📚 Recursos

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Última actualización**: 2025-10-21  
**Versión**: 2.0.0
