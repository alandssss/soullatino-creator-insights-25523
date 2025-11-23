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
  // Sanitizar entrada
  const sanitizedCurrent = isFinite(current) && current >= 0 ? current : 0;
  
  // Encontrar el próximo hito no alcanzado
  const next = milestones.find(m => m > sanitizedCurrent) || null;
  const remaining = next ? next - sanitizedCurrent : null;
  const achieved = !next; // Si no hay próximo, ya se alcanzó el máximo
  
  // Calcular ETA (estimación de días para alcanzar)
  let eta: number | null = null;
  if (remaining && dailyRate && isFinite(dailyRate) && dailyRate > 0.01) {
    const calculatedEta = Math.ceil(remaining / dailyRate);
    // Validar que el ETA sea razonable (máximo 365 días)
    eta = isFinite(calculatedEta) && calculatedEta <= 365 ? calculatedEta : null;
  }
  
  // Calcular progreso hacia el próximo hito
  let progress = 0;
  if (next) {
    const previousMilestone = milestones
      .slice()
      .reverse()
      .find(m => m <= sanitizedCurrent) || 0;
    const range = next - previousMilestone;
    const currentProgress = sanitizedCurrent - previousMilestone;
    progress = range > 0 ? Math.round((currentProgress / range) * 100) : 0;
  } else {
    progress = 100; // Si ya alcanzó el máximo
  }
  
  return {
    current: sanitizedCurrent,
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
  // Sanitizar entradas
  const sanitizedDiamonds = isFinite(currentDiamonds) && currentDiamonds >= 0 ? currentDiamonds : 0;
  const sanitizedDays = isFinite(currentDays) && currentDays >= 0 ? currentDays : 0;
  const sanitizedHours = isFinite(currentHours) && currentHours >= 0 ? currentHours : 0;
  
  const daysElapsed = Math.max(1, daysInMonth - daysRemaining); // Mínimo 1 para evitar división por 0
  
  // Para diamantes: tasa diaria promedio
  const diamondsDailyRate = sanitizedDiamonds / daysElapsed;
  
  // Para días live: frecuencia de hacer live (días live / días calendario)
  const liveDayFrequency = sanitizedDays / daysElapsed;
  
  // Para horas: tasa de horas por día calendario
  const hoursDailyRate = sanitizedHours / daysElapsed;
  
  return {
    diamonds: calculateMilestoneStatus(
      sanitizedDiamonds,
      DIAMOND_MILESTONES,
      diamondsDailyRate,
      daysRemaining
    ),
    days: calculateMilestoneStatus(
      sanitizedDays,
      DAY_MILESTONES,
      liveDayFrequency,
      daysRemaining
    ),
    hours: calculateMilestoneStatus(
      sanitizedHours,
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
