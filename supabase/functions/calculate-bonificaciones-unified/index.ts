// Función unificada de cálculo de bonificaciones
// Reemplaza: calculate-bonificaciones, calculate-all-bonificaciones, calculate-bonificaciones-predictivo
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validation.ts";
import { withCORS, handleCORSPreflight } from "../_shared/cors.ts";

const RequestSchema = z.object({
  creator_id: z.string().uuid().nullable().optional(),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mode: z.enum(["single", "batch", "predictive"]).default("batch"),
});

serve(async (req) => {
  const origin = req.headers.get("origin");

  // CORS preflight
  if (req.method === "OPTIONS") {
    return handleCORSPreflight(origin);
  }

  // Rate limiting: 100 req/min/IP
  const rl = await rateLimit(req, { key: "calc-bonif", limitPerMin: 100 });
  if (!rl.ok && rl.response) {
    return withCORS(rl.response, origin);
  }

  // Validación de entrada
  const validation = await validate(req, RequestSchema);
  if (!validation.ok && validation.response) {
    return withCORS(validation.response, origin);
  }

  const { creator_id, mes_referencia, mode } = validation.data!;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Calculando bonificaciones:", { creator_id, mes_referencia, mode });

    // Llamar a función SQL nativa (cuando esté deployada)
    const { data, error } = await supabase.rpc("fn_calcular_bonificaciones_mes_v2", {
      p_creator_id: creator_id ?? null,
      p_mes_referencia: mes_referencia ?? null,
      p_mode: mode,
    });

    if (error) {
      console.error("Error en fn_calcular_bonificaciones_mes_v2:", error);
      return withCORS(
        new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        ),
        origin
      );
    }

    return withCORS(
      new Response(
        JSON.stringify({
          success: true,
          mode,
          total_creadores: Array.isArray(data) ? data.length : 0,
          bonificaciones: data,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
      origin
    );
  } catch (error) {
    console.error("Error inesperado:", error);
    return withCORS(
      new Response(
        JSON.stringify({ success: false, error: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
      origin
    );
  }
});
