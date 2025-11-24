import { supabase } from "@/integrations/supabase/client";
import { CreatorMetrics, Milestones, Prediction, SupervisionFlags } from "@/types/creatorMetrics";
import { formatMetrics, sanitizeNumber } from "@/utils/formatMetrics";
import { 
  DIAMOND_MILESTONES, 
  DAY_MILESTONES, 
  HOUR_MILESTONES,
  getNextMilestone,
  estimateETA,
  calculateExtraDaysBonus 
} from "@/utils/bonusCalculations";

export class CreatorMetricsService {
  /**
   * Obtiene métricas completas del creador para el mes especificado
   */
  async getMetrics(creatorId: string, month?: string): Promise<CreatorMetrics> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = targetMonth.split('-').map(Number);
    
    // 1. Obtener datos del mes actual
    const firstDay = new Date(year, monthNum - 1, 1);
    const today = new Date();
    const lastDay = new Date(year, monthNum, 0);
    
    const firstDayStr = firstDay.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    const { data: currentStats, error: currentError } = await supabase
      .from('creator_daily_stats')
      .select('duracion_live_horas, diamantes, fecha')
      .eq('creator_id', creatorId)
      .gte('fecha', firstDayStr)
      .lte('fecha', todayStr);
    
    if (currentError) throw new Error(`Error obteniendo stats actuales: ${currentError.message}`);
    
    // 2. Obtener métricas MTD reales desde creator_bonificaciones (fuente correcta)
    const { data: bonusData } = await supabase
      .from('creator_bonificaciones')
      .select('dias_live_mes, horas_live_mes, diam_live_mes')
      .eq('creator_id', creatorId)
      .eq('mes_referencia', firstDayStr)
      .maybeSingle();
    
    const liveDays_mtd = bonusData?.dias_live_mes || 0;
    const liveHours_mtd = bonusData?.horas_live_mes || 0;
    const diamonds_mtd = bonusData?.diam_live_mes || 0;
    
    // 3. Obtener datos del mes anterior
    const prevMonthFirst = new Date(year, monthNum - 2, 1).toISOString().split('T')[0];
    const prevMonthLast = new Date(year, monthNum - 1, 0).toISOString().split('T')[0];
    
    const { data: prevStats } = await supabase
      .from('creator_daily_stats')
      .select('duracion_live_horas, diamantes, fecha')
      .eq('creator_id', creatorId)
      .gte('fecha', prevMonthFirst)
      .lte('fecha', prevMonthLast);
    
    const liveDays_prevMonth = (prevStats || []).filter(d => 
      (d.diamantes || 0) > 0 || (d.duracion_live_horas || 0) >= 1.0
    ).length;
    
    // ✅ CORRECCIÓN: usar Math.max() porque son valores acumulados del mes
    const liveHours_prevMonth = prevStats && prevStats.length > 0
      ? Math.max(...prevStats.map(d => d.duracion_live_horas || 0))
      : 0;
    
    const diamonds_prevMonth = prevStats && prevStats.length > 0
      ? Math.max(...prevStats.map(d => d.diamantes || 0))
      : 0;
    
    // 4. Calcular deltas
    const deltaLiveDays = liveDays_mtd - liveDays_prevMonth;
    const deltaLiveHours = liveHours_mtd - liveHours_prevMonth;
    const deltaDiamonds = diamonds_mtd - diamonds_prevMonth;
    const deltaDiamondsPercent = diamonds_prevMonth > 0 
      ? ((diamonds_mtd / diamonds_prevMonth) - 1) * 100 
      : 0;
    
    // 5. Calcular hitos
    const nextMilestones = this.calculateMilestones(
      liveDays_mtd, 
      liveHours_mtd, 
      diamonds_mtd,
      lastDay.getDate() - today.getDate()
    );
    
    // 6. Calcular predicción
    const prediction = this.calculatePrediction(
      currentStats || [],
      lastDay.getDate()
    );
    
    // 7. Obtener flags de supervisión
    const supervisionFlags = await this.getSupervisionFlags(creatorId);
    
