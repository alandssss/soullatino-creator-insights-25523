import { supabase } from '@/integrations/supabase/client';
import type { CreatorDailyStat } from '@/types/dashboard';

/**
 * Obtiene métricas mensuales globales.
 */
export async function getMonthlyMetrics(month: string) {
    // month format: 'YYYY-MM'
    const { data, error } = await supabase
        .from('creator_daily_stats')
        .select('*')
        .gte('fecha', `${month}-01`)
        .lte('fecha', `${month}-31`);
    if (error) throw error;
    return data as CreatorDailyStat[];
}

/**
 * Historial diario de un creador.
 */
export async function getCreatorDailyHistory(creatorId: string) {
    const { data, error } = await supabase
        .from('creator_daily_stats')
        .select('*')
        .eq('creator_id', creatorId)
        .order('fecha', { ascending: true });
    if (error) throw error;
    return data as CreatorDailyStat[];
}

/**
 * Resumen mensual por creador.
 */
export async function getCreatorMonthlyRollup(creatorId: string, month: string) {
    const daily = await getCreatorDailyHistory(creatorId);
    const filtered = daily.filter(d => d.fecha.startsWith(month));
    // Use Math.max to get latest accumulated value (MTD snapshot)
    const diamonds = Math.max(...filtered.map(d => Number(d.diamantes)), 0);
    const hours = Math.max(...filtered.map(d => Number(d.duracion_live_horas)), 0);
    const liveDays = Math.max(...filtered.map(d => Number(d.dias_validos_live)), 0);
    return { diamonds, hours, liveDays };
}

/**
 * KPIs por segmento.
 */
export async function getSegmentsKPIs(month: string) {
    const creators = await supabase.from('creators').select('*');
    if (creators.error) throw creators.error;
    const stats = await getMonthlyMetrics(month);
    // Agrupar por segmento basado en nivel_actual
    const segmentMap: Record<string, any[]> = { incubadora: [], profesionalizacion: [], elite: [] };
    creators.data?.forEach((c: any) => {
        const nivel = Number(c.nivel_actual.replace('G', ''));
        const segment = nivel <= 6 ? 'incubadora' : nivel <= 8 ? 'profesionalizacion' : 'elite';
        segmentMap[segment].push(c);
    });
    // Calcular KPIs por segmento
    const result: Record<string, any> = {};
    for (const [seg, list] of Object.entries(segmentMap)) {
        const ids = list.map((c: any) => c.creator_id);
        const segStats = stats.filter((s: any) => ids.includes(s.creator_id));
        // Use Math.max per creator to get MTD snapshot
        const creatorsInSeg = new Set(segStats.map(s => s.creator_id));
        const totalDiamonds = Array.from(creatorsInSeg).reduce((sum, cid) => {
            const creatorStats = segStats.filter(s => s.creator_id === cid);
            return sum + Math.max(...creatorStats.map(s => Number(s.diamantes)), 0);
        }, 0);
        const totalHours = Array.from(creatorsInSeg).reduce((sum, cid) => {
            const creatorStats = segStats.filter(s => s.creator_id === cid);
            return sum + Math.max(...creatorStats.map(s => Number(s.duracion_live_horas)), 0);
        }, 0);
        const avgLiveDays = Array.from(creatorsInSeg).reduce((sum, cid) => {
            const creatorStats = segStats.filter(s => s.creator_id === cid);
            return sum + Math.max(...creatorStats.map(s => Number(s.dias_validos_live)), 0);
        }, 0) / (list.length || 1);
        result[seg] = { totalCreators: list.length, totalDiamonds, totalHours, avgLiveDays };
    }
    return result;
}

/**
 * KPIs de hitos (acumulado de diamonds por rango).
 */
export async function getHitosKPIs(month: string) {
    const stats = await getMonthlyMetrics(month);
    const sumByCreator: Record<string, number> = {};
    // Get max MTD value per creator
    stats.forEach(s => {
        const current = sumByCreator[s.creator_id] || 0;
        sumByCreator[s.creator_id] = Math.max(current, Number(s.diamantes));
    });
    const ranges = [100000, 150000, 200000, 250000, 300000, 400000, 500000];
    const result: Record<string, number> = {};
    ranges.forEach(r => (result[r] = 0));
    Object.values(sumByCreator).forEach(total => {
        for (const r of ranges) {
            if (total >= r) result[r]++;
        }
    });
    return result;
}
