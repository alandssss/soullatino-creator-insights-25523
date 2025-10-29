// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { withCORS, handleCORSPreflight } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const TZ = "America/Chihuahua";

function nowInTZ(tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return new Date(`${y}-${m}-${d}T00:00:00`);
}

function firstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function lastDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateToISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Hito = { d: number; h: number; key: string };
const HITOS: Hito[] = [
  { d: 12, h: 40, key: "12d_40h" },
  { d: 20, h: 60, key: "20d_60h" },
  { d: 22, h: 80, key: "22d_80h" },
];
const GRADS = [50_000, 100_000, 300_000, 500_000, 1_000_000];

type LiveMes = {
  dias_live_mes: number;
  horas_live_mes: number;
  diam_live_mes: number;
};

function hitoActivo(dias: number, horas: number): Hito {
  for (const h of HITOS) {
    if (dias < h.d || horas < h.h) return h;
  }
  return HITOS[HITOS.length - 1];
}

function proximaGraduacion(diam: number): number | null {
  for (const g of GRADS) if (diam < g) return g;
  return null;
}

function ceilDiv(a: number, b: number) {
  if (b <= 0) return null;
  return Math.ceil(a / b);
}

function semaforo(ritmoActual: number, ritmoReq: number | null): "verde"|"amarillo"|"rojo" {
  if (ritmoReq === null || !isFinite(ritmoReq) || ritmoReq <= 0) return "verde";
  if (ritmoActual >= ritmoReq) return "verde";
  if (ritmoActual >= 0.7 * ritmoReq) return "amarillo";
  return "rojo";
}

