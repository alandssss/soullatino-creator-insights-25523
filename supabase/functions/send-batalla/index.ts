import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TIMEZONE = Deno.env.get("TIMEZONE") || "America/Chihuahua";

function formatearFechaLarga(fecha: string): string {
  try {
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIMEZONE
    });
  } catch {
    return fecha;
  }
}

function formatearHora(hora: string): string {
  try {
    const [hh, mm] = hora.split(":");
    return `${hh}:${mm}`;
  } catch {
    return hora;
  }
}

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

    const { batallaId } = await req.json();

    if (!batallaId) {
      return new Response(JSON.stringify({ error: "batallaId requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`[send-batalla] Procesando batalla ${batallaId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceKey!);

    // Obtener batalla con creator
    const { data: batalla, error: batallaError } = await supabase
      .from("batallas")
      .select(`
        *,
        creators!inner(id, nombre, telefono, tiktok_username)
      `)
      .eq("id", batallaId)
      .single();

    if (batallaError || !batalla) {
      console.error("[send-batalla] Batalla no encontrada:", batallaError);
      return new Response(JSON.stringify({ error: "Batalla no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const creator = batalla.creators;

    if (!creator.telefono) {
      console.error(`[send-batalla] Creator ${creator.nombre} sin teléfono`);
      return new Response(JSON.stringify({ error: "Creator sin teléfono" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Construir URL del portal
    const FRONTEND_URL = Deno.env.get("VITE_SUPABASE_URL")?.replace('/rest/v1', '').replace('/functions/v1', '') || 
                         'https://mpseoscrzpnequwvzokn.supabase.co';
    const portalUrl = `${FRONTEND_URL}/portal/${creator.tiktok_username}`;

    // Construir mensaje
    let mensaje = `Hola ${creator.nombre} 👋\n`;
    mensaje += `Se programó una *batalla* para ti:\n\n`;
    mensaje += `📅 *Fecha:* ${formatearFechaLarga(batalla.fecha)}\n`;
    mensaje += `🕒 *Hora:* ${formatearHora(batalla.hora)}\n`;
    mensaje += `🆚 *Vs:* ${batalla.oponente}\n`;
    mensaje += `🧤 *Guantes:* ${batalla.guantes ? "Sí" : "No"}\n`;
    if (batalla.reto) {
      mensaje += `🎯 *Reto:* ${batalla.reto}\n`;
    }
    mensaje += `⚡ *Tipo:* ${batalla.tipo || "estándar"}\n\n`;
    mensaje += `📱 Revisa todas tus batallas en:\n${portalUrl}\n\n`;
    mensaje += `Conéctate 10 min antes. Si no puedes, avísanos 💬\n`;
    mensaje += `— Agencia Soullatino`;

    // Preparar teléfono para Twilio (whatsapp:+E164)
    let telefonoTwilio = creator.telefono.replace(/\s/g, "");
    if (!telefonoTwilio.startsWith("+")) {
      // Si no tiene +, asumir que necesita +52 (México)
      if (telefonoTwilio.length === 10) {
        telefonoTwilio = `+52${telefonoTwilio}`;
      } else {
        telefonoTwilio = `+${telefonoTwilio}`;
      }
    }
    const toWhatsApp = `whatsapp:${telefonoTwilio}`;

    // Enviar vía Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioFromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM") || 
                             Deno.env.get("TWILIO_WHATSAPP_NUMBER")!;

    const basicAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const twilioBody = new URLSearchParams({
      From: twilioFromNumber,
      To: toWhatsApp,
      Body: mensaje
    });

    console.log(`[send-batalla] Enviando a ${toWhatsApp}`);

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: twilioBody.toString()
    });

    const twilioJson = await twilioRes.json();

    // Guardar log
    const logData = {
      batalla_id: batallaId,
      telefono: telefonoTwilio,
      mensaje_enviado: mensaje,
      respuesta: twilioJson,
      twilio_message_sid: twilioJson.sid || null,
      twilio_status: twilioJson.status || twilioJson.error_code,
      error_message: twilioJson.message || null
    };

    await supabase.from("logs_whatsapp").insert(logData);

    if (!twilioRes.ok) {
      console.error("[send-batalla] Error Twilio:", twilioJson);
      return new Response(JSON.stringify({ 
        success: false, 
        error: twilioJson.message || "Error de Twilio",
        twilio_response: twilioJson
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`[send-batalla] Enviado exitosamente, SID: ${twilioJson.sid}`);

    // Marcar batalla como notificada
    await supabase
      .from("batallas")
      .update({ notificacion_enviada: true })
      .eq("id", batallaId);

    // Registrar en whatsapp_activity
    try {
      await supabase.from("whatsapp_activity").insert({
        creator_id: creator.id,
        user_email: "System",
        action_type: "notificacion_batalla",
        message_preview: mensaje.substring(0, 100),
        creator_name: creator.nombre
      });
    } catch (waError) {
      console.error("[send-batalla] Error registrando en whatsapp_activity:", waError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_sid: twilioJson.sid,
      batalla_id: batallaId,
      to: toWhatsApp
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error: any) {
    console.error("[send-batalla] Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal error",
      message: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
