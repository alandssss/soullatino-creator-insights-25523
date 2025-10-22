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

    // Obtener recomendaciones de la vista materializada
    const { data: recommendations, error } = await supabase
      .from('recommendations_today')
      .select('*')
      .order('prioridad_riesgo', { ascending: false });

    if (error) {
      console.error('[get-recommendations-today] Error:', error);
      throw error;
    }

    // Calcular resumen
    const summary = {
      total: recommendations?.length || 0,
      riesgo_alto: recommendations?.filter(r => r.prioridad_riesgo >= 40).length || 0,
      riesgo_medio: recommendations?.filter(r => r.prioridad_riesgo >= 20 && r.prioridad_riesgo < 40).length || 0,
      riesgo_bajo: recommendations?.filter(r => r.prioridad_riesgo < 20).length || 0,
      con_deficit_dias: recommendations?.filter(r => r.faltan_dias > 0).length || 0,
      con_deficit_horas: recommendations?.filter(r => r.faltan_horas > 0).length || 0,
    };

    console.log('[get-recommendations-today] Returning', recommendations?.length, 'recommendations');

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: recommendations || [],
        summary
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
