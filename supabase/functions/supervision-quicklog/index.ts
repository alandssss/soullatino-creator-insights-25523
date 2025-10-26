import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { withCORS, handleCORSPreflight } from "../_shared/cors.ts";

interface QuickLogRequest {
  creator_id: string;
  flags: {
    en_vivo?: boolean;
    en_batalla?: boolean;
    buena_iluminacion?: boolean;
    cumple_normas?: boolean;
    audio_claro?: boolean;
    set_profesional?: boolean;
  };
  notas?: string;
  reporte?: string;
  severidad?: 'baja' | 'media' | 'alta';
  accion_sugerida?: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  if (req.method === 'OPTIONS') {
    return handleCORSPreflight(origin);
  }

  // Rate limiting: 60 req/min (logs frecuentes)
  const rl = await rateLimit(req, { key: "supervision-quicklog", limitPerMin: 60 });
  if (!rl.ok) return withCORS(rl.response!, origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return withCORS(
        new Response(
          JSON.stringify({ error: 'No authorization header' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return withCORS(
        new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    // Verificar rol (admin, manager o supervisor)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['admin', 'manager', 'supervisor'].includes(roleData.role)) {
      console.error('Insufficient permissions:', roleData?.role);
      return withCORS(
        new Response(
          JSON.stringify({ error: 'Forbidden: requires admin, manager or supervisor role' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    // Rate limiting: máximo 1 log por creador cada 60s
    const body: QuickLogRequest = await req.json();
    const { creator_id, flags, notas, reporte, severidad, accion_sugerida } = body;

    if (!creator_id) {
      throw new Error('creator_id is required');
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('supervision_live_logs')
      .select('id')
      .eq('creator_id', creator_id)
      .eq('observer_user_id', user.id)
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (recentLogs && recentLogs.length > 0) {
      return withCORS(
        new Response(
          JSON.stringify({ error: 'Rate limit: wait 60 seconds before logging again for this creator' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    // Obtener nombre del observer
    const observerName = user.email || user.user_metadata?.name || 'Supervisor';

    // Insertar log
    const logData: any = {
      creator_id,
      observer_user_id: user.id,
      observer_name: observerName,
      fecha_evento: new Date().toISOString(),
      en_vivo: flags.en_vivo || false,
      en_batalla: flags.en_batalla || false,
      buena_iluminacion: flags.buena_iluminacion || false,
      cumple_normas: flags.cumple_normas !== undefined ? flags.cumple_normas : true,
      audio_claro: flags.audio_claro || false,
      set_profesional: flags.set_profesional || false,
      severidad: severidad || null,
      accion_sugerida: accion_sugerida || null
    };

    // Consolidar notas/reporte con mejor logging
    console.log('[supervision-quicklog] Datos recibidos:', {
      creator_id,
      flags,
      notas: notas ? `"${notas.substring(0, 50)}..."` : null,
      reporte: reporte ? `"${reporte.substring(0, 50)}..."` : null,
    });

    // Usar 'notas' si existe, sino 'reporte'
    const reporteFinal = (notas && notas.trim()) ? notas.trim() : (reporte || null);
    
    if (reporteFinal) {
      logData.reporte = reporteFinal;
      console.log('[supervision-quicklog] Reporte guardado:', reporteFinal.substring(0, 80));
    } else {
      console.warn('[supervision-quicklog] Sin notas ni reporte para guardar');
    }

    const { data: newLog, error: insertError } = await supabase
      .from('supervision_live_logs')
      .insert(logData)
      .select()
      .single();

    if (insertError) {
      console.error('[supervision-quicklog] Insert error detallado:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      throw insertError;
    }

    console.log('[supervision-quicklog] Quick log creado exitosamente:', newLog.id);

    return withCORS(
      new Response(
        JSON.stringify({ success: true, log: newLog }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      ),
      origin
    );
  } catch (error: any) {
    // Log detailed error server-side only (for debugging)
    console.error('Error in supervision-quicklog:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return generic error to client (prevents information disclosure)
    return withCORS(
      new Response(
        JSON.stringify({ error: 'Unable to process supervision log' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      ),
      origin
    );
  }
});