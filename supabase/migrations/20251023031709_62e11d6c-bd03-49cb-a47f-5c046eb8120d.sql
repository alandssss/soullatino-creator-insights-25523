-- Paso 1: Agregar el rol 'supervisor' al enum app_role
-- Este debe ejecutarse en su propia transacción
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor';