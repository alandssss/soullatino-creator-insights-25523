import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validate } from "../_shared/validation.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const schema = z.object({
      mes_inicio: z.string().regex(/^\d{4}-\d{2}-01$/, "Formato de fecha inválido (YYYY-MM-01)").optional(),
      cantidad_creadores: z.number().int().min(1).max(100, "Máximo 100 creadores").optional(),
    });

    const result = await validate(req, schema);
    if (!result.ok) return result.response;

    const { mes_inicio, cantidad_creadores } = result.data;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mesInicio = mes_inicio || new Date().toISOString().slice(0, 7) + '-01';
    const cantidad = cantidad_creadores || 15;

    console.log(`Generando datos demo desde ${mesInicio} para ${cantidad} creadores`);

    // Llamar a la función de la base de datos
    const { data, error } = await supabase.rpc('seed_demo_live_data', {
      p_mes_inicio: mesInicio,
      p_cantidad_creadores: cantidad
    });

    if (error) {
      console.error('Error generando datos:', error);
      throw error;
    }

    console.log('Datos generados exitosamente:', data);

    return new Response(
      JSON.stringify({
        success: true,
        mes_inicio: mesInicio,
        cantidad_creadores: cantidad,
        resultado: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error en generate-demo-live-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
