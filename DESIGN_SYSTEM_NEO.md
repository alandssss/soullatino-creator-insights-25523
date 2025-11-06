# Sistema de Diseño Neoformista Premium - Soullatino Analytics

## 🎯 Filosofía del Diseño

El diseño neoformista (neumorfismo moderno) crea profundidad visual mediante **sombras duales** (luz + oscura) que simulan elevación física. Este sistema está optimizado para:

- **Claridad visual**: Jerarquía clara mediante elevaciones sutiles
- **Feedback táctil**: Transiciones que simulan interacciones físicas
- **Accesibilidad**: Contraste WCAG AA, targets táctiles ≥44px
- **Consistencia**: Tokens centralizados para todo el diseño
- **Performance**: Transiciones optimizadas (150-200ms)

---

## 📐 Tokens de Diseño

Todos los valores están centralizados en `src/design-tokens/index.ts` y sincronizados con `src/index.css`.

### Espaciado (Escala 8px)

```typescript
micro:  2px   // Separadores, badges
tiny:   4px   // Padding interno
xs:     8px   // Gap entre íconos
sm:     12px  // Elementos relacionados
base:   16px  // Secciones menores
md:     24px  // Cards principales
lg:     32px  // Secciones mayores
xl:     48px  // Estados vacíos
xxl:    64px  // Hero sections
```

**Uso:**
```tsx
<div className="p-6 gap-4">  {/* md padding, base gap */}
```

### Border Radius (Jerarquía)

```typescript
sm:   8px    // Botones pequeños
md:   12px   // Botones estándar
lg:   16px   // Cards secundarios
xl:   24px   // Cards principales (distintivo)
full: 9999px // Pills, avatars
```

**Uso:**
```tsx
<NeoCard className="rounded-2xl">  {/* 24px = xl */}
<NeoButton className="rounded-xl"> {/* 12px = md */}
```

### Sombras Neomórficas

Las sombras están definidas en `index.css` como variables CSS:

```css
/* Light mode */
--neo-shadow-light: -8px -8px 16px rgba(255, 255, 255, 0.8);
--neo-shadow-dark: 8px 8px 16px rgba(163, 177, 198, 0.6);

/* Pressed (inset) */
--neo-shadow-pressed-light: inset -3px -3px 6px rgba(255, 255, 255, 0.8);
--neo-shadow-pressed-dark: inset 3px 3px 6px rgba(163, 177, 198, 0.6);
```

**Uso:**
```tsx
<div className="shadow-[var(--neo-shadow-light),var(--neo-shadow-dark)]">
```

### Colores (HSL Format)

**Importante:** Usar **siempre** colores semánticos, nunca directos como `text-white`.

```typescript
// Base
--background: 220 18% 92%  // Fondo principal
--card: 220 18% 92%        // Cards (mismo que bg para efecto neo)
--foreground: 220 10% 15%  // Texto principal

// Funcionales
--primary: 211 75% 59%     // Azul brillante #4A90E2
--secondary: 119 38% 66%   // Verde suave
--accent: 175 61% 56%      // Turquesa (dark mode)
--destructive: 0 63% 51%   // Rojo para errores
```

**Uso correcto:**
```tsx
✅ <p className="text-foreground">
✅ <div className="bg-card border-border">
❌ <p className="text-black">
❌ <div className="bg-white">
```

### Tipografía

```typescript
xs:   12px  // Captions, metadatos
sm:   14px  // Body, labels
base: 16px  // Body principal
lg:   18px  // Lead text
xl:   20px  // H3, card titles
2xl:  24px  // H2, section titles
3xl:  28px  // H1, page titles
4xl:  36px  // Hero titles

Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
```

**Jerarquía:**
```tsx
<h1 className="text-3xl font-semibold">     {/* Page title */}
<h2 className="text-2xl font-semibold">     {/* Section title */}
<h3 className="text-xl font-semibold">      {/* Card title */}
<p className="text-base">                   {/* Body */}
<span className="text-xs uppercase tracking-wider"> {/* Labels */}
```

### Motion & Transitions

```typescript
duration: {
  instant: 100ms,  // Hover micro-feedback
  fast:    150ms,  // Botones, inputs
  normal:  200ms,  // Cards, modals
  slow:    300ms,  // Animaciones complejas
}

easing: cubic-bezier(0.4, 0, 0.2, 1)  // Suave y natural
```

**Uso:**
```tsx
<div className="transition-all duration-150">
<NeoButton> {/* Ya incluye transition-all duration-150 */}
```

---

## 🧩 Componentes Base

