import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyStats {
    dias_live: number;
    horas_live: number;
    diamantes: number;
    mes_referencia: string;
    loading: boolean;
    error: string | null;
    proximo_objetivo_valor: string;
    faltante: number;
    req_diam_por_dia: number;
    req_horas_por_dia: number;
}

export const useCreatorMonthlyStats = (creatorId: string | null) => {
    const [stats, setStats] = useState<MonthlyStats>({
        dias_live: 0,
        horas_live: 0,
        diamantes: 0,
        mes_referencia: '',
        loading: false,
        error: null,
        proximo_objetivo_valor: '',
        faltante: 0,
        req_diam_por_dia: 0,
        req_horas_por_dia: 0
    });

    useEffect(() => {
        if (!creatorId) return;

        const loadStats = async () => {
            setStats(prev => ({ ...prev, loading: true, error: null }));
            try {
                const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

                // Intentar leer de creator_bonificaciones primero (datos ya calculados)
                const { data: bonusData, error: bonusError } = await supabase
                    .from('creator_bonificaciones')
                    .select('*')
                    .eq('creator_id', creatorId)
                    .eq('mes_referencia', currentMonth)
                    .maybeSingle();

                if (bonusData) {
                    setStats({
                        dias_live: bonusData.dias_live_mes || 0,
                        horas_live: bonusData.horas_live_mes || 0,
                        diamantes: bonusData.diam_live_mes || 0,
                        mes_referencia: currentMonth,
                        loading: false,
                        error: null,
                        proximo_objetivo_valor: bonusData.proximo_objetivo_valor || '',
                        faltante: 0, // Se podría calcular si viniera en la tabla
                        req_diam_por_dia: bonusData.req_diam_por_dia || 0,
                        req_horas_por_dia: bonusData.req_horas_por_dia || 0
                    });
                    return;
                }

                // Si no hay bonificaciones calculadas, leer de daily_stats (fallback)
                // Nota: Esto es una aproximación, idealmente siempre debería haber bonificaciones
                const { data: dailyData, error: dailyError } = await supabase
                    .from('creator_daily_stats')
                    .select('diamantes, duracion_live_horas, dias_validos_live')
                    .eq('creator_id', creatorId)
                    .gte('fecha', currentMonth);

                if (dailyError) throw dailyError;

                // Calcular agregados (esto asume que daily_stats tiene deltas, pero si tiene MTD acumulado
                // deberíamos tomar el MAX. Como el upload ya maneja MTD, aquí tomamos el MAX del mes)

                // Lógica MAX para MTD
                const maxDiamantes = dailyData?.reduce((max, curr) => Math.max(max, curr.diamantes || 0), 0) || 0;
                const maxHoras = dailyData?.reduce((max, curr) => Math.max(max, curr.duracion_live_horas || 0), 0) || 0;
                // Días es count distinct o suma de flags
                const diasLive = dailyData?.filter(d => d.dias_validos_live > 0).length || 0;

                setStats({
                    dias_live: diasLive,
                    horas_live: maxHoras,
                    diamantes: maxDiamantes,
                    mes_referencia: currentMonth,
                    loading: false,
                    error: null,
                    proximo_objetivo_valor: 'Calculando...',
                    faltante: 0,
                    req_diam_por_dia: 0,
                    req_horas_por_dia: 0
                });

            } catch (err: any) {
                console.error('Error loading monthly stats:', err);
                setStats(prev => ({ ...prev, loading: false, error: err.message }));
            }
        };

        loadStats();
    }, [creatorId]);

    return stats;
};
