/**
 * Rapid Endpoint - Para pruebas manuales
 * Acepta form-data y JSON, responde con TwiML simulando whatsapp-webhook
 * 
 * SOLO PARA DESARROLLO/TESTING
 * En producción descomentar validación de X-Webhook-Token
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Token"
      }
    });
  }

  try {
    // TODO: En producción, descomentar esto
    // const webhookToken = Deno.env.get("WEBHOOK_TOKEN");
    // const providedToken = req.headers.get("X-Webhook-Token");
    // if (providedToken !== webhookToken) {
    //   return new Response("Unauthorized", { status: 401 });
    // }

    const contentType = req.headers.get("content-type") || "";
    let from = "";
    let body = "";

    // Parsear form-data o JSON
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      from = formData.get("From")?.toString() || "";
      body = (formData.get("Body")?.toString() || "").trim().toLowerCase();
    } else {
      const json = await req.json();
      from = json.From || json.from || "";
      body = (json.Body || json.body || "").trim().toLowerCase();
    }

    console.log(`[rapid-endpoint] From=${from}, Body=${body}`);

    // Simulación simple del menú
    let respuesta = "";

    if (body.includes("ayuda")) {
      respuesta = `📲 Menú de comandos

• *consultar batallas* → ver tus próximas 3
• *batalla* → tu próxima batalla
• *quiero una batalla* → solicitar asignación

Tip: guarda este número como "Soullatino Recordatorios".
— Agencia Soullatino`;

    } else if (body.includes("hola")) {
      respuesta = `👋 Hola
Este canal te informa sobre tus batallas oficiales de Soullatino.

Escribe *ayuda* para ver los comandos disponibles.
— Agencia Soullatino`;

    } else if (body.includes("batalla") || body.includes("consultar")) {
      respuesta = `ℹ️ Esta es una respuesta de prueba.
Para ver batallas reales, usa el webhook principal.
— Agencia Soullatino`;

    } else if (body.includes("quiero una batalla")) {
      respuesta = `✅ ¡Solicitud registrada! (modo prueba)
Tu manager revisará disponibilidad y te confirmará por este medio.
— Agencia Soullatino`;

    } else if (body.includes("portal") || body.includes("link")) {
      const portalUrl = `https://pkosoullatino.neuron.lat/portal/usuario_ejemplo`;
      respuesta = `📱 *Accede a tu portal personalizado aquí:*
${portalUrl}

¡Revisa tus próximas batallas! ⚔️
— Agencia Soullatino`;

    } else {
      respuesta = `👋 Hola
Este canal te informa sobre tus batallas oficiales de Soullatino.

Escribe *ayuda* para ver los comandos disponibles.
— Agencia Soullatino`;
    }

    // Responder TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${respuesta.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error: any) {
    console.error("[rapid-endpoint] Error:", error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>❌ Error en endpoint de prueba: ${error.message}
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
