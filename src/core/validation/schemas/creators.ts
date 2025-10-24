import { z } from "zod";

// Regex patterns para validación
const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
const usernameRegex = /^[a-zA-Z0-9_\.]{1,30}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CreatorCreateSchema = z.object({
  nombre: z.string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(100, "Nombre muy largo")
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, "Nombre solo puede contener letras"),
  telefono: z.string()
    .regex(phoneRegex, "Formato de teléfono inválido (usar formato internacional)")
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
  manager: z.string().max(100).optional(),
  agente: z.string().max(100).optional(),
  grupo: z.string().max(100).optional(),
  categoria: z.string().max(50).optional(),
  graduacion: z.enum(["50K", "100K", "300K", "500K", "1M"]).optional(),
  status: z.enum(["activo", "inactivo", "pausado"]).default("activo"),
});

export const CreatorUpdateSchema = CreatorCreateSchema.partial();

export const CreatorPhoneUpdateSchema = z.object({
  creator_id: z.string().uuid(),
  telefono: z.string()
    .regex(phoneRegex, "Formato de teléfono inválido (usar formato internacional)"),
});

export type CreatorCreate = z.infer<typeof CreatorCreateSchema>;
export type CreatorUpdate = z.infer<typeof CreatorUpdateSchema>;
export type CreatorPhoneUpdate = z.infer<typeof CreatorPhoneUpdateSchema>;
