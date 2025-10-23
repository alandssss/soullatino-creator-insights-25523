-- 1. Agregar el rol 'supervisor' al enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor';

-- 2. Actualizar políticas RLS para supervision_live_logs
DROP POLICY IF EXISTS "supervision_read" ON supervision_live_logs;
CREATE POLICY "supervision_read" ON supervision_live_logs
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'viewer'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );

DROP POLICY IF EXISTS "supervision_write" ON supervision_live_logs;
CREATE POLICY "supervision_write" ON supervision_live_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );

-- 3. Actualizar política RLS para creators (agregar supervisor)
DROP POLICY IF EXISTS "Admin y Manager pueden ver creators" ON creators;
CREATE POLICY "Usuarios autorizados pueden ver creators" ON creators
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'viewer'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );

-- 4. Actualizar rol de Alan Divier a admin
UPDATE user_roles 
SET role = 'admin'::app_role
WHERE user_id = '16f16253-bd22-4626-b769-3dd8fdf098c0';

-- 5. Actualizar política de creator_interactions para supervisores
DROP POLICY IF EXISTS "Admin y Manager pueden ver interacciones" ON creator_interactions;
CREATE POLICY "Usuarios autorizados pueden ver interacciones" ON creator_interactions
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'viewer'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );

DROP POLICY IF EXISTS "Admin y Manager pueden crear interacciones" ON creator_interactions;
CREATE POLICY "Usuarios autorizados pueden crear interacciones" ON creator_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );