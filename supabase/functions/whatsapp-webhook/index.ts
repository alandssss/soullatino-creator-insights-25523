import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TIMEZONE = Deno.env.get("TIMEZONE") || "America/Chihuahua";

// Normalizar teléfono: quitar whatsapp: y no-dígitos
function normalizarTelefono(raw: string): string[] {
  const limpio = raw.replace(/whatsapp:/gi, "").replace(/\D/g, "");
  const variantes: string[] = [];
  
  // E.164 con +
  if (limpio.length === 12 && limpio.startsWith("52")) {
    variantes.push(`+${limpio}`);
  } else if (limpio.length === 10) {
    // Asumir México
    variantes.push(`+52${limpio}`);
  } else if (limpio.length > 10) {
    variantes.push(`+${limpio}`);
  }
  
  // Sin +
  variantes.push(limpio);
  
  // Solo últimos 10 dígitos
  if (limpio.length >= 10) {
    variantes.push(limpio.slice(-10));
  }
  
  return [...new Set(variantes)];
}

// Formatear fecha larga en español
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

// Formatear hora HH:mm
function formatearHora(hora: string): string {
  try {
    const [hh, mm] = hora.split(":");
    return `${hh}:${mm}`;
  } catch {
    return hora;
  }
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let from = "";
    let body = "";

    // Parsear Twilio form data
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      from = formData.get("From")?.toString() || "";
      body = (formData.get("Body")?.toString() || "").trim().toLowerCase();
    } else {
      const json = await req.json();
      from = json.From || "";
      body = (json.Body || "").trim().toLowerCase();
    }

    console.log(`[whatsapp-webhook] From=${from}, Body=${body}`);

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalizar teléfono
    const variantes = normalizarTelefono(from);
    console.log(`[whatsapp-webhook] Variantes teléfono:`, variantes);

    // Buscar creador
    const { data: creators, error: creatorError } = await supabase
      .from("creators")
      .select("id, nombre, telefono")
      .or(variantes.map(v => `telefono.eq.${v}`).join(","))
      .limit(1);

    if (creatorError) {
      console.error("[whatsapp-webhook] Error buscando creador:", creatorError);
    }

    const creator = creators?.[0];
    console.log(`[whatsapp-webhook] Creador encontrado:`, creator?.nombre || "ninguno");

    // Registrar actividad si existe whatsapp_activity
    if (creator) {
      try {
        await supabase.from("whatsapp_activity").insert({
          creator_id: creator.id,
          user_email: "Twilio Inbound",
          action_type: "mensaje_recibido",
          message_preview: body.substring(0, 100),
          creator_name: creator.nombre
        });
      } catch (waError) {
        console.error("[whatsapp-webhook] Error registrando actividad:", waError);
      }
    }

    let respuestaTwiML = "";

    // Comandos
    if (body.includes("ayuda") || body === "help") {
      respuestaTwiML = `📲 Menú de comandos

• *consultar batallas* → ver tus próximas 3
• *batalla* → tu próxima batalla
• *quiero una batalla* → solicitar asignación

Tip: guarda este número como "Soullatino Recordatorios".
— Agencia Soullatino`;

    } else if (body.includes("consultar batallas") || body === "batallas") {
      if (!creator) {
        respuestaTwiML = `ℹ️ No te reconocemos en nuestro sistema. Contacta a tu manager.
— Agencia Soullatino`;
      } else {
        // Buscar próximas 3 batallas
        const { data: batallas } = await supabase
          .from("batallas")
          .select("fecha, hora, oponente")
          .eq("creator_id", creator.id)
          .eq("estado", "programada")
          .gte("fecha", new Date().toISOString().split("T")[0])
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true })
          .limit(3);

        if (!batallas || batallas.length === 0) {
          respuestaTwiML = `ℹ️ Por ahora no tienes batallas programadas.
Si esperas una asignación, contacta a tu manager.
— Agencia Soullatino`;
        } else {
          let lista = "📋 Próximas batallas\n\n";
          batallas.forEach((b, i) => {
            const fechaCorta = new Date(b.fecha + "T00:00:00").toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              timeZone: TIMEZONE
            });
            lista += `${i + 1}) ${fechaCorta} ${formatearHora(b.hora)} — vs ${b.oponente}\n`;
          });
          lista += "\nSi alguna fecha no te corresponde, avisa a la agencia.\n— Agencia Soullatino";
          respuestaTwiML = lista;
        }
      }

    } else if (body === "batalla" || body.includes("próxima batalla")) {
      if (!creator) {
        respuestaTwiML = `ℹ️ No te reconocemos en nuestro sistema. Contacta a tu manager.
— Agencia Soullatino`;
      } else {
        const { data: batallas } = await supabase
          .from("batallas")
          .select("*")
          .eq("creator_id", creator.id)
          .eq("estado", "programada")
          .gte("fecha", new Date().toISOString().split("T")[0])
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true })
          .limit(1);

        if (!batallas || batallas.length === 0) {
          respuestaTwiML = `ℹ️ Por ahora no tienes batallas programadas.
Si esperas una asignación, contacta a tu manager.
— Agencia Soullatino`;
        } else {
          const b = batallas[0];
          let msg = `📣 Próxima batalla\n\n`;
          msg += `📅 Fecha: ${formatearFechaLarga(b.fecha)}\n`;
          msg += `🕒 Hora: ${formatearHora(b.hora)}\n`;
          msg += `🆚 Vs: ${b.oponente}\n`;
          msg += `🧤 Guantes: ${b.guantes ? "Sí" : "No"}\n`;
          if (b.reto) msg += `🎯 Reto: ${b.reto}\n`;
          msg += `⚡ Tipo: ${b.tipo || "estándar"}\n\n`;
          msg += `Conéctate 10 min antes. Si no puedes, avísanos 💬\n— Agencia Soullatino`;
          respuestaTwiML = msg;
        }
      }

    } else if (body.includes("quiero una batalla") || body.includes("solicitar batalla")) {
      // Registrar solicitud
      if (creator) {
        try {
          await supabase.from("whatsapp_activity").insert({
            creator_id: creator.id,
            user_email: "Twilio Inbound",
            action_type: "solicitud_batalla",
            message_preview: "Creador solicitó batalla vía WhatsApp",
            creator_name: creator.nombre
          });
        } catch (waError) {
          console.error("[whatsapp-webhook] Error registrando solicitud:", waError);
        }
      }

      respuestaTwiML = `✅ ¡Solicitud registrada!
Tu manager revisará disponibilidad y te confirmará por este medio.
— Agencia Soullatino`;

    } else if (body === "hola" || body === "hi" || body === "hello") {
      respuestaTwiML = `👋 Hola
Este canal te informa sobre tus batallas oficiales de Soullatino.

Escribe *ayuda* para ver los comandos disponibles.
— Agencia Soullatino`;

    } else {
      // Default
      respuestaTwiML = `👋 Hola
Este canal te informa sobre tus batallas oficiales de Soullatino.

Escribe *ayuda* para ver los comandos disponibles.
— Agencia Soullatino`;
    }

    // Responder con TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${respuestaTwiML.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error: any) {
    console.error("[whatsapp-webhook] Error:", error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>❌ Error procesando tu mensaje. Intenta más tarde o contacta a tu manager.
— Agencia Soullatino</Message>
</Response>`;

    return new Response(errorTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
