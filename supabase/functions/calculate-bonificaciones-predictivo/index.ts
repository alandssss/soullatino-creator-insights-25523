import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validate } from "../_shared/validation.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const schema = z.object({
      mes_referencia: z.string().regex(/^\d{4}-\d{2}-01$/, "Formato de fecha inválido (YYYY-MM-01)").optional(),
    });

    const result = await validate(req, schema);
    if (!result.ok) return result.response!;

    const { mes_referencia } = result.data!;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Agrupar por creator_id usando Map (creator_daily_stats contiene datos DIARIOS, necesitamos SUMAR)
    const statsMap = new Map<string, { dias_live_mes: number; horas_live_mes: number; diam_live_mes: number; fechas_vistas: Set<string> }>();

    liveData?.forEach(stat => {
      if (!statsMap.has(stat.creator_id)) {
        statsMap.set(stat.creator_id, { dias_live_mes: 0, horas_live_mes: 0, diam_live_mes: 0, fechas_vistas: new Set() });
      }
      const current = statsMap.get(stat.creator_id)!;

      // ✅ USAR MAX para horas y diamantes (son valores MTD acumulativos del Excel, no deltas)
      current.horas_live_mes = Math.max(current.horas_live_mes, stat.duracion_live_horas || 0);
      current.diam_live_mes = Math.max(current.diam_live_mes, stat.diamantes || 0);

      // ✅ Contar días únicos (un día válido = tiene diamantes O ≥1h de live)
      if ((stat.diamantes || 0) > 0 || (stat.duracion_live_horas || 0) >= 1.0) {
        current.fechas_vistas.add(stat.fecha);
      }
    });

    // ✅ Convertir Set de fechas a conteo de días
    statsMap.forEach((stats) => {
      stats.dias_live_mes = stats.fechas_vistas.size;
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

      // Calcular graduaciones (milestones correctos: 100k, 300k, 500k, 1M)
      const grad_100k = diam_live_mes >= 100000;
      const grad_300k = diam_live_mes >= 300000;
      const grad_500k = diam_live_mes >= 500000;
      const grad_1m = diam_live_mes >= 1000000;

      // Días extra y bono
      const dias_extra_22 = Math.max(0, dias_live_mes - 22);
      const bono_extra_usd = dias_extra_22 * 3;

      // Determinar próximo objetivo (sin 50k)
      let proximo_objetivo_tipo = 'graduacion';
      let proximo_objetivo_valor = '100000';
      let faltante = 0;

      if (!grad_100k) {
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

      // ========== NUEVAS COLUMNAS: Semáforos, Faltantes y Fechas Estimadas ==========
      const graduaciones = [
        { valor: 100000, key: 'semaforo_100k', faltanKey: 'faltan_100k', reqKey: 'req_diam_por_dia_100k', fechaKey: 'fecha_estimada_100k' },
        { valor: 300000, key: 'semaforo_300k', faltanKey: 'faltan_300k', reqKey: 'req_diam_por_dia_300k', fechaKey: 'fecha_estimada_300k' },
        { valor: 500000, key: 'semaforo_500k', faltanKey: 'faltan_500k', reqKey: 'req_diam_por_dia_500k', fechaKey: 'fecha_estimada_500k' },
        { valor: 1000000, key: 'semaforo_1m', faltanKey: 'faltan_1m', reqKey: 'req_diam_por_dia_1m', fechaKey: 'fecha_estimada_1m' }
      ];

      const semaforosData: any = {};
      const hoy = new Date();
      const diaDelMes = hoy.getDate();
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
      const avanceTiempo = (diaDelMes / ultimoDiaMes) * 100;

      graduaciones.forEach(grad => {
        const faltan = Math.max(0, grad.valor - diam_live_mes);
        const reqPorDia = diasRestantes > 0 ? Math.ceil(faltan / diasRestantes) : 0;
        const avanceDiam = (diam_live_mes / grad.valor) * 100;

        let semaforo = 'rojo';
        if (diam_live_mes >= grad.valor) {
          semaforo = 'verde';
        } else if (avanceDiam >= avanceTiempo * 0.85) {
          semaforo = 'verde';
        } else if (avanceDiam >= avanceTiempo * 0.6) {
          semaforo = 'amarillo';
        }

        let fechaEstimada = null;
        if (faltan > 0 && reqPorDia > 0 && diasRestantes > 0) {
          const diasNecesarios = Math.ceil(faltan / reqPorDia);
          fechaEstimada = new Date(hoy);
          fechaEstimada.setDate(fechaEstimada.getDate() + diasNecesarios);
        }

        semaforosData[grad.key] = semaforo;
        semaforosData[grad.faltanKey] = faltan;
        semaforosData[grad.reqKey] = reqPorDia;
        semaforosData[grad.fechaKey] = fechaEstimada ? fechaEstimada.toISOString().split('T')[0] : null;
      });

      // Textos de coaching
      let textoCreador = '';
      let textoManager = '';
      let metaRecomendada = proximo_objetivo_valor;

      if (es_prioridad_300k) {
        metaRecomendada = '300K Diamantes (Prioridad)';
        textoCreador = `🎯 Meta prioritaria: 300K diamantes. Faltan ${(300000 - diam_live_mes).toLocaleString()}. Requieres ${Math.ceil((300000 - diam_live_mes) / diasRestantes).toLocaleString()} por día.`;
        textoManager = `Creador nuevo (<90 días). Enfocar en alcanzar 300K este mes.`;
      } else if (cerca_de_objetivo) {
        textoCreador = `¡Estás cerca de tu objetivo ${proximo_objetivo_valor}! Sigue así 💪`;
        textoManager = `Cerca del objetivo. Monitorear y motivar.`;
      } else if (faltante > 0) {
        textoCreador = `Objetivo: ${proximo_objetivo_valor}. Faltan ${faltante.toLocaleString()}. Requieres ${req_diam_por_dia.toLocaleString()} diamantes/día.`;
        textoManager = `Requiere ${req_diam_por_dia.toLocaleString()} diam/día para alcanzar ${proximo_objetivo_valor}.`;
      }

      const esNuevoMenos90Dias = (creator.dias_en_agencia || 0) < 90;

      return {
        creator_id: creator.id,
        mes_referencia: mesRef,
        dias_mtd: dias_live_mes,
        horas_mtd: horas_live_mes,
        diamantes_mtd: diam_live_mes,
        dias_restantes: diasRestantes,
        hito_12d_40h,
        hito_20d_60h,
        hito_22d_80h,
        grad_100k,
        grad_300k,
        grad_500k,
        grad_1m,
        dias_extra_22,
        bono_extra_usd,
        bono_dias_extra_usd: bono_extra_usd, // Alias para compatibilidad frontend
        req_diam_por_dia,
        req_horas_por_dia,
        proximo_objetivo_tipo,
        proximo_objetivo_valor,
        es_prioridad_300k,
        cerca_de_objetivo,
        ...semaforosData,
        texto_creador: textoCreador,
        texto_manager: textoManager,
        meta_recomendada: metaRecomendada,
        fecha_calculo: hoy.toISOString().split('T')[0],
        es_nuevo_menos_90_dias: esNuevoMenos90Dias
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
