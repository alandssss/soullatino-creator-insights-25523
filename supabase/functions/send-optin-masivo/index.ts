import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptInResult {
  creator_id: string;
  nombre: string;
  telefono: string;
  success: boolean;
  message_sid?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verificar autenticación del usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Obtener creadores activos con teléfono
    const { data: creators, error: creatorsError } = await supabase
      .from("creators")
      .select("id, nombre, telefono, tiktok_username")
      .eq("status", "activo")
      .not("telefono", "is", null);

    if (creatorsError) {
      console.error("[send-optin-masivo] Error obteniendo creators:", creatorsError);
      return new Response(JSON.stringify({ error: "Error obteniendo creadores" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!creators || creators.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No hay creadores con teléfono",
        total: 0,
        results: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`[send-optin-masivo] Enviando opt-in a ${creators.length} creadores`);

    // Configuración de Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    let twilioFromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM") || 
                           Deno.env.get("TWILIO_WHATSAPP_NUMBER")!;
    
    if (!twilioFromNumber.startsWith("whatsapp:")) {
      twilioFromNumber = `whatsapp:${twilioFromNumber}`;
    }

    const optinTemplateSid = "HX876f33776be5dbd5b7e471e5ee185215";
    const basicAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const results: OptInResult[] = [];

    // Enviar a cada creador (con rate limiting básico)
    for (const creator of creators) {
      try {
        // Normalizar teléfono
        let telefonoTwilio = creator.telefono.replace(/\s/g, "");
        if (!telefonoTwilio.startsWith("+")) {
          if (telefonoTwilio.length === 10) {
            telefonoTwilio = `+52${telefonoTwilio}`;
          } else {
            telefonoTwilio = `+${telefonoTwilio}`;
          }
        }
        const toWhatsApp = `whatsapp:${telefonoTwilio}`;

        // Enviar mensaje con template
        const twilioBody = new URLSearchParams({
          From: twilioFromNumber,
          To: toWhatsApp,
          ContentSid: optinTemplateSid
        });

        console.log(`[send-optin-masivo] Enviando a ${creator.nombre} (${toWhatsApp})`);

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
          telefono: telefonoTwilio,
          mensaje_enviado: `Opt-in template: ${optinTemplateSid}`,
          respuesta: twilioJson,
          twilio_message_sid: twilioJson.sid || null,
          twilio_status: twilioJson.status || twilioJson.error_code,
          error_message: twilioJson.message || null
        };

        await supabase.from("logs_whatsapp").insert(logData);

        if (!twilioRes.ok) {
          console.error(`[send-optin-masivo] Error enviando a ${creator.nombre}:`, twilioJson);
          results.push({
            creator_id: creator.id,
            nombre: creator.nombre,
            telefono: telefonoTwilio,
            success: false,
            error: twilioJson.message || "Error de Twilio"
          });
        } else {
          console.log(`[send-optin-masivo] Enviado a ${creator.nombre}, SID: ${twilioJson.sid}`);
          
          // Registrar actividad
          try {
            await supabase.from("whatsapp_activity").insert({
              creator_id: creator.id,
              user_email: "System",
              action_type: "optin_masivo",
              message_preview: "Template opt-in enviado",
              creator_name: creator.nombre
            });
          } catch (waError) {
            console.error(`[send-optin-masivo] Error registrando actividad para ${creator.nombre}:`, waError);
          }

          results.push({
            creator_id: creator.id,
            nombre: creator.nombre,
            telefono: telefonoTwilio,
            success: true,
            message_sid: twilioJson.sid
          });
        }

        // Rate limiting: esperar 500ms entre mensajes
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`[send-optin-masivo] Error con creator ${creator.nombre}:`, error);
        results.push({
          creator_id: creator.id,
          nombre: creator.nombre,
          telefono: creator.telefono,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[send-optin-masivo] Completado: ${successCount} exitosos, ${failCount} fallidos`);

    return new Response(JSON.stringify({
      success: true,
      total: creators.length,
      exitosos: successCount,
      fallidos: failCount,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[send-optin-masivo] Error general:", error);
    return new Response(JSON.stringify({ 
      error: "Internal error",
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
