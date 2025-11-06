/**
 * Componentes Neo - Sistema de Diseño Neoformista
 * 
 * Biblioteca de componentes base que implementan el diseño neoformista premium.
 * Todos los componentes siguen los tokens centralizados en design-tokens/
 */

export {
  NeoCard,
  NeoCardHeader,
  NeoCardTitle,
  NeoCardDescription,
  NeoCardContent,
  NeoCardFooter,
  type NeoCardProps,
} from './NeoCard';

export {
  NeoButton,
  neoButtonVariants,
  type NeoButtonProps,
} from './NeoButton';

export {
  NeoInput,
  NeoTextarea,
  type NeoInputProps,
  type NeoTextareaProps,
} from './NeoInput';

export {
  NeoKPICard,
  NeoKPIGrid,
  type NeoKPICardProps,
  type NeoKPIGridProps,
} from './NeoKPICard';
