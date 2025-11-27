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
     * Extract daily metrics for a specific date
     * @param date - Date in YYYY-MM-DD format (defaults to yesterday)
     * @returns Array of creator metrics
     */
    async extractDailyMetrics(date?: string): Promise<SupabaseCreatorMetric[]> {
        const targetDate = date || this.getYesterdayDate();

        console.log(`[SupabaseExtractor] Extracting metrics for date: ${targetDate}`);

        try {
            const { data, error } = await this.client
                .from('creator_daily_stats')
                .select(`
          fecha,
          diamantes,
          duracion_live_horas,
          nuevos_seguidores,
          emisiones_live,
          creator_id,
          creators!inner (
            creator_id,
            nombre,
            email,
            estado_graduacion,
            meta_dias_mes,
            meta_horas_mes
          )
        `)
                .eq('fecha', targetDate)
                .order('creator_id');

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

                return {
                    creator_id: creator.creator_id,
                    username: creator.nombre || 'Unknown',
                    email: creator.email || null,
                    nivel_actual: creator.estado_graduacion || null,
                    meta_dias_mes: creator.meta_dias_mes || 22,
                    meta_horas_mes: creator.meta_horas_mes || 80,
                    fecha: record.fecha,
                    diamonds_dia: Number(record.diamantes) || 0,
                    live_hours_dia: Number(record.duracion_live_horas) || 0,
                    new_followers_dia: Number(record.nuevos_seguidores) || 0,
                    hizo_live: (record.emisiones_live || 0) > 0 ? 1 : 0,
                };
            });

            console.log(`[SupabaseExtractor] Transformed ${metrics.length} records successfully`);
            return metrics;

        } catch (error) {
            console.error('[SupabaseExtractor] Extraction failed:', error);
            throw error;
        }
    }

    /**
     * Get yesterday's date in YYYY-MM-DD format
     */
    private getYesterdayDate(): string {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    /**
     * Validate that data exists for a given date
     */
    async validateDataExists(date: string): Promise<boolean> {
        try {
            const { count, error } = await this.client
                .from('creator_daily_stats')
                .select('*', { count: 'exact', head: true })
                .eq('fecha', date);

            if (error) {
                console.error('[SupabaseExtractor] Validation error:', error);
                return false;
            }

            console.log(`[SupabaseExtractor] Found ${count} records for ${date}`);
            return (count || 0) > 0;
        } catch (error) {
            console.error('[SupabaseExtractor] Validation failed:', error);
            return false;
        }
    }
}