function msgCreador(params: {
  nombre: string | null;
  hito: Hito;
  dias_live_mes: number; horas_live_mes: number;
  faltan_dias: number; faltan_horas: number;
  gradTarget: number | null; faltanDiam: number | null;
  reqDiamDia: number | null;
  diasRestantes: number;
  prioridad300k: boolean;
  bonoExtraUSD: number; diasExtra: number;
  diasTranscurridos: number;
  diamActual: number;
}) {
  const n = params.nombre ?? "creador";
  const promHorasDia = params.dias_live_mes > 0 ? (params.horas_live_mes / params.dias_live_mes).toFixed(1) : "0.0";
  
  // REGLA 2: Alerta si >3 días sin transmitir
  const diasSinTransmitir = params.diasTranscurridos - params.dias_live_mes;
  if (diasSinTransmitir > 3 && params.dias_live_mes < 5) {
    return `⚠️ ${n} - ALERTA INACTIVIDAD

📊 Estado:
• Días sin transmitir: ${diasSinTransmitir}
• Días live del mes: ${params.dias_live_mes}

🎯 Plan HOY (obligatorio):
• Horas requeridas/día: ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h
• Diamantes/día: ${params.reqDiamDia?.toFixed(0) ?? 5000}
• PKO mínimo: 5 batallas × 5min
• Horario sugerido: revisar picos`;
  }

  // REGLA 6: Datos en cero por varios días
  if (params.diamActual === 0 && params.horas_live_mes === 0 && params.diasTranscurridos > 5) {
    return `${n} - CONTACTO URGENTE REQUERIDO

📋 Situación:
• Sin actividad registrada en ${params.diasTranscurridos} días
• Estado: requiere intervención del equipo

🤝 Siguiente paso:
• Agendar llamada con manager
• Revisar disponibilidad y objetivos
• Replantear estrategia del mes`;
  }

  // REGLA 5: Superó una graduación
  if (params.faltanDiam !== null && params.faltanDiam <= 0 && params.gradTarget) {
    return `🎉 ${n} - GRADUACIÓN ALCANZADA

✅ Logro:
• Nivel: ${params.gradTarget.toLocaleString()} diamantes
• Días completados: ${params.dias_live_mes}
• Horas acumuladas: ${Math.round(params.horas_live_mes)}h

🎯 Próximo objetivo:
• Mantener o superar nivel actual
• Bono adicional por días extra >22`;
  }

  // REGLA 4: Nuevo (<90 días) y no ha llegado a 300K
  if (params.prioridad300k) {
    const porcentaje = params.gradTarget ? ((params.diamActual / params.gradTarget) * 100).toFixed(0) : 0;
    return `🔵 ${n} - PRIORIDAD 300K (NUEVO <90d)

📊 Progreso actual:
• Diamantes: ${params.diamActual.toLocaleString()} / ${params.gradTarget?.toLocaleString()}
• Avance: ${porcentaje}%
• Faltante: ${params.faltanDiam?.toLocaleString()}

🎯 Plan de acción:
• Diamantes/día requeridos: ${params.reqDiamDia?.toFixed(0)}
• Horas/día: ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h
• PKO objetivo: 10 batallas × 5min
• Días restantes: ${params.diasRestantes}`;
  }

  // REGLA 1: Cerca de un hito (<15%)
  const cercaDeHito = (params.faltan_dias <= Math.ceil(params.hito.d * 0.15)) || (params.faltan_horas <= params.hito.h * 0.15);
  
  if (cercaDeHito && params.faltan_dias > 0) {
    return `🔥 ${n} - CERCA DEL HITO

📊 Faltante mínimo:
• Días: ${params.faltan_dias} (objetivo: ${params.hito.d})
• Horas: ${params.faltan_horas.toFixed(1)}h (objetivo: ${params.hito.h}h)

🎯 Push final:
• Horas hoy: ${Math.ceil(params.faltan_horas / Math.max(1, params.diasRestantes))}h
• PKO: 10 batallas × 5min
• Días disponibles: ${params.diasRestantes}`;
  }

  // REGLA 3: Ya cumplió ≥22 días (bono constancia)
  if (params.diasExtra > 0) {
    return `🎉 ${n} - BONO CONSTANCIA ACTIVADO

✅ Logro de consistencia:
• Días completados: ${params.dias_live_mes}
• Días extra >22: ${params.diasExtra}
• Bono generado: $${params.bonoExtraUSD} USD

🎯 Mantener nivel:
• Horas/día: ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h
• PKO diario: 10 batallas × 5min
• Cada día extra = +$3 USD`;
  }

  // Mensaje estándar con métricas objetivas
  const gradStatus = params.gradTarget && params.faltanDiam && params.faltanDiam > 0
    ? `${params.diamActual.toLocaleString()} / ${params.gradTarget.toLocaleString()} (falta: ${params.faltanDiam.toLocaleString()})`
    : `${params.diamActual.toLocaleString()} (objetivo superado)`;

  return `📊 ${n} - RESUMEN MENSUAL

Estado actual:
• Diamantes: ${gradStatus}
• Días live: ${params.dias_live_mes} / ${params.hito.d}
• Horas totales: ${Math.round(params.horas_live_mes)}h / ${params.hito.h}h
• Promedio horas/día: ${promHorasDia}h

🎯 Requerimientos diarios:
• Diamantes/día: ${params.reqDiamDia?.toFixed(0) ?? "—"}
• Horas/día: ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h
• PKO sugerido: 10 × 5min
• Días restantes: ${params.diasRestantes}`;
}

