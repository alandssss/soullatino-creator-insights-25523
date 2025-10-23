-- Paso 1: Agregar rol 'reclutador' al enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reclutador';