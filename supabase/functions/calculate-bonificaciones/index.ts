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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { creatorId } = await req.json();

    if (!creatorId) {
      return new Response(
        JSON.stringify({ error: "creatorId es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular fecha del mes actual
    const fechaReporte = new Date();
    const year = fechaReporte.getFullYear();
    const month = fechaReporte.getMonth();
    const mesReferencia = new Date(year, month, 1).toISOString().split('T')[0];
    const ultimoDia = new Date(year, month + 1, 0);
    const diasRestantes = Math.max(0, Math.ceil((ultimoDia.getTime() - fechaReporte.getTime()) / (1000 * 60 * 60 * 24)));

    console.log(`Calculando bonificaciones para creator ${creatorId}, mes ${mesReferencia}`);

    // Obtener creador
    const { data: creator, error: creatorError } = await supabaseClient
      .from('creators')
      .select('id, nombre, dias_en_agencia')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      console.error('Error obteniendo creador:', creatorError);
      return new Response(
        JSON.stringify({ error: "Creador no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener datos de creator_live_daily del mes
    const primerDia = new Date(year, month, 1);
    const { data: liveData, error: liveError } = await supabaseClient
      .from('creator_live_daily')
      .select('fecha, horas, diamantes')
      .eq('creator_id', creatorId)
      .gte('fecha', primerDia.toISOString().split('T')[0])
      .lte('fecha', ultimoDia.toISOString().split('T')[0]);

    if (liveError) {
      console.error('Error obteniendo datos live:', liveError);
      return new Response(
        JSON.stringify({ error: "Error obteniendo datos live" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular métricas
    const dias_live_mes = liveData?.filter(d => (d.horas || 0) > 0).length || 0;
    const horas_live_mes = liveData?.reduce((sum, d) => sum + (d.horas || 0), 0) || 0;
    const diam_live_mes = liveData?.reduce((sum, d) => sum + (d.diamantes || 0), 0) || 0;

    // Calcular hitos
    const hito_12d_40h = dias_live_mes >= 12 && horas_live_mes >= 40;
    const hito_20d_60h = dias_live_mes >= 20 && horas_live_mes >= 60;
    const hito_22d_80h = dias_live_mes >= 22 && horas_live_mes >= 80;

    // Calcular graduaciones
    const grad_50k = diam_live_mes >= 50000;
    const grad_100k = diam_live_mes >= 100000;
    const grad_300k = diam_live_mes >= 300000;
    const grad_500k = diam_live_mes >= 500000;
    const grad_1m = diam_live_mes >= 1000000;

    // Días extra y bono
    const dias_extra_22 = Math.max(0, dias_live_mes - 22);
    const bono_extra_usd = dias_extra_22 * 3;

    // Determinar próximo objetivo
    let proximo_objetivo_tipo = 'graduacion';
    let proximo_objetivo_valor = '50000';
    let faltante = 0;

    if (!grad_50k) {
      proximo_objetivo_valor = '50000';
      faltante = 50000 - diam_live_mes;
    } else if (!grad_100k) {
      proximo_objetivo_valor = '100000';
      faltante = 100000 - diam_live_mes;
    } else if (!grad_300k) {
      proximo_objetivo_valor = '300000';
      faltante = 300000 - diam_live_mes;
    } else if (!grad_500k) {
      proximo_objetivo_valor = '500000';
      faltante = 500000 - diam_live_mes;
    } else if (!grad_1m) {
      proximo_objetivo_valor = '1000000';
      faltante = 1000000 - diam_live_mes;
    } else {
      proximo_objetivo_tipo = 'mantenimiento';
      proximo_objetivo_valor = 'Mantener nivel';
      faltante = 0;
    }

    // Calcular requerimientos diarios
    const req_diam_por_dia = diasRestantes > 0 ? Math.ceil(faltante / diasRestantes) : 0;
    
    // Horas requeridas
    let horas_faltantes = 0;
    if (!hito_22d_80h) {
      horas_faltantes = Math.max(0, 80 - horas_live_mes);
    } else if (!hito_20d_60h) {
      horas_faltantes = Math.max(0, 60 - horas_live_mes);
    } else if (!hito_12d_40h) {
      horas_faltantes = Math.max(0, 40 - horas_live_mes);
    }
    
    const req_horas_por_dia = diasRestantes > 0 ? horas_faltantes / diasRestantes : 0;

    // Prioridad 300k
    const es_prioridad_300k = (creator.dias_en_agencia || 0) < 90 && diam_live_mes < 300000;

    // Cerca de objetivo
    const cerca_de_objetivo = faltante > 0 && faltante < (parseInt(proximo_objetivo_valor) * 0.15);

    const bonificacion = {
      creator_id: creatorId,
      mes_referencia: mesReferencia,
      dias_live_mes,
      horas_live_mes,
      diam_live_mes,
      dias_restantes: diasRestantes,
      hito_12d_40h,
      hito_20d_60h,
      hito_22d_80h,
      grad_50k,
      grad_100k,
      grad_300k,
      grad_500k,
      grad_1m,
      dias_extra_22,
      bono_extra_usd,
      req_diam_por_dia,
      req_horas_por_dia,
      proximo_objetivo_tipo,
      proximo_objetivo_valor,
      es_prioridad_300k,
      cerca_de_objetivo
    };

    // Upsert
    const { error: upsertError } = await supabaseClient
      .from('creator_bonificaciones')
      .upsert([bonificacion], {
        onConflict: 'creator_id,mes_referencia'
      });

    if (upsertError) {
      console.error('Error en upsert:', upsertError);
      return new Response(
        JSON.stringify({ error: "Error al guardar bonificación" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generar mensajes
    const mensajeCreador = generarMensajeCreador(bonificacion, creator.nombre);
    const mensajeManager = generarMensajeManager(bonificacion, creator.nombre);

    console.log(`✅ Bonificaciones calculadas para ${creator.nombre}`);

    return new Response(
      JSON.stringify({
        success: true,
        bonificacion,
        mensajes: {
          creador: mensajeCreador,
          manager: mensajeManager
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error en calculate-bonificaciones:', error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generarMensajeCreador(bonif: any, nombre: string): string {
  const objetivo = bonif.proximo_objetivo_valor || "Mantener rendimiento";
  const faltante = bonif.proximo_objetivo_tipo === "graduacion" 
    ? `${bonif.req_diam_por_dia?.toLocaleString() || 0} diamantes/día`
    : bonif.proximo_objetivo_tipo === "hito"
    ? `${bonif.req_horas_por_dia?.toFixed(1) || 0} horas/día`
    : "Continúa así";

  let mensaje = `🎯 Tu avance del mes (al día de ayer)\n\n`;
  mensaje += `📅 Días: ${bonif.dias_live_mes}\n`;
  mensaje += `⏰ Horas: ${bonif.horas_live_mes}\n`;
  mensaje += `💎 Diamantes: ${bonif.diam_live_mes?.toLocaleString()}\n\n`;
  mensaje += `🎯 Próximo objetivo: ${objetivo}\n`;
  mensaje += `📊 Te falta: ${faltante} en los ${bonif.dias_restantes} días restantes\n\n`;

  if (bonif.es_prioridad_300k) {
    mensaje += `⭐ ¡Prioriza alcanzar 300K este mes!\n`;
  }

  if (bonif.dias_extra_22 > 0) {
    mensaje += `🎁 Bono extra: $${bonif.bono_extra_usd} USD por ${bonif.dias_extra_22} días adicionales!\n`;
  }

  return mensaje;
}

function generarMensajeManager(bonif: any, nombre: string): string {
  let mensaje = `📊 ${nombre} — Reporte del mes\n\n`;
  mensaje += `LIVE mes: ${bonif.dias_live_mes}d / ${bonif.horas_live_mes}h / ${bonif.diam_live_mes?.toLocaleString()} 💎\n`;
  mensaje += `Restan: ${bonif.dias_restantes} días\n\n`;

  mensaje += `Hitos:\n`;
  mensaje += `${bonif.hito_12d_40h ? '✅' : '❌'} 12d/40h\n`;
  mensaje += `${bonif.hito_20d_60h ? '✅' : '❌'} 20d/60h\n`;
  mensaje += `${bonif.hito_22d_80h ? '✅' : '❌'} 22d/80h\n\n`;

  mensaje += `Graduaciones:\n`;
  mensaje += `${bonif.grad_50k ? '✅' : '❌'} 50K\n`;
  mensaje += `${bonif.grad_100k ? '✅' : '❌'} 100K\n`;
  mensaje += `${bonif.grad_300k ? '✅' : '❌'} 300K\n`;
  mensaje += `${bonif.grad_500k ? '✅' : '❌'} 500K\n`;
  mensaje += `${bonif.grad_1m ? '✅' : '❌'} 1M\n\n`;

  mensaje += `Requerido/día: ${bonif.req_diam_por_dia?.toLocaleString() || 0} diam · ${bonif.req_horas_por_dia?.toFixed(1) || 0}h\n`;
  mensaje += `Bono: ${bonif.dias_extra_22} días extra ⇒ $${bonif.bono_extra_usd}\n\n`;

  if (bonif.es_prioridad_300k) {
    mensaje += `⚠️ PRIORIDAD: Alcanzar 300K\n`;
  }

  if (bonif.cerca_de_objetivo) {
    mensaje += `🎯 ¡Cerca del objetivo!\n`;
  }

  return mensaje;
}