### NeoCard

Card con sombras duales para profundidad visual.

```tsx
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/neo';

<NeoCard variant="elevated" padding="md" interactive>
  <NeoCardHeader>
    <NeoCardTitle>Bonificaciones del Mes</NeoCardTitle>
  </NeoCardHeader>
  <NeoCardContent>
    {/* Contenido */}
  </NeoCardContent>
</NeoCard>
```

**Variantes:**
- `flat`: Sombra estándar
- `elevated`: Sombra pronunciada + hover effect
- `pressed`: Efecto inset (hundido)

**Padding:**
- `none`, `sm` (16px), `md` (24px), `lg` (32px)

### NeoButton

Botón con feedback táctil y estados claros.

```tsx
import { NeoButton } from '@/components/neo';

{/* Primary action */}
<NeoButton variant="primary" size="md">
  Guardar cambios
</NeoButton>

{/* Secondary action */}
<NeoButton variant="secondary" size="sm">
  Cancelar
</NeoButton>

{/* Success state */}
<NeoButton variant="success">
  ✓ Completado
</NeoButton>

{/* Destructive action */}
<NeoButton variant="destructive">
  Eliminar
</NeoButton>
```

**Variantes:**
- `primary`: Gradiente azul + glow effect
- `secondary`: Neoformista neutral
- `ghost`: Sutil, sin bordes
- `destructive`: Para acciones peligrosas
- `success`: Para acciones exitosas
- `link`: Estilo link

**Sizes:**
- `sm` (36px min), `md` (44px min), `lg` (52px min), `icon` (44x44px)

### NeoInput

Input con efecto "hundido" y estados claros.

```tsx
import { NeoInput, NeoTextarea } from '@/components/neo';

{/* Con label y helper text */}
<NeoInput
  label="Nombre del creador"
  placeholder="Ingresa el nombre"
  helperText="Mínimo 3 caracteres"
/>

{/* Estado de error */}
<NeoInput
  type="email"
  error
  helperText="Email inválido"
/>

{/* Textarea */}
<NeoTextarea
  label="Notas"
  rows={4}
  helperText="Máximo 500 caracteres"
/>
```

### NeoKPICard

Card especializado para KPIs con insights accionables.

```tsx
import { NeoKPICard, NeoKPIGrid } from '@/components/neo';
import { Users, TrendingUp } from 'lucide-react';

<NeoKPIGrid columns={4}>
  <NeoKPICard
    label="Seguidores"
    value="12,453"
    delta={{
      value: 8.5,
      direction: 'up',
      label: 'vs. semana anterior'
    }}
    insight="Tu crecimiento está 15% por encima del promedio. Mantén la frecuencia de publicación."
    icon={Users}
    variant="success"
  />
  
  <NeoKPICard
    label="Engagement Rate"
    value="5.2%"
    delta={{ value: 12, direction: 'down' }}
    insight="Intenta publicar entre las 18-20h para mejorar el engagement."
    icon={TrendingUp}
    variant="warning"
  />
</NeoKPIGrid>
```

**Variantes:**
- `default`: Gris neutral
- `primary`: Azul
- `success`: Verde
- `warning`: Amarillo
- `danger`: Rojo

---

## ✅ Checklist de Implementación

### Al crear un nuevo componente:

- [ ] Usar `NeoCard`, `NeoButton`, `NeoInput` o `NeoKPICard` como base
- [ ] Espaciado según escala 8px (`p-4`, `p-6`, `gap-3`, etc.)
- [ ] Border radius según jerarquía (`rounded-xl` botones, `rounded-2xl` cards)
- [ ] Colores semánticos (`text-foreground`, `bg-card`, nunca `text-black`)
- [ ] Transiciones suaves (`transition-all duration-150`)
- [ ] Focus states visibles (`focus-visible:ring-2`)
- [ ] Targets táctiles ≥44px (`min-h-[44px]`)
- [ ] Contraste WCAG AA ≥4.5:1 para texto normal

### Al refactorizar componentes existentes:

- [ ] Reemplazar cards por `<NeoCard>`
- [ ] Reemplazar botones por `<NeoButton>`
- [ ] Reemplazar inputs por `<NeoInput>`
- [ ] Sustituir KPIs por `<NeoKPICard>`
- [ ] Eliminar colores hardcodeados (`bg-white`, `text-black`)
- [ ] Verificar espaciado (debe seguir escala 8px)
- [ ] Verificar sombras (usar variables CSS `--neo-shadow-*`)

---

## 📊 Ejemplos de Uso

### Dashboard con KPIs

