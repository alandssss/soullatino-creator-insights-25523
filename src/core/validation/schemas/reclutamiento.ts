import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const usernameRegex = /^[a-zA-Z0-9_\.]{1,30}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ProspectoCreateSchema = z.object({
  nombre: z.string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(100, "Nombre muy largo"),
  telefono: z.string()
    .regex(phoneRegex, "Formato de teléfono inválido")
    .optional(),
  email: z.string()
    .regex(emailRegex, "Email inválido")
    .max(100)
    .optional(),
  tiktok_username: z.string()
    .regex(usernameRegex, "Username de TikTok inválido")
    .max(30)
    .optional(),
  instagram: z.string()
    .regex(usernameRegex, "Username de Instagram inválido")
    .max(30)
    .optional(),
  estado: z.enum([
    "contactado",
    "interesado",
    "en_negociacion",
    "aceptado",
    "rechazado",
    "sin_respuesta"
  ]).default("contactado"),
  agente_asignado: z.string().max(100).optional(),
  diamantes_estimados: z.number().min(0).max(10_000_000).optional(),
  seguidores_estimados: z.number().int().min(0).max(100_000_000).optional(),
  notas: z.string().max(2000).optional(),
});

export const ProspectoUpdateSchema = ProspectoCreateSchema.partial();

export type ProspectoCreate = z.infer<typeof ProspectoCreateSchema>;
export type ProspectoUpdate = z.infer<typeof ProspectoUpdateSchema>;
