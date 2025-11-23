/**
 * Servicio para cálculo de hitos (milestones) de creadores
 * Centraliza la lógica de metas de diamantes, días y horas
 */

export const DIAMOND_MILESTONES = [100_000, 300_000, 500_000, 1_000_000] as const;
export const DAY_MILESTONES = [12, 20, 22] as const;
export const HOUR_MILESTONES = [40, 60, 80] as const;

export interface MilestoneStatus {
  current: number;
  next: number | null;
  remaining: number | null;
  achieved: boolean;
  eta: number | null; // días estimados para alcanzar el próximo hito
  progress: number; // porcentaje de progreso al próximo hito (0-100)
}

export interface AllMilestones {
  diamonds: MilestoneStatus;
  days: MilestoneStatus;
  hours: MilestoneStatus;
}

/**
 * Calcula el estado de un hito basado en valor actual y array de metas
 */
export function calculateMilestoneStatus(
  current: number,
  milestones: readonly number[],
  dailyRate?: number, // tasa diaria para calcular ETA
  daysRemaining?: number
): MilestoneStatus {
  // Encontrar el próximo hito no alcanzado
  const next = milestones.find(m => m > current) || null;
  const remaining = next ? next - current : null;
  const achieved = !next; // Si no hay próximo, ya se alcanzó el máximo
  
  // Calcular ETA (estimación de días para alcanzar)
  let eta: number | null = null;
  if (remaining && dailyRate && dailyRate > 0) {
    eta = Math.ceil(remaining / dailyRate);
  }
  
  // Calcular progreso hacia el próximo hito
  let progress = 0;
  if (next) {
    const previousMilestone = milestones
      .slice()
      .reverse()
      .find(m => m <= current) || 0;
    const range = next - previousMilestone;
    const currentProgress = current - previousMilestone;
    progress = range > 0 ? Math.round((currentProgress / range) * 100) : 0;
  } else {
    progress = 100; // Si ya alcanzó el máximo
  }
  
  return {
    current,
    next,
    remaining,
    achieved,
    eta,
    progress: Math.min(100, Math.max(0, progress))
  };
}

/**
 * Calcula todos los hitos para un creador
 */
export function calculateAllMilestones(
  currentDiamonds: number,
  currentDays: number,
  currentHours: number,
  daysInMonth: number,
  daysRemaining: number
): AllMilestones {
  const daysElapsed = daysInMonth - daysRemaining;
  
  // Para diamantes: tasa diaria promedio
  const diamondsDailyRate = daysElapsed > 0 ? currentDiamonds / daysElapsed : 0;
  
  // Para días live: frecuencia de hacer live (días live / días calendario)
  // Si alguien ha hecho 15 días live en 20 días calendario, la frecuencia es 0.75
  // Esto nos dice qué tan probable es que haga live cada día
  const liveDayFrequency = daysElapsed > 0 ? currentDays / daysElapsed : 0;
  
  // Para horas: tasa de horas por día calendario (no por día live)
  const hoursDailyRate = daysElapsed > 0 ? currentHours / daysElapsed : 0;
  
  return {
    diamonds: calculateMilestoneStatus(
      currentDiamonds,
      DIAMOND_MILESTONES,
      diamondsDailyRate,
      daysRemaining
    ),
    days: calculateMilestoneStatus(
      currentDays,
      DAY_MILESTONES,
      liveDayFrequency, // Ahora usa la frecuencia correcta
      daysRemaining
    ),
    hours: calculateMilestoneStatus(
      currentHours,
      HOUR_MILESTONES,
      hoursDailyRate,
      daysRemaining
    )
  };
}

/**
 * Genera un resumen textual del estado de hitos
 */
export function getMilestoneSummary(milestones: AllMilestones): string {
  const parts: string[] = [];
  
  if (milestones.diamonds.next) {
    const remaining = milestones.diamonds.remaining || 0;
    parts.push(`💎 Faltan ${remaining.toLocaleString()} diamantes para ${(milestones.diamonds.next / 1000)}K`);
  } else {
    parts.push(`💎 ¡Meta máxima alcanzada! (1M)`);
  }
  
  if (milestones.days.next) {
    const remaining = milestones.days.remaining || 0;
    parts.push(`📅 Faltan ${remaining} días live para alcanzar ${milestones.days.next} días`);
  }
  
  if (milestones.hours.next) {
    const remaining = milestones.hours.remaining || 0;
    parts.push(`⏰ Faltan ${remaining.toFixed(1)} horas para alcanzar ${milestones.hours.next}h`);
  }
  
  return parts.join(' • ');
}
