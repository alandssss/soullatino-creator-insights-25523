// Edge Function: Envía WhatsApp automático cuando se crea/actualiza una batalla
// Soporta INSERT y UPDATE con mensajes personalizados
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Twilio
const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const WHATS_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM")!;

// Seguridad del hook
const HOOK_SECRET = Deno.env.get("BATTLE_CREATED_HOOK_SECRET")!;

// ============= VALIDACIÓN CON ZOD =============

const RequestSchema = z.object({
  batalla_id: z.string().uuid("ID de batalla inválido"),
  operation: z.enum(['INSERT', 'UPDATE']).optional().default('INSERT')
});

const BatallaFieldsSchema = z.object({
  oponente: z.string().max(100).regex(/^[a-zA-Z0-9\sáéíóúñÁÉÍÓÚÑ_-]+$/).optional().nullable(),
  reto: z.string().max(200).optional().nullable(),
  tipo: z.string().max(50).optional().nullable(),
  guantes: z.string().max(100).optional().nullable()
});

// ============= UTILIDADES =============

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return dt.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function fmtHora(hhmmss: string): string {
  return (hhmmss || "").slice(0, 5);
}

Deno.serve(async (req) => {
  try {
    // Validación del secret
    const auth = req.headers.get("authorization") || "";
    if (!auth || auth !== `Bearer ${HOOK_SECRET}`) {
      console.error("[battle-created] Unauthorized request");
      return new Response("Unauthorized", { status: 401 });
    }

    // Validar request con Zod
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error("[battle-created] Invalid request:", parseResult.error.errors);
      return new Response(JSON.stringify({ 
        ok: false, 
        reason: "validation_error",
        errors: parseResult.error.errors
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { batalla_id, operation } = parseResult.data;

    // Leer batalla + creador
    const { data: batalla, error } = await supabase
      .from("batallas")
      .select("id, fecha, hora, oponente, guantes, reto, tipo, estado, creator_id, creators:creator_id(nombre, telefono)")
      .eq("id", batalla_id)
      .maybeSingle();

    if (error || !batalla) {
      console.error("[battle-created] No se pudo leer batalla:", error);
      return new Response(JSON.stringify({ ok: false, reason: "not_found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (batalla.estado !== "programada") {
      console.log("[battle-created] Batalla no programada, skip");
      return new Response(JSON.stringify({ ok: true, skipped: "estado_no_programada" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const creator = Array.isArray(batalla.creators) ? batalla.creators[0] : batalla.creators;
    const telefono = creator?.telefono;
    if (!telefono) {
      console.error("[battle-created] Creador sin teléfono");
      return new Response(JSON.stringify({ ok: false, reason: "no_phone" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar campos de batalla antes de construir mensaje
    const fieldsValidation = BatallaFieldsSchema.safeParse({
      oponente: batalla.oponente,
      reto: batalla.reto,
      tipo: batalla.tipo,
      guantes: batalla.guantes
    });

    const validatedFields = fieldsValidation.success 
      ? fieldsValidation.data 
      : { oponente: null, reto: null, tipo: null, guantes: null };

    // Mensaje personalizado según operación
    const accion = operation === 'UPDATE' ? 'actualizada' : 'asignada';
    const icono = operation === 'UPDATE' ? '🔄' : '📣';
    const recordatorio = operation === 'UPDATE' 
      ? '⚠️ Revisa los cambios y confirma tu disponibilidad.' 
      : 'Conéctate 10 minutos antes.';

    const msg = `${icono} Batalla ${accion}

📅 Fecha: ${fmtFecha(batalla.fecha)}
🕒 Hora: ${fmtHora(batalla.hora)}
🆚 Contrincante: ${validatedFields.oponente ?? "por confirmar"}
🧤 Potenciadores: ${validatedFields.guantes || "sin especificar"}
🎯 Reto: ${validatedFields.reto?.trim() ? validatedFields.reto : "sin especificar"}
⚡ Modalidad: ${validatedFields.tipo || "estándar"}

${recordatorio}
— Agencia Soullatino`;

    // Enviar por Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const to = telefono.startsWith("whatsapp:") ? telefono : `whatsapp:${telefono}`;

    const body = new URLSearchParams({
      From: WHATS_FROM,
      To: to,
      Body: msg,
    });

    const tw = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const twJson = await tw.json().catch(() => ({}));
    
    // Logging sanitizado
    if (!tw.ok) {
      console.error("[battle-created] Twilio error:", tw.status, {
        error_code: twJson.code || 'unknown',
        message: twJson.message?.substring(0, 100) || 'No message',
        batalla_id,
        operation
      });
    } else {
      console.log("[battle-created] WhatsApp sent successfully:", {
        sid: twJson.sid?.substring(0, 10) + "...",
        batalla_id,
        operation
      });
    }

    // Registrar en logs
    await supabase.from("whatsapp_activity").insert({
      creator_id: batalla.creator_id,
      user_email: "Sistema WhatsApp",
      action_type: "notificacion_creacion_batalla",
      message_preview: msg.slice(0, 100),
      creator_name: creator?.nombre || null,
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      twilio_sid: twJson.sid || null,
      operation,
      batalla_id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[battle-created] error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
