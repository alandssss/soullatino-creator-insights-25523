import { z } from "zod";

export const SupervisionLogSchema = z.object({
  creator_id: z.string().uuid("ID de creador inválido"),
  observer_name: z.string()
    .min(2, "Nombre del observador muy corto")
    .max(100, "Nombre del observador muy largo"),
  en_vivo: z.boolean(),
  en_batalla: z.boolean().optional(),
  audio_claro: z.boolean().optional(),
  buena_iluminacion: z.boolean().optional(),
  set_profesional: z.boolean().optional(),
  cumple_normas: z.boolean().default(true),
  score: z.number().int().min(0).max(100).optional(),
  riesgo: z.enum(["bajo", "medio", "alto", "crítico"]).optional(),
  severidad: z.enum(["bajo", "medio", "alto", "crítico"]).optional(),
  accion_sugerida: z.string().max(500).optional(),
  reporte: z.string().max(1000).optional(),
  notas: z.string().max(2000).optional(),
});

export const SupervisionQuickLogSchema = z.object({
  creator_id: z.string().uuid(),
  observer_name: z.string().min(2).max(100),
  en_vivo: z.boolean(),
  score: z.number().int().min(0).max(100),
  notas: z.string().max(500).optional(),
});

export type SupervisionLog = z.infer<typeof SupervisionLogSchema>;
export type SupervisionQuickLog = z.infer<typeof SupervisionQuickLogSchema>;
