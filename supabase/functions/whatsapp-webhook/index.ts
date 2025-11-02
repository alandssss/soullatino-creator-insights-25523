import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface TwilioWebhookBody {
  From: string;
  Body: string;
  MessageSid: string;
}

// 👇 crear supabase UNA sola vez
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizePhone(from: string): string {
  return from.replace("whatsapp:", "").replace(/\D/g, "");
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let body: TwilioWebhookBody;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = {
        From: formData.get("From") as string,
        Body: formData.get("Body") as string,
        MessageSid: formData.get("MessageSid") as string,
      };
    } else {
      body = await req.json();
    }

    const phoneNumber = normalizePhone(body.From);
    const mensaje = (body.Body || "").toLowerCase().trim();

    console.log(`[whatsapp-webhook] Mensaje de ${phoneNumber}: ${mensaje}`);

    // buscar creator
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, nombre, telefono")
      .or(`telefono.eq.${phoneNumber},telefono.eq.+${phoneNumber},telefono.eq.52${phoneNumber.slice(-10)}`)
      .limit(1)
      .single();

    let respuesta = "";

    if (creatorError || !creator) {
      respuesta = `📞 No encontramos tu número en Soullatino.\nEscribe a tu manager para registrarte.`;
    } else {
      if (mensaje === "batalla") {
        respuesta = await getBatalla(supabase, creator.id, creator.nombre);
      } else if (mensaje === "batallas") {
        respuesta = await getBatallas(supabase, creator.id);
      } else if (mensaje === "ayuda") {
        respuesta = getAyuda();
      } else {
        respuesta = `👋 Hola ${creator.nombre ?? ""}.\nEnvía:\n• "batalla" → tu próxima batalla\n• "batallas" → tus próximas 3\n• "ayuda" → ver comandos\n— Agencia Soullatino`;
      }

      // log
      await supabase.from("whatsapp_activity").insert({
        creator_id: creator.id,
        user_email: "Sistema WhatsApp",
        action_type: "consulta_batalla",
        message_preview: mensaje.substring(0, 100),
        creator_name: creator.nombre,
      });
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(respuesta)}</Message>
</Response>`;

    return new Response(twiml, {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[whatsapp-webhook] Error:", error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>⚠️ Hubo un error procesando tu solicitud. Intenta de nuevo más tarde.</Message>
</Response>`;
    return new Response(errorTwiml, {
      status: 500,
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  }
});

async function getBatalla(supabase: any, creatorId: string, nombre: string): Promise<string> {
  const hoy = new Date().toISOString().split("T")[0];

  const { data: batalla, error } = await supabase
    .from("batallas")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("estado", "programada")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(1)
    .single();

  if (error || !batalla) {
    return `ℹ️ No tienes batallas programadas en este momento.\nSi esperas una asignación, contacta a tu manager.`;
  }

  return `📣 Próxima batalla Soullatino

📅 Fecha: ${batalla.fecha}
🕒 Hora: ${batalla.hora}
🆚 Contrincante: ${batalla.oponente}
🧤 Potenciadores/guantes: ${batalla.guantes || "Sin especificar"}
🎯 Reto: ${batalla.reto || "Sin especificar"}
⚡ Modalidad: ${batalla.tipo || "Estándar"}

Conéctate 10 minutos antes.
— Agencia Soullatino`;
}

async function getBatallas(supabase: any, creatorId: string): Promise<string> {
  const hoy = new Date().toISOString().split("T")[0];

  const { data: batallas, error } = await supabase
    .from("batallas")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("estado", "programada")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(3);

  if (error || !batallas || batallas.length === 0) {
    return `ℹ️ No tienes batallas programadas actualmente.\nSi esperas una asignación, contacta a tu manager.`;
  }

  let msg = `📋 Próximas batallas asignadas:\n\n`;
  batallas.forEach((b: any, i: number) => {
    msg += `${i + 1}) ${b.fecha} ${b.hora} — vs ${b.oponente}\n`;
  });
  msg += `\nSi alguna fecha no te corresponde, avisa a la agencia.\n— Agencia Soullatino`;

  return msg;
}

function getAyuda(): string {
  return `📲 Comandos Soullatino:

• batalla → muestra tu próxima batalla
• batallas → muestra tus próximas 3
• ayuda → muestra este menú

— Agencia Soullatino`;
}
