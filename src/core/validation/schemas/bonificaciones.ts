import { z } from "zod";

export const BonificacionCalcSchema = z.object({
  creator_id: z.string().uuid().nullable().optional(),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional(),
  mode: z.enum(["single", "batch", "predictive"]).default("batch"),
});

export const BonificacionResponseSchema = z.object({
  creator_id: z.string().uuid(),
  mes_referencia: z.string(),
  dias_live_mes: z.number().int().min(0).max(31),
  horas_live_mes: z.number().min(0),
  diam_live_mes: z.number().min(0),
  dias_restantes: z.number().int().min(0),
  grad_50k: z.boolean(),
  grad_100k: z.boolean(),
  grad_300k: z.boolean(),
  grad_500k: z.boolean(),
  grad_1m: z.boolean(),
  hito_12d_40h: z.boolean(),
  hito_20d_60h: z.boolean(),
  hito_22d_80h: z.boolean(),
  bono_extra_usd: z.number().min(0),
  req_diam_por_dia: z.number().min(0),
  req_horas_por_dia: z.number().min(0),
  proximo_objetivo_tipo: z.string(),
  proximo_objetivo_valor: z.string(),
  es_prioridad_300k: z.boolean(),
  cerca_de_objetivo: z.boolean(),
});

export type BonificacionCalc = z.infer<typeof BonificacionCalcSchema>;
export type BonificacionResponse = z.infer<typeof BonificacionResponseSchema>;
