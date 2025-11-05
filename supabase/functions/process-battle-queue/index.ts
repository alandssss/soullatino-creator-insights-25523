import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  try {
    // Verificar autorización
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!authHeader || !authHeader.includes(serviceKey!)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log("[process-battle-queue] Iniciando procesamiento...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceKey!);

    // Obtener batallas pendientes
    const { data: queue, error: queueError } = await supabase
      .from("battle_queue")
      .select("*")
      .eq("status", "pending")
      .order("enqueued_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (queueError) {
      console.error("[process-battle-queue] Error leyendo cola:", queueError);
      throw queueError;
    }

    if (!queue || queue.length === 0) {
      console.log("[process-battle-queue] Cola vacía");
      return new Response(JSON.stringify({ 
        message: "Cola vacía",
        processed: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`[process-battle-queue] Procesando ${queue.length} batallas`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Procesar cada batalla
    for (const item of queue) {
      try {
        console.log(`[process-battle-queue] Enviando batalla ${item.batalla_id}`);

        // Llamar a send-batalla
        const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-batalla`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ batallaId: item.batalla_id })
        });

        const sendJson = await sendRes.json();

        if (sendRes.ok && sendJson.success) {
          // Marcar como sent
          await supabase
            .from("battle_queue")
            .update({ 
              status: "sent",
              processed_at: new Date().toISOString()
            })
            .eq("id", item.id);

          results.success++;
          console.log(`[process-battle-queue] ✅ Batalla ${item.batalla_id} enviada`);
        } else {
          // Marcar como failed
          await supabase
            .from("battle_queue")
            .update({ 
              status: "failed",
              intentos: item.intentos + 1,
              last_error: sendJson.error || sendJson.message || "Unknown error",
              processed_at: new Date().toISOString()
            })
            .eq("id", item.id);

          results.failed++;
          results.errors.push({
            batalla_id: item.batalla_id,
            error: sendJson.error || sendJson.message
          });
          console.error(`[process-battle-queue] ❌ Batalla ${item.batalla_id} falló:`, sendJson.error);
        }

      } catch (error: any) {
        console.error(`[process-battle-queue] Error procesando ${item.batalla_id}:`, error);
        
        // Marcar como failed
        await supabase
          .from("battle_queue")
          .update({ 
            status: "failed",
            intentos: item.intentos + 1,
            last_error: error.message,
            processed_at: new Date().toISOString()
          })
          .eq("id", item.id);

        results.failed++;
        results.errors.push({
          batalla_id: item.batalla_id,
          error: error.message
        });
      }
    }

    console.log(`[process-battle-queue] Resumen: ${results.success} éxitos, ${results.failed} fallos`);

    return new Response(JSON.stringify({
      processed: queue.length,
      success: results.success,
      failed: results.failed,
      errors: results.errors
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error: any) {
    console.error("[process-battle-queue] Error fatal:", error);
    return new Response(JSON.stringify({ 
      error: "Internal error",
      message: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
