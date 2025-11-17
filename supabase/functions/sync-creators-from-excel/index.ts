// Edge Function: Sincronizar Creadores desde Excel
// Actualiza usernames y datos de creadores existentes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withCORS, handleCORSPreflight } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  // CORS preflight
  if (req.method === "OPTIONS") {
    return handleCORSPreflight(origin);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { excelData } = await req.json();

    if (!Array.isArray(excelData) || excelData.length === 0) {
      return withCORS(
        new Response(
          JSON.stringify({ 
            success: false, 
            error: "excelData debe ser un array no vacío" 
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        ),
        origin
      );
    }

    console.log(`[sync-creators] Procesando ${excelData.length} filas del Excel...`);

    let creators_actualizados = 0;
    let creators_sin_cambios = 0;
    let creators_creados = 0;
    let errores = 0;

    for (const row of excelData) {
      try {
        const creatorId = row.creator_id?.toString().trim();
        const tiktokUsername = row.tiktok_username?.toString().trim();
        const manager = row.manager?.toString().trim();
        const diasEnAgencia = parseInt(row.dias_en_agencia) || 0;

        if (!creatorId) {
          console.warn("[sync-creators] Fila sin creator_id, saltando...");
          continue;
        }

        // Buscar creator por creator_id
        const { data: existingCreator, error: findError } = await supabase
          .from('creators')
          .select('id, creator_id, tiktok_username, nombre, manager, dias_en_agencia')
          .eq('creator_id', creatorId)
          .maybeSingle();

        if (findError) {
          console.error(`[sync-creators] Error buscando creator ${creatorId}:`, findError);
          errores++;
          continue;
        }

        // Si NO existe, crear nuevo
        if (!existingCreator) {
          const { error: insertError } = await supabase
            .from('creators')
            .insert({
              creator_id: creatorId,
              tiktok_username: tiktokUsername || creatorId,
              nombre: tiktokUsername || `Creator ${creatorId}`,
              manager: manager || null,
              dias_en_agencia: diasEnAgencia,
              status: 'activo',
            });

          if (insertError) {
            console.error(`[sync-creators] Error insertando creator ${creatorId}:`, insertError);
            errores++;
          } else {
            console.log(`[sync-creators] ✅ Creado: ${tiktokUsername || creatorId}`);
            creators_creados++;
          }
          continue;
        }

        // Si existe y tiene username numérico, actualizar
        const isNumericUsername = /^\d{15,}$/.test(existingCreator.tiktok_username || '');
        
        if (isNumericUsername && tiktokUsername && tiktokUsername !== existingCreator.tiktok_username) {
          const { error: updateError } = await supabase
            .from('creators')
            .update({
              tiktok_username: tiktokUsername,
              nombre: tiktokUsername,
              manager: manager || existingCreator.manager,
              dias_en_agencia: diasEnAgencia || existingCreator.dias_en_agencia,
            })
            .eq('id', existingCreator.id);

          if (updateError) {
            console.error(`[sync-creators] Error actualizando creator ${creatorId}:`, updateError);
            errores++;
          } else {
            console.log(`[sync-creators] 🔄 Actualizado: ${existingCreator.tiktok_username} → ${tiktokUsername}`);
            creators_actualizados++;
          }
        } else {
          // Ya tiene username correcto
          creators_sin_cambios++;
        }

      } catch (rowError) {
        console.error("[sync-creators] Error procesando fila:", rowError);
        errores++;
      }
    }

    console.log(`[sync-creators] ✅ Resumen:`);
    console.log(`  - Creados: ${creators_creados}`);
    console.log(`  - Actualizados: ${creators_actualizados}`);
    console.log(`  - Sin cambios: ${creators_sin_cambios}`);
    console.log(`  - Errores: ${errores}`);

    return withCORS(
      new Response(
        JSON.stringify({
          success: true,
          stats: {
            creators_creados,
            creators_actualizados,
            creators_sin_cambios,
            errores,
            total_procesado: excelData.length,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      ),
      origin
    );

  } catch (error) {
    console.error("[sync-creators] Error inesperado:", error);
    return withCORS(
      new Response(
        JSON.stringify({ 
          success: false, 
          error: String(error) 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
      origin
    );
  }
});