    return {
      creatorId,
      month: targetMonth,
      liveDays_mtd,
      liveHours_mtd,
      diamonds_mtd,
      liveDays_prevMonth,
      liveHours_prevMonth,
      diamonds_prevMonth,
      deltaLiveDays,
      deltaLiveHours,
      deltaDiamonds,
      deltaDiamondsPercent,
      nextMilestones,
      prediction,
      supervisionFlags,
      remaining_calendar_days: Math.max(0, lastDay.getDate() - today.getDate() + 1),
    };
  }
  
  /**
   * Valida que no haya duplicados en creator_daily_stats para un creador y mes
   */
  async validateNoDuplicates(creatorId: string, month: string): Promise<boolean> {
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, monthNum, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('creator_daily_stats')
      .select('fecha')
      .eq('creator_id', creatorId)
      .gte('fecha', firstDay)
      .lte('fecha', lastDay);
    
    if (error) {
      console.error('Error validando duplicados:', error);
      return false;
    }
    
    const uniqueDates = new Set(data?.map(d => d.fecha) || []);
    const hasDuplicates = uniqueDates.size !== (data?.length || 0);
    
    if (hasDuplicates) {
      console.warn(`⚠️ Duplicados detectados para creator ${creatorId} en ${month}`);
    }
    
    return !hasDuplicates; // true si NO hay duplicados
  }

  /**
   * Calcula hitos próximos para diamantes, días y horas usando utilidades compartidas
   */
  private calculateMilestones(
    currentDays: number,
    currentHours: number,
    currentDiamonds: number,
    remainingDays: number
  ): Milestones {
    const findNextMilestone = (current: number, targets: readonly number[]) => {
      const milestone = getNextMilestone(current, targets);
      const rate = currentDays > 0 ? current / currentDays : 0;
      const etaDays = estimateETA(current, milestone.target, rate);
      
      return {
        target: milestone.target,
        remaining: milestone.remaining,
        etaDays: Math.min(etaDays, remainingDays),
        achieved: milestone.achieved
      };
    };
    
    return {
      diamonds: findNextMilestone(sanitizeNumber(currentDiamonds), DIAMOND_MILESTONES),
      liveDays: findNextMilestone(sanitizeNumber(currentDays), DAY_MILESTONES),
      liveHours: findNextMilestone(sanitizeNumber(currentHours), HOUR_MILESTONES)
    };
  }
  
  /**
   * Calcula predicción de fin de mes usando ritmo lineal
   */
  private calculatePrediction(
    dailyStats: any[],
    totalDaysInMonth: number
  ): Prediction {
    if (dailyStats.length === 0) {
      return {
        diamonds_eom: 0,
        liveDays_eom: 0,
        liveHours_eom: 0,
        method: 'linear_rate',
        confidence: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Método: Ritmo lineal
    const daysElapsed = dailyStats.length;
    // ✅ CORRECCIÓN: usar Math.max() porque son valores acumulados del mes
    const totalDiamonds = dailyStats.length > 0
      ? Math.max(...dailyStats.map(d => d.diamantes || 0))
      : 0;
    const totalHours = dailyStats.length > 0
      ? Math.max(...dailyStats.map(d => d.duracion_live_horas || 0))
      : 0;
    const activeDays = dailyStats.filter(d => (d.diamantes || 0) > 0 || (d.duracion_live_horas || 0) >= 1.0).length;
    
    const diamondsRate = daysElapsed > 0 ? totalDiamonds / daysElapsed : 0;
    const hoursRate = daysElapsed > 0 ? totalHours / daysElapsed : 0;
    const daysRate = daysElapsed > 0 ? activeDays / daysElapsed : 0;
    
    const linearPrediction = {
      diamonds_eom: Math.round(diamondsRate * totalDaysInMonth),
      liveHours_eom: parseFloat((hoursRate * totalDaysInMonth).toFixed(1)),
      liveDays_eom: Math.round(daysRate * totalDaysInMonth)
    };
    
    // Calcular confianza basada en consistencia
    const consistency = activeDays / Math.max(1, daysElapsed);
    const confidence = Math.min(0.95, consistency);
    
    return {
      ...linearPrediction,
      method: 'linear_rate',
      confidence,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Obtiene flags de supervisión más recientes
   */
  private async getSupervisionFlags(creatorId: string): Promise<SupervisionFlags> {
    const { data, error } = await supabase
      .from('supervision_live_logs')
      .select('*')
      .eq('creator_id', creatorId)
      .order('fecha_evento', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      return {
        hasSupervision: false,
        lastSupervisor: null,
        lastReviewAt: null,
        notes: null,
        riskLevel: null
      };
    }
    
    return {
      hasSupervision: true,
      lastSupervisor: data.observer_name || 'Supervisor',
      lastReviewAt: data.fecha_evento,
      notes: data.notas || null,
      riskLevel: data.riesgo as any
    };
  }
  
  /**
   * Genera mensaje diario para WhatsApp según formato especificado
   */
  async generateDailyMessage(creatorId: string, creatorName: string, userName: string): Promise<string> {
    const metrics = await this.getMetrics(creatorId);
    
    // Si no hay datos, retornar mensaje básico
    if (metrics.liveDays_mtd === 0) {
      return `Hola ${creatorName}, te saluda ${userName} de SoulLatino. Aún no vemos actividad este mes. ¡Comienza tu primer live hoy!`;
    }
    
    const avgDiamondsPerDay = metrics.liveDays_mtd > 0 
      ? Math.round(metrics.diamonds_mtd / metrics.liveDays_mtd)
      : 0;
    
    const nextTarget = metrics.nextMilestones.diamonds;
    const requiredPerDay = metrics.remaining_calendar_days > 0
      ? Math.round(nextTarget.remaining / metrics.remaining_calendar_days)
      : 0;
    
    // Análisis contextual
    let analysis = '';
    
    // Regla 1: Cerca de hito (<15%)
    const progressToTarget = nextTarget.target > 0 
      ? (metrics.diamonds_mtd / nextTarget.target) * 100 
      : 0;
    
    if (progressToTarget >= 85 && !nextTarget.achieved) {
      analysis = `¡Estás MUY CERCA de alcanzar ${(nextTarget.target / 1000).toFixed(0)}K! Solo faltan ${(nextTarget.remaining / 1000).toFixed(0)}K diamantes. 🔥`;
    }
    // Regla 2: Cumple ≥22 días
    else if (metrics.liveDays_mtd >= 22) {
      const bonusData = calculateExtraDaysBonus(metrics.liveDays_mtd);
      analysis = `Por tu consistencia de ${metrics.liveDays_mtd} días, estás generando ${formatMetrics.currency(bonusData.bonusUSD)} extra este mes. ¡Sigue así!`;
    }
    // Regla 3: Superó graduación
    else if (nextTarget.achieved) {
      analysis = `🎉 ¡FELICIDADES! Lograste ${(nextTarget.target / 1000).toFixed(0)}K diamantes. Tu próxima meta es el siguiente nivel.`;
    }
    // Regla 7: Probabilidad baja
    else if (metrics.prediction.confidence < 0.3) {
      analysis = `Será complicado alcanzar la meta, pero cada live suma. Enfócate en mantener ${requiredPerDay.toLocaleString()} diamantes diarios.`;
    }
    // Regla 6: Probabilidad alta
    else if (metrics.prediction.confidence > 0.7) {
      analysis = `Vas muy bien encaminado para alcanzar tu meta de ${(nextTarget.target / 1000).toFixed(0)}K.`;
    }
    
    // Construir mensaje final
    const message = `Hola ${creatorName}, te saluda ${userName} de SoulLatino. Te envío esta recomendación con estadísticas al día de ayer:

Llevas ${metrics.liveDays_mtd} días en vivo y ${metrics.liveHours_mtd.toFixed(1)} horas acumuladas, con ${metrics.diamonds_mtd.toLocaleString()} diamantes generados (es decir, ${avgDiamondsPerDay.toLocaleString()} por día).

${analysis}

Hoy trata de:
- Hacer live ${Math.ceil(nextTarget.etaDays > 0 ? metrics.nextMilestones.liveHours.remaining / nextTarget.etaDays : 3)} horas
- Acumular ${(requiredPerDay / 1000).toFixed(0)}k diamantes

¡Vamos con todo! 💪`;
    
    return message;
  }
}

export const creatorMetricsService = new CreatorMetricsService();