```tsx
import { NeoKPIGrid, NeoKPICard } from '@/components/neo';
import { Users, Eye, Heart, TrendingUp } from 'lucide-react';

export function DashboardKPIs() {
  return (
    <NeoKPIGrid columns={4}>
      <NeoKPICard
        label="Seguidores Totales"
        value="45,231"
        delta={{ value: 12.5, direction: 'up', label: 'último mes' }}
        insight="Tu mejor mes del año. Sigue publicando los martes y jueves."
        icon={Users}
        variant="success"
      />
      
      <NeoKPICard
        label="Views Promedio"
        value="23.4K"
        delta={{ value: 8, direction: 'up' }}
        icon={Eye}
        variant="primary"
      />
      
      <NeoKPICard
        label="Engagement Rate"
        value="4.8%"
        delta={{ value: 5, direction: 'down', label: 'vs. semana anterior' }}
        insight="Prueba agregar más preguntas en tus captions para aumentar comentarios."
        icon={Heart}
        variant="warning"
      />
      
      <NeoKPICard
        label="Crecimiento Semanal"
        value="+1,234"
        delta={{ value: 15, direction: 'up' }}
        icon={TrendingUp}
        variant="success"
      />
    </NeoKPIGrid>
  );
}
```

### Formulario con Validación

```tsx
import { NeoCard, NeoInput, NeoTextarea, NeoButton } from '@/components/neo';
import { useForm } from 'react-hook-form';

export function CreatorForm() {
  const { register, formState: { errors } } = useForm();
  
  return (
    <NeoCard variant="elevated" padding="lg">
      <form className="space-y-6">
        <NeoInput
          label="Nombre del creador"
          placeholder="María López"
          error={!!errors.name}
          helperText={errors.name?.message || "Nombre completo"}
          {...register('name', { required: 'Campo requerido' })}
        />
        
        <NeoInput
          type="email"
          label="Email"
          placeholder="maria@ejemplo.com"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email', {
            required: 'Campo requerido',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido'
            }
          })}
        />
        
        <NeoTextarea
          label="Notas"
          rows={4}
          helperText="Información adicional sobre el creador"
          {...register('notes')}
        />
        
        <div className="flex gap-3 justify-end">
          <NeoButton variant="secondary" type="button">
            Cancelar
          </NeoButton>
          <NeoButton variant="primary" type="submit">
            Guardar creador
          </NeoButton>
        </div>
      </form>
    </NeoCard>
  );
}
```

### Card Interactivo

```tsx
import { NeoCard } from '@/components/neo';
import { ChevronRight } from 'lucide-react';

export function CreatorCard({ creator }) {
  return (
    <NeoCard
      variant="elevated"
      padding="md"
      interactive
      onClick={() => openCreatorDetail(creator.id)}
      className="cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{creator.name}</h3>
          <p className="text-sm text-muted-foreground">
            {creator.followers.toLocaleString()} seguidores
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </NeoCard>
  );
}
```

---

## 🎨 Paleta de Colores Visual

### Light Mode
```
Fondo:    #dfe4ed (gris azulado claro)
Cards:    #dfe4ed (mismo para efecto neo)
Primary:  #4A90E2 (azul brillante)
Accent:   #5B9FED (azul vibrante)
Success:  #22c55e (verde)
Warning:  #eab308 (amarillo)
Danger:   #dc2626 (rojo)
```

### Dark Mode
```
Fondo:    #1E1F23 (gris oscuro suave)
Cards:    #2A2C31 (gris profundo)
Primary:  #FFD945 (amarillo suave)
Accent:   #45D6C9 (turquesa)
Success:  #22c55e (verde)
Warning:  #eab308 (amarillo)
Danger:   #dc2626 (rojo)
```

---

## 📚 Recursos

- **Storybook**: `npm run storybook` (próximamente)
- **Tokens**: `src/design-tokens/index.ts`
- **CSS Variables**: `src/index.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Ejemplos**: Este documento + componentes en `src/components/neo/`

---

## 🚀 Próximos Pasos

1. **Migrar Dashboard**: Reemplazar cards y botones existentes por componentes Neo
2. **Migrar Formularios**: Usar `NeoInput` en todos los forms
3. **Crear Storybook**: Documentar visualmente todos los componentes
4. **Tests Visuales**: Playwright para verificar sombras y estados
5. **Performance**: Medir impacto de transiciones y optimizar si necesario

---

¿Dudas? Consulta los ejemplos en `src/components/neo/` o revisa los tokens en `src/design-tokens/index.ts`.
