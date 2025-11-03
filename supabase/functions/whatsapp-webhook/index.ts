import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface TwilioWebhookBody {
  From: string;
  Body: string;
  MessageSid: string;
}

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

    // buscar creator por teléfono (3 variantes)
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, nombre, telefono")
      .or(`telefono.eq.${phoneNumber},telefono.eq.+${phoneNumber},telefono.eq.52${phoneNumber.slice(-10)}`)
      .limit(1)
      .single();

    let respuesta = "";

    if (creatorError || !creator) {
      // no está registrado
      respuesta = `📞 No encontramos tu número en la agencia.\nPor favor escribe a tu manager para registrarte.\n\n— Agencia Soullatino`;
    } else {
      // está registrado
      const nombre = creator.nombre || "creador";

      if (mensaje === "batalla") {
        respuesta = await getBatalla(supabase, creator.id, nombre);
      } else if (mensaje === "batallas") {
        respuesta = await getBatallas(supabase, creator.id, nombre);
      } else if (mensaje === "ayuda") {
        respuesta = getAyuda(nombre);
      } else {
        // mensaje por defecto
        respuesta = `👋 Hola ${nombre}\n\nEnvía "batalla" para ver tu próxima batalla\no "ayuda" para conocer los comandos.\n\n— Agencia Soullatino`;
      }

      // log solo si sí es un creador
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

// ====== helpers de mensajes ======

async function getBatalla(supabase: any, creatorId: string, nombre: string): Promise<string> {
  const hoy = new Date().toISOString().split("T")[0];

  const { data: batalla } = await supabase
    .from("batallas")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("estado", "programada")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(1)
    .single();

  if (!batalla) {
    return `ℹ️ Hola ${nombre}\n\nNo tienes batallas programadas en este momento.\nSi esperas una asignación, contacta a tu manager.\n\n— Agencia Soullatino`;
  }

  return `📣 Próxima batalla

📅 Fecha: ${batalla.fecha}
🕒 Hora: ${batalla.hora}
🆚 Contrincante: ${batalla.oponente}
🧤 Potenciadores/guantes: ${batalla.guantes || "sin especificar"}
🎯 Reto: ${batalla.reto || "sin especificar"}
⚡ Modalidad: ${batalla.tipo || "estándar"}

Conéctate 10 minutos antes.
— Agencia Soullatino`;
}

async function getBatallas(supabase: any, creatorId: string, nombre: string): Promise<string> {
  const hoy = new Date().toISOString().split("T")[0];

  const { data: batallas } = await supabase
    .from("batallas")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("estado", "programada")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(3);

  if (!batallas || batallas.length === 0) {
    return `ℹ️ Hola ${nombre}\n\nNo tienes batallas programadas en este momento.\nSi esperas una asignación, contacta a tu manager.\n\n— Agencia Soullatino`;
  }

  let msg = `📋 Próximas batallas asignadas:\n\n`;
  batallas.forEach((b: any, i: number) => {
    msg += `${i + 1}) ${b.fecha} ${b.hora} — vs ${b.oponente}\n`;
  });
  msg += `\nSi alguna fecha no te corresponde, avisa a la agencia.\n— Agencia Soullatino`;

  return msg;
}

function getAyuda(nombre: string): string {
  return `📲 Comandos disponibles:

• batalla → muestra tu próxima batalla
• batallas → muestra tus próximas 3
• ayuda → muestra este menú

— Agencia Soullatino`;
}
