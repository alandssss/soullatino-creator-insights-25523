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
     * Extract monthly bonificaciones metrics
     * @param mesReferencia - Month in YYYY-MM format (defaults to current month)
     * @returns Array of creator metrics
     */
    async extractDailyMetrics(mesReferencia?: string): Promise<SupabaseCreatorMetric[]> {
        const rawMonth = mesReferencia || this.getCurrentMonth();
        // Ensure we query with a full date (YYYY-MM-01) as the column is likely type 'date'
        const targetDate = `${rawMonth}-01`;

        console.log(`[SupabaseExtractor] Extracting bonificaciones for month: ${rawMonth} (query date: ${targetDate})`);

        try {
            const { data, error } = await this.client
                .from('creator_bonificaciones')
                .select(`
          *,
          creators!inner (
            creator_id,
            nombre,
            email,
            estado_graduacion,
            meta_dias_mes,
            meta_horas_mes
          )
        `)
                .eq('mes_referencia', targetDate)
                .order('creator_id');

            if (error) {
                console.error('[SupabaseExtractor] Query error:', error);
                throw new Error(`Failed to extract data: ${error.message}`);
            }

            if (!data || data.length === 0) {
                console.warn(`[SupabaseExtractor] No data found for month: ${rawMonth}`);
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
                    fecha: targetDate, // Use the calculated date
                    diamonds_dia: Number(record.diamantes_mtd) || 0,
                    live_hours_dia: Number(record.horas_mtd) || 0,
                    new_followers_dia: 0, // Not available in bonificaciones
                    hizo_live: Number(record.dias_mtd) > 0 ? 1 : 0,
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
