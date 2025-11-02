import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function okEmpty(snapshotDate?: string) {
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
        con_deficit_horas: 0,
      },
      snapshot_date: snapshotDate || null,
      hint: "No hay datos para hoy o el RPC no devolvió resultados.",
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[get-recommendations-today] Starting...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) snapshot más reciente (usar maybeSingle)
    const { data: latestSnap, error: snapError } = await supabase
      .from("creator_daily_stats")
      .select("fecha")
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapError) {
      console.error("[get-recommendations-today] snapshot error:", snapError);
    }

    const snapshotDate = latestSnap?.fecha;

    if (!snapshotDate) {
      // no hay snapshot → devolvemos vacío pero sin romper
      return okEmpty();
    }

    // 2) ids del snapshot
    const { data: snapshotStats, error: snapListError } = await supabase
      .from("creator_daily_stats")
      .select("creator_id")
      .eq("fecha", snapshotDate);

    if (snapListError) {
      console.error("[get-recommendations-today] snapshot list error:", snapListError);
    }

    const snapshotIds = new Set((snapshotStats || []).map((s: any) => s.creator_id));

    // 3) llamar RPC (puede que no exista)
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_recommendations_today");

    if (rpcError) {
      console.error("[get-recommendations-today] RPC Error:", rpcError);
      // devolvemos vacío pero NO 500
      return okEmpty(snapshotDate);
    }

    const recommendations = (rpcData || []).sort(
      (a: any, b: any) => (b?.prioridad_riesgo || 0) - (a?.prioridad_riesgo || 0),
    );

    // 4) filtrar solo si hay snapshot real
    const filtered =
      snapshotIds.size === 0 ? recommendations : recommendations.filter((r: any) => snapshotIds.has(r.creator_id));

    // 5) resumen
    const summary = {
      total: filtered.length,
      riesgo_alto: filtered.filter((r: any) => (r.prioridad_riesgo || 0) >= 40).length,
      riesgo_medio: filtered.filter((r: any) => (r.prioridad_riesgo || 0) >= 20 && (r.prioridad_riesgo || 0) < 40)
        .length,
      riesgo_bajo: filtered.filter((r: any) => (r.prioridad_riesgo || 0) < 20).length,
      con_deficit_dias: filtered.filter((r: any) => (r.faltan_dias || 0) > 0).length,
      con_deficit_horas: filtered.filter((r: any) => (r.faltan_horas || 0) > 0).length,
    };

    console.log(
      `[get-recommendations-today] Snapshot: ${snapshotDate}, Filtered: ${filtered.length}/${recommendations.length}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: filtered,
        summary,
        snapshot_date: snapshotDate,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store, must-revalidate",
        },
      },
    );
  } catch (error: any) {
    console.error("[get-recommendations-today] Error:", error);

    // mismo comportamiento que tenías: no reventar el front
    return okEmpty();
  }
});
