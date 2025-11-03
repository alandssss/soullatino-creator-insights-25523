// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface TwilioWebhookBody {
  From: string;
  Body: string;
  MessageSid?: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizePhone(from: string): string {
  // deja solo dígitos (E.164 sin "+")
  return (from || "").replace("whatsapp:", "").replace(/\D/g, "");
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
        From: (formData.get("From") as string) || "",
        Body: (formData.get("Body") as string) || "",
        MessageSid: (formData.get("MessageSid") as string) || "",
      };
    } else {
      body = await req.json();
    }

    const phoneNumber = normalizePhone(body.From);
    const mensaje = (body.Body || "").toLowerCase().trim();

    console.log(`[whatsapp-webhook] From=${phoneNumber} Msg="${mensaje}"`);

    // 1) Intento por telefono_norm (solo dígitos)
    let creator = null as null | { id: string; nombre: string; telefono: string };
    {
      const { data, error } = await supabase
        .from("creators")
        .select("id, nombre, telefono, telefono_norm")
        .eq("telefono_norm", phoneNumber)
        .maybeSingle();

      if (error) console.error("[creators by telefono_norm] error:", error);
      if (data) creator = data as any;
    }

    // 2) Fallback por tus 3 variantes originales (si no hubo match)
    if (!creator) {
      const { data, error } = await supabase
        .from("creators")
        .select("id, nombre, telefono")
        .or(`telefono.eq.${phoneNumber},telefono.eq.+${phoneNumber},telefono.eq.52${phoneNumber.slice(-10)}`)
        .limit(1)
        .maybeSingle();

      if (error) console.error("[creators by telefono variants] error:", error);
      if (data) creator = data as any;
    }

    let respuesta = "";

    if (!creator) {
      // no está registrado
      respuesta =
        `📞 No encontramos tu número en la agencia.\n` +
        `Por favor escribe a tu manager para registrarte.\n\n— Agencia Soullatino`;

      // log de no registrado
      await supabase.from("whatsapp_activity").insert({
        creator_id: null,
        user_email: "Sistema WhatsApp",
        action_type: "numero_no_registrado",
        message_preview: mensaje.substring(0, 100),
        creator_name: null,
        phone_from: phoneNumber,
        raw_from: body.From,
      });
    } else {
      // está registrado
      const nombre = creator.nombre || "creador";

      if (mensaje === "batalla") {
        respuesta = await getBatalla(supabase, creator.id, nombre);
      } else if (mensaje === "batallas") {
        respuesta = await getBatallas(supabase, creator.id, nombre);
      } else if (mensaje === "ayuda") {
        respuesta = getAyuda();
      } else {
        // mensaje por defecto
        respuesta =
          `👋 Hola ${nombre}\n\n` +
          `Envía "batalla" para ver tu próxima batalla\n` +
          `o "ayuda" para conocer los comandos.\n\n` +
          `— Agencia Soullatino`;
      }

      // log si sí es un creador
      await supabase.from("whatsapp_activity").insert({
        creator_id: creator.id,
        user_email: "Sistema WhatsApp",
        action_type: "consulta_batalla",
        message_preview: mensaje.substring(0, 100),
        creator_name: creator.nombre,
        phone_from: phoneNumber,
        raw_from: body.From,
      });
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(respuesta)}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml", ...corsHeaders },
    });
  } catch (error) {
    console.error("[whatsapp-webhook] Error:", error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>⚠️ Hubo un error procesando tu solicitud. Intenta de nuevo más tarde.
— Agencia Soullatino</Message>
</Response>`;
    // DEVOLVEMOS 200 PARA EVITAR Error 11200 EN TWILIO
    return new Response(errorTwiml, {
      status: 200,
      headers: { "Content-Type": "text/xml", ...corsHeaders },
    });
  }
});

// ====== helpers de mensajes ======

async function getBatalla(supabase: any, creatorId: string, nombre: string): Promise<string> {
  const hoy = new Date().toISOString().split("T")[0];

  const { data: batalla, error } = await supabase
    .from("batallas")
    .select("fecha, hora, oponente, guantes, reto, tipo")
    .eq("creator_id", creatorId)
    .eq("estado", "programada")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .maybeSingle();

  if (error) {
    console.error("[getBatalla] error:", error);
    return `⚠️ Ocurrió un error al consultar tu batalla. Informa al administrador.\n— Agencia Soullatino`;
  }

  if (!batalla) {
    return (
      `ℹ️ Hola ${nombre}\n\nNo tienes batallas programadas en este momento.\n` +
      `Si esperas una asignación, contacta a tu manager.\n\n— Agencia Soullatino`
    );
  }

  return `📣 Próxima batalla

📅 Fecha: ${batalla.fecha}
🕒 Hora: ${batalla.hora}
🆚 Contrincante: ${batalla.oponente}
🧤 Potenciadores/guantes: ${batalla.guantes ?? "sin especificar"}
🎯 Reto: ${batalla.reto && batalla.reto.trim() !== "" ? batalla.reto : "sin especificar"}
⚡ Modalidad: ${batalla.tipo || "estándar"}

Conéctate 10 minutos antes.
— Agencia Soullatino`;
}

async function getBatallas(supabase: any, creatorId: string, nombre: string): Promise<string> {
  const hoy = new Date().toISOString().split("T")[0];

  const { data: batallas, error } = await supabase
    .from("batallas")
    .select("fecha, hora, oponente")
    .eq("creator_id", creatorId)
    .eq("estado", "programada")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(3);

  if (error) {
    console.error("[getBatallas] error:", error);
    return `⚠️ Ocurrió un error al consultar tus batallas. Informa al administrador.\n— Agencia Soullatino`;
  }

  if (!batallas || batallas.length === 0) {
    return (
      `ℹ️ Hola ${nombre}\n\nNo tienes batallas programadas en este momento.\n` +
      `Si esperas una asignación, contacta a tu manager.\n\n— Agencia Soullatino`
    );
  }

  let msg = `📋 Próximas batallas asignadas:\n\n`;
  batallas.forEach((b: any, i: number) => {
    msg += `${i + 1}) ${b.fecha} ${b.hora} — vs ${b.oponente}\n`;
  });
  msg += `\nSi alguna fecha no te corresponde, avisa a la agencia.\n— Agencia Soullatino`;
  return msg;
}

function getAyuda(): string {
  return `📲 Comandos disponibles:

• batalla → muestra tu próxima batalla
• batallas → muestra tus próximas 3
• ayuda → muestra este menú

— Agencia Soullatino`;
}
