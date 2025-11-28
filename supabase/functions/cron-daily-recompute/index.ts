import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[CRON] === Daily Recompute Started ===');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // Note: Supabase reserves SUPABASE_ prefix, so we use SERVICE_ROLE_KEY instead
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Calcular mes actual (YYYY-MM)
    // Usamos America/Chihuahua para consistencia con el resto del sistema
    const now = new Date();
    const currentMonth = now.toLocaleDateString('en-CA', { timeZone: 'America/Chihuahua' }).substring(0, 7);

    console.log('[CRON] Processing month:', currentMonth);

    // 2. Recalcular bonificaciones
    console.log('[CRON] Step 1: Calculating bonificaciones...');
    const { data: bonifData, error: bonifError } = await supabase.functions.invoke(
      'calculate-bonificaciones-predictivo',
      { body: { mes_referencia: currentMonth } }
    );

    if (bonifError) {
      console.error('[CRON] ❌ Error calculating bonificaciones:', bonifError);
      throw new Error(`Failed to calculate bonificaciones: ${bonifError.message || JSON.stringify(bonifError)}`);
    }
    console.log('[CRON] ✅ Bonificaciones calculated:', bonifData?.total_creadores || 0, 'creators processed');

    // 3. Sincronizar a Airtable
    console.log('[CRON] Step 2: Syncing to Airtable...');
    const { data: syncData, error: syncError } = await supabase.functions.invoke(
      'sync-to-airtable',
      { body: { month: currentMonth } }
    );

    if (syncError) {
      console.error('[CRON] ❌ Error syncing to Airtable:', syncError);
      throw new Error(`Failed to sync to Airtable: ${syncError.message || JSON.stringify(syncError)}`);
    }
    console.log('[CRON] ✅ Airtable sync completed:', syncData);

    // 4. Registrar resultado
    const result = {
      success: true,
      date: new Date().toISOString(),
      month: currentMonth,
      creatorsProcessed: bonifData?.total_creadores || 0,
      airtableRecords: syncData?.totalRecords || 0,
      syncResult: syncData
    };

    console.log('[CRON] === Daily Recompute Completed Successfully ===', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[CRON] ❌ CRITICAL FAILURE:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
