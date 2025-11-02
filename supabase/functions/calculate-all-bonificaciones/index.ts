// ============================================================================
// @deprecated Esta función está DEPRECADA desde 2025-11-02
// Usar: calculate-bonificaciones-predictivo (función canónica)
// Razón: Lectura de columnas obsoletas en creators, lógica duplicada
// Esta función ahora redirige a calculate-bonificaciones-predictivo
// ============================================================================

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

  console.warn('⚠️ DEPRECATION WARNING: calculate-all-bonificaciones está deprecada. Redirigiendo a calculate-bonificaciones-predictivo...');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // ========== REDIRECCIÓN A FUNCIÓN CANÓNICA ==========
    const mesActual = new Date().toISOString().slice(0, 7) + '-01';
    
    const { data: redirectData, error: redirectError } = await supabaseClient.functions.invoke(
      'calculate-bonificaciones-predictivo',
      {
        body: { mes_referencia: mesActual }
      }
    );

    if (redirectError) {
      console.error('Error en redirección a calculate-bonificaciones-predictivo:', redirectError);
      throw redirectError;
    }

    console.log('✅ Redirección exitosa a calculate-bonificaciones-predictivo');

    return new Response(
      JSON.stringify({
        ...redirectData,
        _deprecation_notice: 'Esta función está deprecada. Usa calculate-bonificaciones-predictivo directamente.',
        _redirect_timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error en calculate-all-bonificaciones:', error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