function msgManager(params: {
  nombre: string | null; fechaCorte: string;
  hito: Hito; dias_live_mes: number; horas_live_mes: number;
  faltan_dias: number; faltan_horas: number;
  gradTarget: number | null; diam: number;
  faltanDiam: number | null; reqDiamDia: number | null; diasRestantes: number;
  estado: "verde"|"amarillo"|"rojo";
  prioridad300k: boolean; bonoExtraUSD: number; diasExtra: number;
}) {
  const semaforo = params.estado === "verde" ? "🟢" : params.estado === "amarillo" ? "🟡" : "🔴";
  const tag = params.prioridad300k ? " [<90d]" : "";
  
  const metricasDiam = params.gradTarget 
    ? `${params.diam.toLocaleString()} / ${params.gradTarget.toLocaleString()} (falta: ${params.faltanDiam!.toLocaleString()})`
    : `${params.diam.toLocaleString()} (≥1M)`;
  
  const accionPorEstado = params.estado === "rojo" 
    ? `🚨 ACCIÓN: Contacto inmediato requerido`
    : params.estado === "amarillo"
    ? `⚠️ SEGUIMIENTO: Ajustar ritmo/estrategia`
    : `✅ OBJETIVO: Monitoreo estándar`;

  return `${semaforo} ${params.nombre ?? "Creador"}${tag} — ${params.fechaCorte}

Métricas actuales:
• Diamantes: ${metricasDiam}
• Hito: ${params.dias_live_mes}d / ${params.horas_live_mes.toFixed(1)}h (obj: ${params.hito.d}d/${params.hito.h}h)
• Requerimientos: ${params.reqDiamDia ?? "—"} diam/día, ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h/día
• Días disponibles: ${params.diasRestantes}
${params.diasExtra > 0 ? `• Bono constancia: $${params.bonoExtraUSD} (${params.diasExtra}d >22)` : ''}

${accionPorEstado}

Plan operativo:
• Objetivo diario: 2h live + 10 PKO × 5min
• Supervisión: luz/audio/normas (reg. en supervision_live_logs)
• Seguimiento: revisar progreso en 48h`;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  if (req.method === "OPTIONS") {
    return handleCORSPreflight(origin);
  }

  // Rate limiting: 20 req/min (IA - caro)
  const rl = await rateLimit(req, { key: "generate-creator-advice", limitPerMin: 20 });
  if (!rl.ok) return withCORS(rl.response!, origin);

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) {
      return withCORS(
        new Response(JSON.stringify({ error: "missing auth" }), { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        }),
        origin
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const { data: canReadRoles, error: roleErr } = await userClient.rpc("has_role", { _user_id: (await userClient.auth.getUser()).data.user?.id, _role: "manager" as any });
    if (roleErr || !canReadRoles) {
      const { data: canReadViewer } = await userClient.rpc("has_role", { _user_id: (await userClient.auth.getUser()).data.user?.id, _role: "viewer" as any });
      if (!canReadViewer) {
        return withCORS(
          new Response(JSON.stringify({ error: "unauthorized" }), { 
            status: 401, 
            headers: { "Content-Type": "application/json" } 
          }),
          origin
        );
      }
    }

    const { creator_id } = await req.json();
    if (!creator_id) {
      return withCORS(
        new Response(JSON.stringify({ error: "creator_id requerido" }), { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }),
        origin
      );
    }

    const hoyTZ = nowInTZ(TZ);
    const inicioMes = firstDayOfMonth(hoyTZ);
    const finMes = lastDayOfMonth(hoyTZ);
    const ayer = addDays(hoyTZ, -1);
    const diasRestantes = Math.max(0, (finMes.getTime() - hoyTZ.getTime()) / (1000 * 60 * 60 * 24) + 1) | 0;

    const { data: creatorRow, error: creatorErr } = await userClient
      .from("creators")
      .select("id, nombre, tiktok_username, telefono, dias_en_agencia")
      .eq("id", creator_id)
      .single();

    if (creatorErr || !creatorRow) {
      return withCORS(
        new Response(JSON.stringify({ error: "creator_not_found" }), { 
          status: 404, 
          headers: { "Content-Type": "application/json" } 
        }),
        origin
      );
    }

    // @compat: Intentar primero desde creator_bonificaciones (misma fuente que panel)
    const mesRefStr = dateToISO(inicioMes);
    const { data: bonifRow } = await userClient
      .from("creator_bonificaciones")
      .select("dias_live_mes, horas_live_mes, diam_live_mes")
      .eq("creator_id", creator_id)
      .eq("mes_referencia", mesRefStr)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let agg: LiveMes = { dias_live_mes: 0, horas_live_mes: 0, diam_live_mes: 0 };

    if (bonifRow) {
      // Usar datos del panel de bonificaciones (MTD, sin duplicados)
      agg = {
        dias_live_mes: bonifRow.dias_live_mes || 0,
        horas_live_mes: bonifRow.horas_live_mes || 0,
        diam_live_mes: bonifRow.diam_live_mes || 0,
      };
    } else {
      // Fallback: calcular desde creator_live_daily
      const { data: liveData, error: liveErr } = await userClient
        .from("creator_live_daily")
        .select("fecha, horas, diamantes")
        .eq("creator_id", creator_id)
        .gte("fecha", dateToISO(inicioMes))
        .lte("fecha", dateToISO(ayer));

      if (liveErr) {
        return withCORS(
          new Response(JSON.stringify({ error: "live_query_error" }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
          }),
          origin
        );
      }

      if (liveData && liveData.length) {
        const diasValidos = new Set<string>();
        let horas = 0, diam = 0;
        for (const r of liveData) {
          const h = Number(r.horas ?? 0);
          const d = Number(r.diamantes ?? 0);
          horas += h;
          diam += d;
          if (h > 0) diasValidos.add(String(r.fecha));
        }
        agg = { dias_live_mes: diasValidos.size, horas_live_mes: horas, diam_live_mes: diam };
      }
    }

    const sinDatos = agg.dias_live_mes === 0 && agg.horas_live_mes === 0 && agg.diam_live_mes === 0;
    const hito = hitoActivo(agg.dias_live_mes, agg.horas_live_mes);
    const faltan_dias = Math.max(0, hito.d - agg.dias_live_mes);
    const faltan_horas = Math.max(0, hito.h - agg.horas_live_mes);

    const esNuevo = Number(creatorRow.dias_en_agencia ?? 9999) < 90;
    const gradTargetRaw = esNuevo && agg.diam_live_mes < 300_000 ? 300_000 : proximaGraduacion(agg.diam_live_mes);
    const faltanDiam = gradTargetRaw ? Math.max(0, gradTargetRaw - agg.diam_live_mes) : null;
    const reqDiamDia = faltanDiam !== null ? ceilDiv(faltanDiam, diasRestantes) : null;

    const diasTranscurridos = Math.max(1, (hoyTZ.getDate() - 1));
    const ritmoActual = agg.diam_live_mes / diasTranscurridos;
    const estado = semaforo(ritmoActual, reqDiamDia);

    const diasExtra = Math.max(0, agg.dias_live_mes - 22);
    const bonoExtraUSD = diasExtra * 3;

    const para_creador = msgCreador({
      nombre: creatorRow.nombre ?? creatorRow.tiktok_username ?? null,
      hito,
      dias_live_mes: agg.dias_live_mes,
      horas_live_mes: agg.horas_live_mes,
      faltan_dias,
      faltan_horas,
      gradTarget: gradTargetRaw,
      faltanDiam,
      reqDiamDia,
      diasRestantes,
      prioridad300k: Boolean(esNuevo && gradTargetRaw === 300_000),
      bonoExtraUSD, diasExtra,
      diasTranscurridos,
      diamActual: agg.diam_live_mes,
    });

    const para_manager = msgManager({
      nombre: creatorRow.nombre ?? creatorRow.tiktok_username ?? null,
      fechaCorte: dateToISO(ayer),
      hito,
      dias_live_mes: agg.dias_live_mes,
      horas_live_mes: agg.horas_live_mes,
      faltan_dias,
      faltan_horas,
      gradTarget: gradTargetRaw,
      diam: agg.diam_live_mes,
      faltanDiam,
      reqDiamDia,
      diasRestantes,
      estado,
      prioridad300k: Boolean(esNuevo && gradTargetRaw === 300_000),
      bonoExtraUSD, diasExtra,
    });

    const noEnviarAlCreador = sinDatos;

    const payload = {
      creator_id,
      estado,
      hito_actual: hito.key,
      dias_logrados: agg.dias_live_mes,
      dias_objetivo: hito.d,
      horas_logradas: Number(agg.horas_live_mes.toFixed(2)),
      horas_objetivo: hito.h,
      faltan_dias,
      faltan_horas: Number(faltan_horas.toFixed(2)),
      diamantes_actuales: agg.diam_live_mes,
      objetivo_graduacion: gradTargetRaw,
      faltan_diamantes: faltanDiam,
      requeridos_por_dia_diamantes: reqDiamDia,
      dias_restantes_mes: diasRestantes,
      bono: { dias_extra: diasExtra, usd: bonoExtraUSD },
      prioridad_nuevo_300k: Boolean(esNuevo && gradTargetRaw === 300_000),
      para_creador,
      para_manager,
      no_enviar_al_creador: noEnviarAlCreador,
      advice: para_creador,
    };

    return withCORS(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      origin
    );
  } catch (e) {
    console.error(e);
    return withCORS(
      new Response(JSON.stringify({ error: "internal_error" }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }),
      origin
    );
  }
});
