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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { mes_referencia } = await req.json();
    const mesRef = mes_referencia || new Date().toISOString().slice(0, 7) + '-01';

    console.log('Calculando bonificaciones para mes:', mesRef);

    // Calcular fechas del mes
    const fechaMes = new Date(mesRef);
    const year = fechaMes.getFullYear();
    const month = fechaMes.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const hoy = new Date();
    const diasRestantes = ultimoDia >= hoy ? Math.max(0, Math.ceil((ultimoDia.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    console.log(`Mes: ${mesRef}, días restantes: ${diasRestantes}`);

    // Obtener todos los creadores
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('id, nombre, dias_en_agencia');

    if (creatorsError) {
      console.error('Error obteniendo creadores:', creatorsError);
      throw creatorsError;
    }

    console.log(`Procesando ${creators?.length || 0} creadores`);

    // Obtener datos de creator_daily_stats para el mes (datos del Excel)
    const { data: liveData, error: liveError } = await supabase
      .from('creator_daily_stats')
      .select('creator_id, fecha, dias_validos_live, duracion_live_horas, diamantes')
      .gte('fecha', primerDia.toISOString().split('T')[0])
      .lte('fecha', ultimoDia.toISOString().split('T')[0]);

    if (liveError) {
      console.error('Error obteniendo datos live:', liveError);
      throw liveError;
    }

    console.log(`Datos live obtenidos: ${liveData?.length || 0} registros`);

    // Agrupar por creator_id usando Map (creator_daily_stats puede tener múltiples filas por mes si hay cargas parciales)
    const statsMap = new Map<string, { dias_live_mes: number; horas_live_mes: number; diam_live_mes: number }>();
    
    liveData?.forEach(stat => {
      if (!statsMap.has(stat.creator_id)) {
        statsMap.set(stat.creator_id, { dias_live_mes: 0, horas_live_mes: 0, diam_live_mes: 0 });
      }
      const current = statsMap.get(stat.creator_id)!;
      // @compat: Excel viene con datos MTD acumulados - usar máximo para evitar duplicación al recargar
      current.dias_live_mes = Math.max(current.dias_live_mes, stat.dias_validos_live || 0);
      current.horas_live_mes = Math.max(current.horas_live_mes, stat.duracion_live_horas || 0);
      current.diam_live_mes = Math.max(current.diam_live_mes, stat.diamantes || 0);
    });

    console.log(`Creadores con datos en statsMap: ${statsMap.size}`);

    // Calcular bonificaciones para cada creador
    const bonificacionesPorCreador = creators?.map(creator => {
      const stats = statsMap.get(creator.id) || { dias_live_mes: 0, horas_live_mes: 0, diam_live_mes: 0 };
      const { dias_live_mes, horas_live_mes, diam_live_mes } = stats;

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
      
      // Horas requeridas (calculado según hito pendiente)
      let horas_faltantes = 0;
      if (!hito_22d_80h) {
        horas_faltantes = Math.max(0, 80 - horas_live_mes);
        proximo_objetivo_tipo = 'hito';
        proximo_objetivo_valor = '22d/80h';
      } else if (!hito_20d_60h) {
        horas_faltantes = Math.max(0, 60 - horas_live_mes);
      } else if (!hito_12d_40h) {
        horas_faltantes = Math.max(0, 40 - horas_live_mes);
      }
      
      const req_horas_por_dia = diasRestantes > 0 ? horas_faltantes / diasRestantes : 0;

      // Prioridad 300k para nuevos
      const es_prioridad_300k = (creator.dias_en_agencia || 0) < 90 && diam_live_mes < 300000;

      // Cerca de objetivo (< 15% faltante)
      const cerca_de_objetivo = faltante > 0 && faltante < (parseInt(proximo_objetivo_valor) * 0.15);

      return {
        creator_id: creator.id,
        mes_referencia: mesRef,
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
    }) || [];

    // Upsert en creator_bonificaciones
    if (bonificacionesPorCreador.length > 0) {
      const { error: upsertError } = await supabase
        .from('creator_bonificaciones')
        .upsert(bonificacionesPorCreador, {
          onConflict: 'creator_id,mes_referencia'
        });

      if (upsertError) {
        console.error('Error en upsert de bonificaciones:', upsertError);
        throw upsertError;
      }
    }

    // Obtener resultados ordenados
    const { data: bonificaciones, error: fetchError } = await supabase
      .from('creator_bonificaciones')
      .select('*')
      .eq('mes_referencia', mesRef)
      .order('diam_live_mes', { ascending: false });

    if (fetchError) {
      console.error('Error obteniendo bonificaciones:', fetchError);
      throw fetchError;
    }

    console.log(`✅ Bonificaciones calculadas: ${bonificaciones?.length || 0} creadores`);

    return new Response(
      JSON.stringify({
        success: true,
        mes_referencia: mesRef,
        total_creadores: bonificaciones?.length || 0,
        bonificaciones
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error en calculate-bonificaciones-predictivo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
