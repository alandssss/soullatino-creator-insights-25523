import { z } from "zod";

// Schema para validación de filas de Excel (creator_daily_stats)
export const ExcelRowSchema = z.object({
  creator_id: z.string().uuid("ID de creador inválido"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  diamantes: z.number().int().min(0, "Diamantes no puede ser negativo").max(10_000_000, "Valor de diamantes excesivo"),
  duracion_live_horas: z.number().min(0, "Horas no puede ser negativo").max(24, "Máximo 24 horas por día"),
  dias_validos_live: z.number().int().min(0).max(31),
  nuevos_seguidores: z.number().int().min(0, "Seguidores no puede ser negativo"),
  emisiones_live: z.number().int().min(0).optional(),
  partidas: z.number().int().min(0).optional(),
});

// Schema para validación de filas de Excel (creator_live_daily)
export const ExcelLiveDailyRowSchema = z.object({
  creator_id: z.string().uuid("ID de creador inválido"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  diamantes: z.number().min(0, "Diamantes no puede ser negativo").max(10_000_000),
  horas: z.number().min(0, "Horas no puede ser negativo").max(24),
});

export const ExcelPayloadSchema = z
  .array(ExcelRowSchema)
  .min(1, "Debe haber al menos 1 fila")
  .max(500, "Máximo 500 filas por carga para prevenir timeouts");

export const ExcelLiveDailyPayloadSchema = z
  .array(ExcelLiveDailyRowSchema)
  .min(1, "Debe haber al menos 1 fila")
  .max(500, "Máximo 500 filas por carga");

export type ExcelRow = z.infer<typeof ExcelRowSchema>;
export type ExcelLiveDailyRow = z.infer<typeof ExcelLiveDailyRowSchema>;
export type ExcelPayload = z.infer<typeof ExcelPayloadSchema>;
