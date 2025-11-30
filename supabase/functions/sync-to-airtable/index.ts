import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SupabaseDataExtractor } from './services/supabaseExtractor.ts';
import { AirtableClient } from './services/airtableClient.ts';
import { SyncResult, SyncError } from './types.ts';

/**
 * Supabase Edge Function: Daily Sync to Airtable
 * 
 * Purpose: Extract daily creator metrics from Supabase and sync to Airtable
 * Schedule: Daily at 6:00 AM via pg_cron
 * 
 * Flow:
 * 1. Extract yesterday's metrics from Supabase
 * 2. For each creator:
 *    - Ensure creator exists in Airtable
 *    - Upsert daily metric record
 * 3. Return sync summary
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();

    console.log('='.repeat(60));
    console.log('🚀 Starting Supabase → Airtable Daily Sync');
    console.log('='.repeat(60));

    try {
        // ============================================
        // 1. VALIDATE ENVIRONMENT VARIABLES
        // ============================================
        const config = validateEnvironment();
        console.log('✅ Environment validated');

        // ============================================
        // 2. PARSE REQUEST (optional date override)
        // ============================================
        let targetDate: string | undefined;

        if (req.method === 'POST') {
            try {
                const body = await req.json();
                // Accept 'date', 'fecha' (YYYY-MM-DD) or 'month' (YYYY-MM)
                targetDate = body.date || body.fecha || body.month || body.mes_referencia;
                if (targetDate) {
                    console.log(`📅 Manual sync requested for: ${targetDate}`);
                }
            } catch {
                // No body or invalid JSON, use default
            }
        }

        // ============================================
        // 3. EXTRACT DATA FROM SUPABASE
        // ============================================
        console.log('\n📊 Extracting bonificaciones from Supabase...');
        const extractor = new SupabaseDataExtractor(
            config.supabaseUrl,
            config.supabaseServiceKey
        );

        const metrics = await extractor.extractDailyMetrics(targetDate);

        if (metrics.length === 0) {
            console.warn('⚠️  No bonificaciones found for the specified month');
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No data to sync',
                    month: targetDate || 'yesterday',
                    totalRecords: 0,
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`✅ Extracted ${metrics.length} records`);

        // ============================================
        // 4. SYNC TO AIRTABLE
        // ============================================
        console.log('\n📤 Syncing to Airtable...');
        const airtable = new AirtableClient(
            config.airtableApiKey,
            config.airtableBaseId,
            config.airtableCreatorsTableId,
            config.airtableMetricsTableId,
            3, // max retries
            1000 // base delay ms
        );

        const result: SyncResult = {
            success: true,
            date: metrics[0]?.fecha || targetDate || 'unknown',
            totalRecords: metrics.length,
            creatorsProcessed: 0,
            creatorsCreated: 0,
            creatorsUpdated: 0,
            metricsCreated: 0,
            metricsUpdated: 0,
            errors: [],
            duration: 0,
            timestamp: new Date().toISOString(),
        };

        // Process each creator metric
        for (const metric of metrics) {
            try {
                console.log(`\n🔄 Processing: ${metric.username} (${metric.creator_id})`);

                // Ensure creator exists
                const creatorRecordId = await airtable.ensureCreatorExists({
                    creator_id: metric.creator_id,
                    username: metric.username,
                    email: metric.email,
                    nivel_actual: metric.nivel_actual,
                    meta_dias_mes: metric.meta_dias_mes,
                    meta_horas_mes: metric.meta_horas_mes,
                });

                result.creatorsProcessed++;

                // Upsert daily metric
                await airtable.upsertDailyMetric(creatorRecordId, {
                    fecha: metric.fecha,
                    diamantes: metric.diamantes,
                    duracion_live_horas: metric.duracion_live_horas,
                    nuevos_seguidores: metric.nuevos_seguidores,
                    dias_validos_live: metric.dias_validos_live,
                });

                result.metricsCreated++; // Note: We don't distinguish create vs update in result
                console.log(`✅ Synced: ${metric.username}`);

            } catch (error) {
                console.error(`❌ Error processing ${metric.creator_id}:`, error);

                const syncError: SyncError = {
                    creator_id: metric.creator_id,
                    operation: 'metric_upsert',
                    error: error instanceof Error ? error.message : String(error),
                    retryCount: 0,
                };

                result.errors.push(syncError);
                result.success = false;
            }
        }

        // ============================================
        // 5. CALCULATE RESULTS & RETURN
        // ============================================
        result.duration = Date.now() - startTime;

        console.log('\n' + '='.repeat(60));
        console.log('📊 SYNC SUMMARY');
        console.log('='.repeat(60));
        console.log(`Date: ${result.date}`);
        console.log(`Total Records: ${result.totalRecords}`);
        console.log(`Creators Processed: ${result.creatorsProcessed}`);
        console.log(`Metrics Synced: ${result.metricsCreated}`);
        console.log(`Errors: ${result.errors.length}`);
        console.log(`Duration: ${result.duration}ms`);
        console.log(`Status: ${result.success ? '✅ SUCCESS' : '⚠️  PARTIAL FAILURE'}`);
        console.log('='.repeat(60));

        // ============================================
        // 6. SEND ALERT IF ERRORS DETECTED
        // ============================================
        if (result.errors.length > 0) {
            await sendErrorAlert(result, config);
        }

        return new Response(
            JSON.stringify(result, null, 2),
            {
                status: result.success ? 200 : 207, // 207 = Multi-Status (partial success)
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);

        const errorResult = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
        };

        return new Response(
            JSON.stringify(errorResult, null, 2),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});

/**
 * Validate required environment variables
 */
function validateEnvironment() {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'AIRTABLE_API_KEY',
        'AIRTABLE_BASE_ID',
        'AIRTABLE_CREATORS_TABLE_ID',
        'AIRTABLE_DAILY_METRICS_TABLE_ID',
    ];

    const missing = required.filter((key) => !Deno.env.get(key));

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return {
        supabaseUrl: Deno.env.get('SUPABASE_URL')!,
        supabaseServiceKey: Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        airtableApiKey: Deno.env.get('AIRTABLE_API_KEY')!,
        airtableBaseId: Deno.env.get('AIRTABLE_BASE_ID')!,
        airtableCreatorsTableId: Deno.env.get('AIRTABLE_CREATORS_TABLE_ID')!,
        airtableMetricsTableId: Deno.env.get('AIRTABLE_DAILY_METRICS_TABLE_ID')!,
        alertEmail: Deno.env.get('ALERT_EMAIL'),
    };
}

/**
 * Send error alert (placeholder for future email integration)
 */
async function sendErrorAlert(result: SyncResult, config: any) {
    console.log('\n⚠️  ALERT: Errors detected during sync');
    console.log(`Total errors: ${result.errors.length}`);
    console.log(`Error rate: ${((result.errors.length / result.totalRecords) * 100).toFixed(2)}%`);

    // TODO: Implement email notification
    // This is a placeholder hook for future SMTP/email service integration
    // Example: await sendEmail(config.alertEmail, 'Sync Failed', formatErrorReport(result));

    if (config.alertEmail) {
        console.log(`📧 Alert would be sent to: ${config.alertEmail}`);
    } else {
        console.log('📧 No alert email configured (set ALERT_EMAIL env var)');
    }

    // Log detailed errors
    result.errors.forEach((error, index) => {
        console.log(`\nError ${index + 1}:`);
        console.log(`  Creator: ${error.creator_id}`);
        console.log(`  Operation: ${error.operation}`);
        console.log(`  Message: ${error.error}`);
    });
}
