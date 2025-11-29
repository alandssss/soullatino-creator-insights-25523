import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { SupabaseCreatorMetric } from '../types.ts';

/**
 * Supabase Data Extractor
 * Extracts daily creator metrics from Supabase database
 */
export class SupabaseDataExtractor {
    private client: SupabaseClient;

    constructor(supabaseUrl: string, serviceRoleKey: string) {
        this.client = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    /**
     * Extract daily metrics from creator_daily_stats
     * @param dateOrMonth - Specific date (YYYY-MM-DD) or Month (YYYY-MM). Defaults to yesterday.
     * @returns Array of creator metrics
     */
    async extractDailyMetrics(dateOrMonth?: string): Promise<SupabaseCreatorMetric[]> {
        let targetDate = dateOrMonth;

        // If no date provided, or only month provided, default to yesterday
        // (Daily stats are usually run for the previous day)
        if (!targetDate || targetDate.length === 7) {
            const d = new Date();
            d.setDate(d.getDate() - 1); // Yesterday
            targetDate = d.toISOString().split('T')[0];

            if (dateOrMonth && dateOrMonth.length === 7) {
                console.log(`[SupabaseExtractor] Month provided (${dateOrMonth}), defaulting to yesterday: ${targetDate}`);
            }
        }

        console.log(`[SupabaseExtractor] Extracting daily stats for date: ${targetDate}`);

        try {
            const { data, error } = await this.client
                .from('creator_daily_stats')
                .select(`
                    *,
                    creators (
                        creator_id,
                        tiktok_username,
                        email,
                        estado_graduacion,
                        meta_dias_mes,
                        meta_horas_mes
                    )
                `)
                .eq('fecha', targetDate);

            if (error) {
                console.error('[SupabaseExtractor] Query error:', error);
                throw new Error(`Failed to extract data: ${error.message}`);
            }

            if (!data || data.length === 0) {
                console.warn(`[SupabaseExtractor] No data found for date: ${targetDate}`);
                return [];
            }

            console.log(`[SupabaseExtractor] Found ${data.length} records`);

            // Transform to expected format
            const metrics: SupabaseCreatorMetric[] = data.map((record: any) => {
                const creator = Array.isArray(record.creators)
                    ? record.creators[0]
                    : record.creators;

                if (!creator) {
                    console.warn(`[SupabaseExtractor] Warning: No creator details for record ${record.id}`);
                    return null;
                }

                return {
                    creator_id: creator.creator_id,
                    username: creator.tiktok_username || 'Unknown',
                    email: creator.email || null,
                    nivel_actual: creator.estado_graduacion || null,
                    meta_dias_mes: creator.meta_dias_mes || 22,
                    meta_horas_mes: creator.meta_horas_mes || 80,
                    fecha: record.fecha,
                    diamonds_dia: Number(record.diamantes) || 0,
                    live_hours_dia: Number(record.duracion_live_horas) || 0,
                    new_followers_dia: Number(record.nuevos_seguidores) || 0,
                    hizo_live: Number(record.emisiones_live) > 0 ? 1 : 0,
                };
            }).filter((m): m is SupabaseCreatorMetric => m !== null);

            console.log(`[SupabaseExtractor] Transformed ${metrics.length} records successfully`);
            return metrics;

        } catch (error) {
            console.error('[SupabaseExtractor] Extraction failed:', error);
            throw error;
        }
    }

    /**
     * Get current month in YYYY-MM format
     */
    private getCurrentMonth(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Validate that data exists for a given month
     */
    async validateDataExists(mesReferencia: string): Promise<boolean> {
        const targetDate = `${mesReferencia}-01`;
        try {
            const { count, error } = await this.client
                .from('creator_bonificaciones')
                .select('*', { count: 'exact', head: true })
                .eq('mes_referencia', targetDate);

            if (error) {
                console.error('[SupabaseExtractor] Validation error:', error);
                return false;
            }

            console.log(`[SupabaseExtractor] Found ${count} records for ${mesReferencia}`);
            return (count || 0) > 0;
        } catch (error) {
            console.error('[SupabaseExtractor] Validation failed:', error);
            return false;
        }
    }
}
