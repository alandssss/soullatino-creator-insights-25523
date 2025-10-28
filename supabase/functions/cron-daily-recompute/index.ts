import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[cron-daily-recompute] Starting daily recompute...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // @compat: Recalcular bonificaciones del mes actual usando función canónica
    const today = new Date();
    const mesReferencia = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    console.log('[cron-daily-recompute] Calculating bonificaciones for:', mesReferencia);
    const { data: bonifData, error: bonifError } = await supabase.functions.invoke('calculate-bonificaciones-predictivo', {
      body: { mes_referencia: mesReferencia }
    });

    if (bonifError) {
      console.error('[cron-daily-recompute] Bonificaciones calc error:', bonifError);
      throw new Error(bonifError.message || JSON.stringify(bonifError));
    }

    // Extraer data de la respuesta de la edge function
    const responseData = bonifData as { success: boolean; bonificaciones?: any[] };
    if (!responseData.success) {
      throw new Error('Bonificaciones calculation returned success=false');
    }

    const bonificaciones = responseData.bonificaciones || [];

    const summary = {
      total: bonificaciones.length,
      prioridad_300k: bonificaciones.filter((b: any) => b.es_prioridad_300k).length,
      dias_restantes_promedio: bonificaciones.length > 0 
        ? Math.round(bonificaciones.reduce((sum: number, b: any) => sum + (b.dias_restantes || 0), 0) / bonificaciones.length)
        : 0,
    };

    console.log('[cron-daily-recompute] Completed successfully:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[cron-daily-recompute] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
