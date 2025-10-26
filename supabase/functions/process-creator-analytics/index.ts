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

    console.log('[process-analytics] Stats obtenidas:', dailyStats?.length || 0, 'registros');

    if (!dailyStats || dailyStats.length === 0) {
      console.warn('[process-analytics] NO hay datos del mes actual para', creator.nombre);
      
      // Generar mensaje básico sin IA
      const mensajeBasico = `Hola ${creator.nombre}, aún no tenemos datos de tus lives este mes. ¡Comienza a transmitir para generar tu recomendación personalizada!`;
      
      return new Response(
        JSON.stringify({
          recommendation: mensajeBasico,
          manager_note: `${creator.nombre} - Sin datos este mes`,
          prediction: {
            faltan_diamantes: creator.hito_diamantes || 100000,
            faltan_horas: 70,
            probabilidad_de_logro: 0,
            recomendacion_accion: 'Iniciar actividad'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (statsError) {
      console.error('Error obteniendo stats diarias:', statsError);
    }

    // Agregar métricas del mes (dias_validos_live es acumulado, usar max; horas y diamantes sumar)
    const valid_days_so_far = dailyStats.reduce((max, d) => Math.max(max, d.dias_validos_live || 0), 0) || 0;
    const hours_so_far = dailyStats.reduce((sum, d) => sum + (d.duracion_live_horas || 0), 0) || 0;
    const diamonds_so_far = dailyStats.reduce((sum, d) => sum + (d.diamantes || 0), 0) || 0;

    console.log(`[process-analytics] Métricas del mes para ${creator.nombre}:`, { valid_days_so_far, hours_so_far, diamonds_so_far });

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
    const systemPrompt = `Eres un manager del equipo SoulLatino que envía mensajes personalizados por WhatsApp a creadores de TikTok LIVE.

FORMATO OBLIGATORIO:
"Hola [nombre], te saluda [tu nombre] de SoulLatino. Te envío esta recomendación con estadísticas al día de ayer:

Llevas [X] días en vivo y [Y] horas acumuladas, con [Z] diamantes generados (es decir, [promedio] por día).

[ANÁLISIS CONTEXTUAL según reglas]

Hoy trata de:
- Hacer live [X] horas
- Acumular [Y]k diamantes
[- Completar [Z] PKO de 5 minutos]

[MOTIVACIÓN FINAL]"

REGLAS DE ANÁLISIS (prioriza en este orden):
1. Si está a <15% de alcanzar un hito (20d/70h/100K) → "¡Estás MUY CERCA de alcanzar [hito]! Solo faltan [X] días/horas/diamantes."
2. Si cumple ≥22 días → "Por tu consistencia de [X] días, estás generando $[Y] USD extra este mes. ¡Sigue así!"
3. Si superó graduación → "🎉 ¡FELICIDADES! Lograste [50K/100K/300K/etc]. Tu próxima meta es [siguiente graduación]."
4. Si lleva >3 días sin transmitir → "He notado que llevas [X] días sin transmitir. ¿Todo bien? Recuerda que para mantener el ritmo necesitas [acción]."
5. Si es nuevo (<90 días) → "Como estás empezando, enfócate en alcanzar los 300K diamantes este mes."
6. Si probabilidad_logro > 0.7 → "Vas muy bien encaminado para alcanzar tu meta."
7. Si probabilidad_logro < 0.3 → "Será complicado alcanzar la meta, pero cada live suma. Enfócate en [acción prioritaria]."

TONO: Profesional pero cálido, como un manager que conoce al creador. Sin emojis excesivos.
NUNCA uses markdown o formato de lista con guiones en el mensaje principal.`;

    // Calcular contexto para reglas
    const diasSinTransmitir = currentDay - valid_days_so_far;
    const porcentajeHito = (valid_days_so_far / target_valid_days + hours_so_far / target_hours) / 2 * 100;
    const cercaDeHito = porcentajeHito >= 85; // Está a <15% de completar el hito
    const superoGraduacion = diamonds_so_far >= target_diamonds;
    const esNuevo = true; // Asumir nuevo si no hay dato de dias_en_agencia

    // Inicializar objeto de predicción
    let prediccion = {
      faltan_diamantes: needed_diamonds,
      faltan_horas: needed_hours,
      probabilidad_de_logro: 0,
      recomendacion_accion: ''
    };

    // Calcular predicción ANTES de llamar a Gemini
    const ritmoActual = valid_days_so_far > 0 ? diamonds_so_far / valid_days_so_far : 0;
    const ritmoRequerido = remaining_calendar_days > 0 ? needed_diamonds / remaining_calendar_days : 0;
    prediccion.probabilidad_de_logro = ritmoRequerido > 0 ? Math.min(0.95, ritmoActual / ritmoRequerido) : 0;
    prediccion.recomendacion_accion = `Requiere ${required_diamonds_per_day.toLocaleString()} diam/día y ${required_hours_per_day.toFixed(1)}h/día durante ${remaining_calendar_days} días`;

    const userPrompt = `CREADOR: ${creator.nombre}
HOY: día ${currentDay} del mes ${currentMonth}, quedan ${remaining_calendar_days} días

DATOS ACTUALES:
- Días válidos: ${valid_days_so_far}/${target_valid_days}
- Horas totales: ${hours_so_far.toFixed(1)}h/${target_hours}h
- Diamantes: ${diamonds_so_far.toLocaleString()}/${target_diamonds.toLocaleString()}
- Promedio diario: ${(diamonds_so_far / (valid_days_so_far || 1)).toFixed(0)} diamantes/día
- Días sin transmitir: ${diasSinTransmitir}

ANÁLISIS:
- Progreso hacia hito 20d/70h: ${porcentajeHito.toFixed(0)}%
- ¿Cerca de hito? ${cercaDeHito ? 'SÍ (<15% restante)' : 'No'}
- ¿Superó graduación ${target_diamonds.toLocaleString()}? ${superoGraduacion ? 'SÍ' : 'No'}
- Días ≥22: ${valid_days_so_far >= 22 ? 'SÍ (bono $' + ((valid_days_so_far - 22) * 3) + ' USD)' : 'No'}
- Probabilidad de lograr meta: ${(prediccion.probabilidad_de_logro * 100).toFixed(0)}%

META DIARIA:
- Horas sugeridas: ${hoy_horas_sugeridas}h
- Diamantes necesarios: ${required_diamonds_per_day.toLocaleString()}
- PKO recomendados: ${pko_sugeridos_hoy}

Genera el mensaje completo siguiendo el formato profesional de WhatsApp.`;

    let recommendation = '';
    let manager_note = '';

    if (geminiApiKey) {
      try {
        console.log('[process-analytics] Llamando a Gemini API...');
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
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
          const finishReason = aiData.candidates?.[0]?.finishReason;
          const parts = aiData.candidates?.[0]?.content?.parts || [];
          
          console.log('[process-analytics] Respuesta Gemini:', {
            candidates: aiData.candidates?.length || 0,
            finishReason,
            hasContent: parts.length > 0
          });

          // Unir todas las parts de forma resiliente
          recommendation = parts
            .map((p: any) => p?.text)
            .filter(Boolean)
            .join('\n')
            .trim();

          // Si vacío, loguear detalles de bloqueo/seguridad
          if (!recommendation) {
            console.warn('[process-analytics] Gemini NO devolvió contenido, usando fallback');
            const promptFeedback = aiData.promptFeedback;
            const safetyRatings = aiData.candidates?.[0]?.safetyRatings;
            console.warn('⚠️ Gemini devolvió respuesta vacía:', {
              finishReason,
              blockReason: promptFeedback?.blockReason,
              safetyRatings: safetyRatings?.map((r: any) => ({ category: r.category, probability: r.probability }))
            });

            // Intento simplificado (solo prompt de usuario, sin system)
            console.log('Reintentando con prompt simplificado...');
            const retryResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: { maxOutputTokens: 300, topP: 0.9, topK: 30 }
              })
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              const retryParts = retryData.candidates?.[0]?.content?.parts || [];
              recommendation = retryParts.map((p: any) => p?.text).filter(Boolean).join('\n').trim();
              console.log('Recomendación de retry:', recommendation ? 'OK' : 'vacía');
            }
          }

          if (recommendation) {
            console.log('✅ Recomendación generada por Gemini:', recommendation.substring(0, 80) + '...');
            
            // Generar nota para manager
            manager_note = `${creator.nombre} - ${valid_days_so_far}d/${hours_so_far.toFixed(1)}h/${diamonds_so_far.toLocaleString()} 💎. Ritmo: ${(diamonds_so_far / (valid_days_so_far || 1)).toFixed(0)} diam/día. ${cercaDeHito ? '¡CERCA DE HITO!' : superoGraduacion ? '¡GRADUÓ!' : diasSinTransmitir > 3 ? '⚠️ INACTIVO' : 'En track'}`;
            
            // Calcular probabilidad de logro
            const ritmoActual = valid_days_so_far > 0 ? diamonds_so_far / valid_days_so_far : 0;
            const ritmoRequerido = remaining_calendar_days > 0 ? needed_diamonds / remaining_calendar_days : 0;
            prediccion.probabilidad_de_logro = ritmoRequerido > 0 ? Math.min(0.95, ritmoActual / ritmoRequerido) : 0;
            prediccion.recomendacion_accion = `Requiere ${required_diamonds_per_day.toLocaleString()} diam/día y ${required_hours_per_day.toFixed(1)}h/día durante ${remaining_calendar_days} días`;
          }
        } else {
          const errorText = await aiResponse.text();
          console.error('Error HTTP en Gemini API:', {
            status: aiResponse.status,
            statusText: aiResponse.statusText,
            bodyPreview: errorText.substring(0, 200)
          });
          console.log('Intentando fallback a gemini-1.5-flash-001...');
          
          // Fallback to gemini-1.5-flash-001
          const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { maxOutputTokens: 500, topP: 0.95, topK: 40 }
            })
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const fallbackParts = fallbackData.candidates?.[0]?.content?.parts || [];
            recommendation = fallbackParts.map((p: any) => p?.text).filter(Boolean).join('\n').trim();
            console.log('✅ Recomendación generada por Gemini (fallback 1.5):', recommendation ? 'OK' : 'vacía');
          }
        }
      } catch (error) {
        console.error('Excepción al llamar a Gemini:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        });
      }
    } else {
      console.log('GEMINI_API_KEY no configurada');
    }

    // Fallback humano si IA falló completamente
    if (!recommendation) {
      console.warn('⚠️ Gemini no generó contenido → usando plantilla basada en reglas locales');
      
      const ritmo = valid_days_so_far > 0 ? (diamonds_so_far / valid_days_so_far).toFixed(0) : '0';
      const cercaHito = cercaDeHito ? `\n\n¡Estás MUY CERCA de alcanzar tu hito de ${target_valid_days} días y ${target_hours} horas! Solo faltan ${needed_valid_days} días y ${needed_hours.toFixed(0)} horas.` : '';
      const bonoExtra = valid_days_so_far >= 22 ? `\n\nPor tu consistencia de ${valid_days_so_far} días, estás generando $${((valid_days_so_far - 22) * 3)} USD extra este mes. ¡Excelente!` : '';
      
      recommendation = 
        `Hola ${creator.nombre}, te saluda el equipo de SoulLatino. Te envío esta recomendación con estadísticas al día de ayer:\n\n` +
        `Llevas ${valid_days_so_far} días en vivo y ${hours_so_far.toFixed(1)} horas acumuladas, con ${diamonds_so_far.toLocaleString()} diamantes generados (es decir, ${ritmo} por día).` +
        cercaHito +
        bonoExtra +
        `\n\nHoy trata de:\n- Hacer live ${Math.max(1, Math.ceil(required_hours_per_day))} horas\n- Acumular ${(required_diamonds_per_day / 1000).toFixed(0)}k diamantes` +
        (needed_valid_days > 0 ? `\n- Completar 1 día válido más` : '') +
        `\n\n¡Sí se puede! ✨`;
      
      manager_note = `${creator.nombre} - Plantilla local (sin IA): ${valid_days_so_far}d/${hours_so_far.toFixed(1)}h/${diamonds_so_far.toLocaleString()}💎`;
    }
    
    // Predicción ya calculada antes del prompt de IA (líneas 202-205)
    // Si aún no se generó manager_note, crearlo ahora
    if (!manager_note) {
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
