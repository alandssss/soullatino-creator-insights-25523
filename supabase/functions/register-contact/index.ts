import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { withCORS, handleCORSPreflight } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  if (req.method === 'OPTIONS') {
    return handleCORSPreflight(origin);
  }

  // Rate limiting: 5 req/min (formulario público - spam)
  const rl = await rateLimit(req, { key: "register-contact", limitPerMin: 5 });
  if (!rl.ok) return withCORS(rl.response!, origin);

  try {
    console.log('[register-contact] Starting...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { creator_id, creator_username, phone_e164, channel } = await req.json();

    if (!creator_id || !channel) {
      throw new Error('Missing required fields: creator_id, channel');
    }

    // Obtener user agent e IP
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';

    // Registrar contacto
    const { data: logData, error: logError } = await supabase
      .from('creator_contact_log')
      .insert({
        creator_id,
        creator_username,
        phone_e164,
        channel,
        action: 'Click',
        user_agent: userAgent,
        ip,
      })
      .select()
      .single();

    if (logError) {
      throw logError;
    }

    console.log('[register-contact] Contact registered:', logData.id);

    // Si es WhatsApp, intentar enviar mensaje (usando la función existente whatsapp_activity)
    if (channel === 'WhatsApp' && phone_e164) {
      try {
        // Registrar en whatsapp_activity también
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || 'System';

        await supabase.from('whatsapp_activity').insert({
          creator_id,
          user_email: userEmail,
          action_type: 'seguimiento',
          message_preview: 'Mensaje de alerta automática',
          creator_name: creator_username || '',
        });

        // Actualizar el log con MessageSent
        await supabase
          .from('creator_contact_log')
          .update({ action: 'MessageSent' })
          .eq('id', logData.id);

        console.log('[register-contact] WhatsApp activity registered');
      } catch (waError: any) {
        console.error('[register-contact] WhatsApp error:', waError);
        // Actualizar el log con Failed
        await supabase
          .from('creator_contact_log')
          .update({ action: 'Failed', notes: waError?.message || 'Unknown error' })
          .eq('id', logData.id);
      }
    }

    return withCORS(
      new Response(
        JSON.stringify({
          success: true,
          record_id: logData.id,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      ),
      origin
    );

  } catch (error: any) {
    console.error('[register-contact] Error:', error);
    return withCORS(
      new Response(
        JSON.stringify({ error: error?.message || 'Unknown error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
      origin
    );
  }
});
