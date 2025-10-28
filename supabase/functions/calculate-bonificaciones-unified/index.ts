// Función unificada de cálculo de bonificaciones
// Reemplaza: calculate-bonificaciones, calculate-all-bonificaciones, calculate-bonificaciones-predictivo
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
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

    console.log("Calculando bonificaciones (redirected):", { creator_id, mes_referencia, mode });

    // @compat: redirigir a edge function canónica
    const { data: invokeData, error: invokeError } = await supabase.functions.invoke("calculate-bonificaciones-predictivo", {
      body: { mes_referencia: mes_referencia ?? null }
    });

    if (invokeError || !invokeData?.success) {
      console.error("Error en calculate-bonificaciones-predictivo:", invokeError || invokeData);
      return withCORS(
        new Response(
          JSON.stringify({ success: false, error: invokeError?.message || "Calculation failed" }),
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
          total_creadores: invokeData.total_creadores || 0,
          bonificaciones: invokeData.bonificaciones,
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
