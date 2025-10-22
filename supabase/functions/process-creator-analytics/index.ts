import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INICIO process-creator-analytics ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Extract and verify JWT token
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('No auth header');
      return new Response(
        JSON.stringify({ error: 'No autorizado. Token requerido.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated client to check user
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    console.log('User obtenido:', user?.id, 'Error:', userError?.message);
    
    if (userError || !user) {
      console.error('Token inválido:', userError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or manager role
    console.log('Verificando rol del usuario:', user.id);
    const { data: userRole, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Rol obtenido:', userRole, 'Error:', roleError);

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'manager' && userRole.role !== 'viewer')) {
      console.error('Usuario sin permisos:', user.id, userRole);
      return new Response(
        JSON.stringify({ error: 'No autorizado. Se requiere rol de admin, manager o viewer.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuario autorizado con rol:', userRole.role);

    // User is authorized, proceed with the request
    const { creatorId } = await req.json();
    console.log('Procesando creatorId:', creatorId);
    
    if (!creatorId) {
      console.error('creatorId no proporcionado');
      return new Response(
        JSON.stringify({ error: 'creatorId es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('Gemini API Key presente:', !!geminiApiKey);
    
    // Use service role client for admin operations (after authorization check)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener información del creador
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('nombre, hito_diamantes')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      console.error('Error obteniendo creador:', creatorError);
      return new Response(
        JSON.stringify({ error: 'Creador no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Calcular fechas y días restantes
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const remaining_calendar_days = Math.max(0, lastDayOfMonth - currentDay + 1);

    // 2. Obtener métricas del mes actual desde creator_daily_stats
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const { data: dailyStats, error: statsError } = await supabase
      .from('creator_daily_stats')
      .select('dias_validos_live, duracion_live_horas, diamantes')
      .eq('creator_id', creatorId)
      .gte('fecha', firstDayOfMonth)
      .lte('fecha', today.toISOString().split('T')[0]);

    if (statsError) {
      console.error('Error obteniendo stats diarias:', statsError);
    }

    // Agregar métricas del mes
    const valid_days_so_far = dailyStats?.reduce((sum, d) => sum + (d.dias_validos_live || 0), 0) || 0;
    const hours_so_far = dailyStats?.reduce((sum, d) => sum + (d.duracion_live_horas || 0), 0) || 0;
    const diamonds_so_far = dailyStats?.reduce((sum, d) => sum + (d.diamantes || 0), 0) || 0;

    console.log(`Métricas del mes para ${creator.nombre}:`, { valid_days_so_far, hours_so_far, diamonds_so_far });

    // 3. Obtener hitos (por ahora valores por defecto, se pueden parametrizar)
    const target_valid_days = 20;
    const target_hours = 70;
    const target_diamonds = creator.hito_diamantes || 100000;

    // 5. Calcular necesidades
    const needed_valid_days = Math.max(0, target_valid_days - valid_days_so_far);
    const needed_hours = Math.max(0, target_hours - hours_so_far);
    const needed_diamonds = Math.max(0, target_diamonds - diamonds_so_far);

    // 6. Factibilidad de días
    const dias_factibles = needed_valid_days <= remaining_calendar_days;
    const dias_factibles_texto = dias_factibles 
      ? 'alcanzas' 
      : `ya no dan los días del calendario (faltarán ${needed_valid_days - remaining_calendar_days})`;

    // 7. Horas por día necesarias
    const required_hours_per_day = remaining_calendar_days > 0 
      ? needed_hours / remaining_calendar_days 
      : needed_hours;
    
    let semaforo_horas = 'holgado';
    if (required_hours_per_day > 6) semaforo_horas = 'poco realista';
    else if (required_hours_per_day > 4) semaforo_horas = 'apretado';
    else if (required_hours_per_day > 2) semaforo_horas = 'ajustado';

    // 8. Diamantes por día necesarios
    const required_diamonds_per_day = remaining_calendar_days > 0
      ? Math.round(needed_diamonds / remaining_calendar_days)
      : needed_diamonds;

    // 9. Sugerencias para hoy (PKO siempre obligatorio)
    const hoy_horas_sugeridas = Math.max(1, Math.ceil(required_hours_per_day));
    const hoy_dias_validos_sugeridos = needed_valid_days > 0 ? 1 : 0;
    
    // Calcular PKO según el estado
    let pko_sugeridos_hoy = 10; // Por defecto encaminado
    if (valid_days_so_far < 5 || hours_so_far < 15) {
      pko_sugeridos_hoy = 5; // Empezando
    } else if (diamonds_so_far < target_diamonds * 0.3) {
      pko_sugeridos_hoy = 20; // Bajo en diamantes
    }

    // 10. Generar retroalimentación según reglas del usuario
    const systemPrompt = `Eres un asesor empático del equipo SoulLatino que genera retroalimentación personalizada para creadores de TikTok LIVE.

REGLAS OBLIGATORIAS (prioriza en este orden):

1. Si está a <15% de alcanzar un hito → Mensaje motivacional con llamado a la acción urgente
2. Si lleva >3 días sin transmitir → Alerta de riesgo de baja, sugiere meta mínima diaria
3. Si cumple ≥22 días → Menciona que genera $3 USD/día extra por consistencia
4. Si es nuevo (<90 días) y no llegó a 300K → Enfoca todo en alcanzar esa meta
5. Si superó graduación (50K, 100K, 300K, etc.) → Felicita con emojis 🎉 y muestra próxima meta
6. Si datos de diamantes/horas = 0 por varios días → Recordatorio empático, NO regaño
7. Usa lenguaje humano, cálido, que denote acompañamiento

GRADUACIONES: 50K, 100K, 300K, 500K, 1M diamantes
HITOS: Tipo B (12d+40h), Tipo A (20d+60h), Tipo S (22d+80h)

FORMATO SALIDA (2-3 líneas máximo):
- Línea 1: Contexto emocional o logro
- Línea 2: Acción específica para HOY
- Línea 3 (opcional): Meta y probabilidad de logro

TONO: Motivacional, humano, directo, positivo. Usa emojis con moderación.
NUNCA uses markdown, NUNCA digas "0 PKO".`;

    // Calcular contexto para reglas
    const diasSinTransmitir = currentDay - valid_days_so_far;
    const porcentajeHito = (valid_days_so_far / target_valid_days) * 100;
    const cercaDeHito = porcentajeHito >= 85;
    const superoGraduacion = diamonds_so_far >= target_diamonds;
    const esNuevo = true; // Asumir nuevo si no hay dato de dias_en_agencia

    const userPrompt = `CREADOR: ${creator.nombre}
HOY: día ${currentDay} del mes ${currentMonth}, quedan ${remaining_calendar_days} días

SITUACIÓN ACTUAL:
- Días en vivo: ${valid_days_so_far}/${target_valid_days} (${porcentajeHito.toFixed(0)}%)
- Horas acumuladas: ${hours_so_far.toFixed(1)}/${target_hours}h
- Diamantes: ${diamonds_so_far.toLocaleString()}/${target_diamonds.toLocaleString()}
- Días sin transmitir consecutivos: ${diasSinTransmitir}

ANÁLISIS:
- ¿Cerca de hito? ${cercaDeHito ? 'SÍ (<15% restante)' : 'No'}
- ¿Superó graduación? ${superoGraduacion ? 'SÍ' : 'No'}
- ¿Es nuevo? ${esNuevo && diamonds_so_far < 300000 ? 'SÍ (enfoque en 300K)' : 'No'}
- ¿Sin actividad? ${diamonds_so_far === 0 && hours_so_far === 0 ? 'SÍ (varios días)' : 'No'}
- Días ≥22: ${valid_days_so_far >= 22 ? 'SÍ (bono $' + ((valid_days_so_far - 22) * 3) + ')' : 'No'}

NECESITA HOY:
- Horas: ${hoy_horas_sugeridas}h
- PKO: ${pko_sugeridos_hoy} (5 min c/u)
- Diamantes para estar en track: ${required_diamonds_per_day.toLocaleString()}

Genera mensaje en 2-3 líneas según las reglas, priorizando la situación más relevante.`;

    let recommendation = '';

    // Try Gemini AI service with API key if available
    let manager_note = '';
    let prediccion = {
      faltan_diamantes: needed_diamonds,
      faltan_horas: needed_hours,
      probabilidad_de_logro: 0,
      recomendacion_accion: ''
    };

    if (geminiApiKey) {
      try {
        console.log('Llamando a Gemini API con gemini-2.5-flash...');
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\n${userPrompt}`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 500,
              topP: 0.95,
              topK: 40
            }
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          recommendation = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          console.log('Recomendación generada por Gemini:', recommendation);
          
          // Generar nota para manager
          manager_note = `${creator.nombre} - ${valid_days_so_far}d/${hours_so_far.toFixed(1)}h/${diamonds_so_far.toLocaleString()} 💎. Ritmo: ${(diamonds_so_far / (valid_days_so_far || 1)).toFixed(0)} diam/día. ${cercaDeHito ? '¡CERCA DE HITO!' : superoGraduacion ? '¡GRADUÓ!' : diasSinTransmitir > 3 ? '⚠️ INACTIVO' : 'En track'}`;
          
          // Calcular probabilidad de logro
          const ritmoActual = valid_days_so_far > 0 ? diamonds_so_far / valid_days_so_far : 0;
          const ritmoRequerido = remaining_calendar_days > 0 ? needed_diamonds / remaining_calendar_days : 0;
          prediccion.probabilidad_de_logro = ritmoRequerido > 0 ? Math.min(0.95, ritmoActual / ritmoRequerido) : 0;
          prediccion.recomendacion_accion = `Requiere ${required_diamonds_per_day.toLocaleString()} diam/día y ${required_hours_per_day.toFixed(1)}h/día durante ${remaining_calendar_days} días`;
        } else {
          const errorText = await aiResponse.text();
          console.error('Error en Gemini API (intentando fallback a flash-latest):', errorText);
          
          // Fallback to gemini-1.5-flash-latest
          const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { maxOutputTokens: 500, topP: 0.95, topK: 40 }
            })
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            recommendation = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            console.log('Recomendación generada por Gemini (fallback):', recommendation);
          }
        }
      } catch (error) {
        console.error('Error llamando a Gemini:', error);
      }
    } else {
      console.log('GEMINI_API_KEY no configurada');
    }

    // Fallback técnico si IA falló completamente
    if (!recommendation) {
      console.error('⚠️ Gemini API no disponible - usando fallback técnico');
      recommendation = `ERROR DE IA: No se pudo generar recomendación personalizada. Contactar soporte técnico.`;
      manager_note = `Sistema de IA no disponible para ${creator.nombre}. Revisar configuración GEMINI_API_KEY.`;
    }
    
    // Calcular predicción si no se hizo antes
    if (prediccion.probabilidad_de_logro === 0) {
      const ritmoActual = valid_days_so_far > 0 ? diamonds_so_far / valid_days_so_far : 0;
      const ritmoRequerido = remaining_calendar_days > 0 ? needed_diamonds / remaining_calendar_days : 0;
      prediccion.probabilidad_de_logro = ritmoRequerido > 0 ? Math.min(0.95, ritmoActual / ritmoRequerido) : 0;
      prediccion.recomendacion_accion = `Requiere ${required_diamonds_per_day.toLocaleString()} diam/día y ${required_hours_per_day.toFixed(1)}h/día durante ${remaining_calendar_days} días`;
      manager_note = `${creator.nombre} - ${valid_days_so_far}d/${hours_so_far.toFixed(1)}h/${diamonds_so_far.toLocaleString()} 💎`;
    }

    // 4. Guardar la recomendación en la base de datos
    const tipo = dias_factibles ? (semaforo_horas === 'holgado' ? 'verde' : 'amarillo') : 'rojo';
    const { error: insertError } = await supabase
      .from('creator_recommendations')
      .insert({
        creator_id: creatorId,
        titulo: `Retro ${currentDay}/${currentMonth}`,
        descripcion: recommendation,
        tipo: tipo,
        prioridad: tipo === 'rojo' ? 'alta' : tipo === 'amarillo' ? 'media' : 'baja',
        icono: tipo === 'verde' ? '✅' : tipo === 'amarillo' ? '⚠️' : '🔴'
      });

    if (insertError) {
      console.error('Error guardando recomendación:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        recommendation,
        manager_note,
        prediccion,
        milestone: tipo,
        milestoneDescription: `${dias_factibles ? 'Factible' : 'Difícil'} - ${semaforo_horas}`,
        metrics: {
          valid_days_so_far,
          target_valid_days,
          needed_valid_days,
          hours_so_far,
          target_hours,
          needed_hours,
          required_hours_per_day: required_hours_per_day.toFixed(1),
          diamonds_so_far,
          target_diamonds,
          needed_diamonds,
          required_diamonds_per_day,
          remaining_calendar_days
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    // Log detailed error server-side only (for debugging)
    console.error('Error in process-creator-analytics:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Return generic error to client (prevents information disclosure)
    return new Response(
      JSON.stringify({ error: 'Unable to process analytics' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
