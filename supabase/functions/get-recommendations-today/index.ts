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
    console.log('[get-recommendations-today] Starting...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // @snapshot: Get latest snapshot date
    const { data: latestSnap } = await supabase
      .from('creator_daily_stats')
      .select('fecha')
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    const snapshotDate = latestSnap?.fecha;

    if (!snapshotDate) {
      return new Response(
        JSON.stringify({ 
          success: true,
          recommendations: [],
          summary: { total: 0, riesgo_alto: 0, riesgo_medio: 0, riesgo_bajo: 0, con_deficit_dias: 0, con_deficit_horas: 0 },
          hint: 'No hay snapshot diario. Sube un archivo Excel.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get snapshot creator IDs
    const { data: snapshotStats } = await supabase
      .from('creator_daily_stats')
      .select('creator_id')
      .eq('fecha', snapshotDate);

    const snapshotIds = new Set((snapshotStats || []).map(s => s.creator_id));

    // Obtener recomendaciones mediante RPC segura (evita acceso directo a la MV)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_recommendations_today');

    if (rpcError) {
      console.error('[get-recommendations-today] RPC Error:', rpcError);
      throw rpcError;
    }

    // Ordenar por prioridad en código para mantener comportamiento actual
    const recommendations = (rpcData || []).sort(
      (a: any, b: any) => (b?.prioridad_riesgo || 0) - (a?.prioridad_riesgo || 0)
    );

    // @snapshot: Filter to only snapshot creators
    const filtered = (recommendations || []).filter(r => snapshotIds.has(r.creator_id));

    // Calcular resumen
    const summary = {
      total: filtered.length,
      riesgo_alto: filtered.filter(r => r.prioridad_riesgo >= 40).length,
      riesgo_medio: filtered.filter(r => r.prioridad_riesgo >= 20 && r.prioridad_riesgo < 40).length,
      riesgo_bajo: filtered.filter(r => r.prioridad_riesgo < 20).length,
      con_deficit_dias: filtered.filter(r => r.faltan_dias > 0).length,
      con_deficit_horas: filtered.filter(r => r.faltan_horas > 0).length,
    };

    console.log(`[get-recommendations-today] Snapshot: ${snapshotDate}, Filtered: ${filtered.length}/${recommendations.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: filtered,
        summary,
        snapshot_date: snapshotDate
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate'
        },
      }
    );

  } catch (error: any) {
    console.error('[get-recommendations-today] Error:', error);
    
    // Devolver respuesta con error pero no fallar completamente
    return new Response(
      JSON.stringify({ 
        success: true,
        recommendations: [],
        summary: {
          total: 0,
          riesgo_alto: 0,
          riesgo_medio: 0,
          riesgo_bajo: 0,
          con_deficit_dias: 0,
          con_deficit_horas: 0
        },
        error: error.message,
        hint: 'La vista materializada puede estar vacía. Sube un archivo Excel para generar datos.'
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate'
        },
      }
    );
  }
});
