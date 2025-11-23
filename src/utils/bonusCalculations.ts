/**
 * FASE 7: Funciones auxiliares compartidas para cálculo de bonificaciones
 * Centraliza toda la lógica de hitos, metas y bonos
 */

/**
 * Umbrales fijos de diamantes
 */
export const DIAMOND_MILESTONES = [50_000, 100_000, 300_000, 500_000, 1_000_000] as const;

/**
 * Umbrales fijos de días live
 */
export const DAY_MILESTONES = [12, 20, 22] as const;

/**
 * Umbrales fijos de horas live
 */
export const HOUR_MILESTONES = [40, 60, 80] as const;

/**
 * Valor del bono por día extra después del día 22
 */
export const BONUS_PER_EXTRA_DAY = 3; // $3 USD

/**
 * Encuentra el próximo hito para un valor dado
 */
export const getNextMilestone = <T extends number>(
  current: number,
  milestones: readonly T[]
): { target: T; remaining: number; achieved: boolean } => {
  const next = milestones.find(m => m > current);
  
  if (!next) {
    // Ya alcanzó el máximo
    return {
      target: milestones[milestones.length - 1],
      remaining: 0,
      achieved: true,
    };
  }

  return {
    target: next,
    remaining: next - current,
    achieved: false,
  };
};

/**
 * Calcula el progreso porcentual hacia un objetivo
 */
export const calculateProgress = (current: number, target: number): number => {
  if (target <= 0) return 0;
  return Math.min(100, (current / target) * 100);
};

/**
 * Calcula el bono por días extra (después del día 22)
 */
export const calculateExtraDaysBonus = (totalDays: number): {
  extraDays: number;
  bonusUSD: number;
} => {
  const extraDays = Math.max(0, totalDays - 22);
  return {
    extraDays,
    bonusUSD: extraDays * BONUS_PER_EXTRA_DAY,
  };
};

/**
 * Determina el estado del semáforo para un objetivo de diamantes
 */
export const getSemaforoStatus = (
  current: number,
  target: number,
  daysRemaining: number
): 'verde' | 'amarillo' | 'rojo' => {
  const progress = calculateProgress(current, target);
  
  if (progress >= 100) return 'verde';
  if (progress >= 85) return 'verde'; // Muy cerca
  
  // Calcular ritmo requerido
  const remaining = target - current;
  const requiredPerDay = daysRemaining > 0 ? remaining / daysRemaining : Infinity;
  
  // Si el ritmo requerido es razonable, amarillo; si no, rojo
  const currentRate = current / Math.max(1, 30 - daysRemaining);
  
  if (currentRate >= requiredPerDay * 0.85) return 'amarillo';
  return 'rojo';
};

/**
 * Calcula todos los hitos de diamantes con sus estados
 */
export const calculateDiamondMilestones = (
  currentDiamonds: number,
  daysRemaining: number
): Array<{
  target: number;
  label: string;
  remaining: number;
  achieved: boolean;
  semaforo: 'verde' | 'amarillo' | 'rojo';
  requiredPerDay: number;
}> => {
  return DIAMOND_MILESTONES.map(target => {
    const remaining = Math.max(0, target - currentDiamonds);
    const achieved = currentDiamonds >= target;
    const requiredPerDay = daysRemaining > 0 ? remaining / daysRemaining : 0;
    const semaforo = achieved ? 'verde' : getSemaforoStatus(currentDiamonds, target, daysRemaining);

    return {
      target,
      label: `${target / 1000}K`,
      remaining,
      achieved,
      semaforo,
      requiredPerDay: Math.round(requiredPerDay),
    };
  });
};

/**
 * Calcula el hito combinado de días/horas (ej: 12d/40h)
 */
export const calculateDayHourMilestone = (
  currentDays: number,
  currentHours: number,
  targetDays: number,
  targetHours: number
): {
  daysAchieved: boolean;
  hoursAchieved: boolean;
  bothAchieved: boolean;
  daysProgress: number;
  hoursProgress: number;
} => {
  const daysAchieved = currentDays >= targetDays;
  const hoursAchieved = currentHours >= targetHours;

  return {
    daysAchieved,
    hoursAchieved,
    bothAchieved: daysAchieved && hoursAchieved,
    daysProgress: calculateProgress(currentDays, targetDays),
    hoursProgress: calculateProgress(currentHours, targetHours),
  };
};

/**
 * Estima ETA (días restantes) para alcanzar un objetivo
 */
export const estimateETA = (
  current: number,
  target: number,
  currentRate: number
): number => {
  if (current >= target) return 0;
  if (currentRate <= 0) return 999; // Sin actividad

  const remaining = target - current;
  return Math.ceil(remaining / currentRate);
};

/**
 * Calcula el total de bonos alcanzados
 */
export const calculateTotalBonus = (bonif: {
  grad_50k?: boolean;
  grad_100k?: boolean;
  grad_300k?: boolean;
  grad_500k?: boolean;
  grad_1m?: boolean;
  dias_live_mes?: number;
  bono_dias_extra_usd?: number;
}): {
  diamondBonus: number;
  extraDaysBonus: number;
  totalUSD: number;
  breakdown: string[];
} => {
  const breakdown: string[] = [];
  let diamondBonus = 0;

  // Bonos por diamantes (los valores reales deben venir del negocio)
  if (bonif.grad_1m) {
    diamondBonus += 1000;
    breakdown.push('1M diamantes: $1000');
  } else if (bonif.grad_500k) {
    diamondBonus += 500;
    breakdown.push('500K diamantes: $500');
  } else if (bonif.grad_300k) {
    diamondBonus += 300;
    breakdown.push('300K diamantes: $300');
  } else if (bonif.grad_100k) {
    diamondBonus += 200;
    breakdown.push('100K diamantes: $200');
  } else if (bonif.grad_50k) {
    diamondBonus += 100;
    breakdown.push('50K diamantes: $100');
  }

  const extraDaysBonus = bonif.bono_dias_extra_usd || 0;
  if (extraDaysBonus > 0) {
    const extraDays = bonif.dias_live_mes ? bonif.dias_live_mes - 22 : 0;
    breakdown.push(`${extraDays} días extra: $${extraDaysBonus.toFixed(2)}`);
  }

  return {
    diamondBonus,
    extraDaysBonus,
    totalUSD: diamondBonus + extraDaysBonus,
    breakdown,
  };
};

/**
 * Determina la meta recomendada basada en progreso actual
 */
export const getRecommendedGoal = (
  currentDiamonds: number,
  daysRemaining: number,
  currentDays: number
): string => {
  const rate = currentDays > 0 ? currentDiamonds / currentDays : 0;
  const projectedEOM = rate * (currentDays + daysRemaining);

  if (projectedEOM >= 1_000_000) return '1M';
  if (projectedEOM >= 500_000) return '500K';
  if (projectedEOM >= 300_000) return '300K';
  if (projectedEOM >= 100_000) return '100K';
  return '50K';
};
