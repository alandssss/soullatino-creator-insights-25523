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
  
  // REGLA 2: Alerta si >3 días sin transmitir
  const diasSinTransmitir = params.diasTranscurridos - params.dias_live_mes;
  if (diasSinTransmitir > 3 && params.dias_live_mes < 5) {
    return `⚠️ ${n}, llevas varios días sin transmitir. Para mantener tu bonificación, necesitas transmitir ${params.reqDiamDia?.toFixed(0) ?? 5000} diamantes/día y ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h/día. ¿Confirmamos tu live de hoy y 5 PKO de 5 min? 💪`;
  }

  // REGLA 6: Datos en cero por varios días (recordatorio empático)
  if (params.diamActual === 0 && params.horas_live_mes === 0 && params.diasTranscurridos > 5) {
    return `${n}, sabemos que a veces las cosas se complican 💙. El equipo SoulLatino está aquí para apoyarte. ¿Podemos ayudarte a planear tus próximos lives? Necesitamos verte brillar ✨`;
  }

  // REGLA 5: Superó una graduación (felicitación)
  if (params.faltanDiam !== null && params.faltanDiam <= 0 && params.gradTarget) {
    return `🎉🎊 ¡FELICIDADES ${n.toUpperCase()}! 🎊🎉\n¡Alcanzaste tu graduación de ${params.gradTarget.toLocaleString()} diamantes! 💎✨\nSigue así, tu próxima meta es aún más grande. ¡Eres imparable! 🔥🚀`;
  }

  // REGLA 4: Nuevo (<90 días) y no ha llegado a 300K
  if (params.prioridad300k) {
    const porcentaje = params.gradTarget ? ((params.diamActual / params.gradTarget) * 100).toFixed(0) : 0;
    return `🔵 ${n}, como eres nuevo en la agencia, tu prioridad es alcanzar 300K diamantes este mes 💎\nLlevas ${params.diamActual.toLocaleString()} (${porcentaje}%). Faltan ${params.faltanDiam?.toLocaleString()} → ${params.reqDiamDia?.toFixed(0)}/día en ${params.diasRestantes} días.\n¿Confirmamos ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h hoy y 10 PKO de 5 min? ¡Vamos por esos 300K! 🚀`;
  }

  // REGLA 1: Cerca de un hito (<15%)
  const progresoHitoDias = (params.dias_live_mes / params.hito.d) * 100;
  const progresoHitoHoras = (params.horas_live_mes / params.hito.h) * 100;
  const cercaDeHito = (params.faltan_dias <= Math.ceil(params.hito.d * 0.15)) || (params.faltan_horas <= params.hito.h * 0.15);
  
  if (cercaDeHito && params.faltan_dias > 0) {
    return `🔥 ${n}, ¡ESTÁS MUY CERCA! 🔥\nSolo te faltan ${params.faltan_dias} día(s) y ${params.faltan_horas.toFixed(1)}h para tu hito de ${params.hito.d}d/${params.hito.h}h 🎯\n¿Confirmamos ${Math.ceil(params.faltan_horas / Math.max(1, params.diasRestantes))}h hoy y 10 PKO? ¡No te detengas ahora! 💪✨`;
  }

  // REGLA 3: Ya cumplió ≥22 días (bono constancia)
  if (params.diasExtra > 0) {
    return `🎉 ${n}, ¡FELICIDADES por tu constancia! 🎉\nLlevas ${params.dias_live_mes} días en vivo → Generas $${params.bonoExtraUSD} USD extra por consistencia 💵\nSigue así: ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h/día y 10 PKO. ¡Cada día cuenta! 🔥`;
  }

  // Mensaje estándar motivacional
  const hitoLine = `🎯 Hito ${params.hito.d}d/${params.hito.h}h: llevas ${params.dias_live_mes}d y ${params.horas_live_mes.toFixed(1)}h`;
  const gradLine = params.gradTarget && params.faltanDiam && params.faltanDiam > 0
    ? `💎 Para ${params.gradTarget.toLocaleString()}: faltan ${params.faltanDiam.toLocaleString()} (${params.reqDiamDia?.toFixed(0)}/día)`
    : `💎 ¡Superaste 1M este mes!`;

  return `🔥 ${n}, excelente avance\n${hitoLine}\n${gradLine}\n\n✅ Hoy: ${(params.faltan_horas / Math.max(1, params.diasRestantes)).toFixed(1)}h en vivo + 10 PKO × 5 min. ¡Tú puedes! 💪`;
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
  const head = `${params.nombre ?? "Creador"} — corte ${params.fechaCorte}`;
  const hitoLine = `Hito ${params.hito.d}/${params.hito.h}: ${params.dias_live_mes}d / ${params.horas_live_mes.toFixed(1)}h; faltan ${params.faltan_dias}d / ${params.faltan_horas.toFixed(1)}h.`;
  const gradLine = params.gradTarget
    ? `Grad ${params.gradTarget.toLocaleString()}: lleva ${params.diam.toLocaleString()} → faltan ${params.faltanDiam!.toLocaleString()} (req ${params.reqDiamDia ?? "—"}/día, ${params.diasRestantes} días).`
    : `Sin próxima grad (≥1M).`;
  const pri = params.prioridad300k ? "Prioridad <90d: 300K." : "";
  const bono = params.diasExtra > 0 ? `Bono: ${params.diasExtra}d >22 ⇒ $${params.bonoExtraUSD}.` : "";
  return `${head}\n${hitoLine}\n${gradLine}\nEstado: ${params.estado}. ${pri} ${bono}\nPlan: 2h hoy, 10 PKO, supervisión luz/audio/normas, registrar en supervision_live_logs.`;
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

    let agg: LiveMes = { dias_live_mes: 0, horas_live_mes: 0, diam_live_mes: 0 };
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
