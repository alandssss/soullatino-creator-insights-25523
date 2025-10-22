-- Crear tabla principal de creadores
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  grupo TEXT,
  agente TEXT,
  fecha_incorporacion TIMESTAMPTZ,
  dias_desde_incorporacion INTEGER,
  estado_graduacion TEXT,
  base_diamantes_antes_union NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de estadísticas diarias
CREATE TABLE IF NOT EXISTS public.creator_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  diamantes NUMERIC DEFAULT 0,
  duracion_live_horas NUMERIC DEFAULT 0,
  dias_validos_live INTEGER DEFAULT 0,
  nuevos_seguidores INTEGER DEFAULT 0,
  emisiones_live INTEGER DEFAULT 0,
  partidas INTEGER DEFAULT 0,
  diamantes_partidas NUMERIC DEFAULT 0,
  ingresos_suscripciones NUMERIC DEFAULT 0,
  suscripciones_compradas INTEGER DEFAULT 0,
  suscriptores INTEGER DEFAULT 0,
  diamantes_modo_varios NUMERIC DEFAULT 0,
  diamantes_varios_anfitrion NUMERIC DEFAULT 0,
  diamantes_varios_invitado NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, fecha)
);

-- Crear tabla de métricas mensuales
CREATE TABLE IF NOT EXISTS public.creator_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  diamantes_mes NUMERIC DEFAULT 0,
  duracion_live_horas_mes NUMERIC DEFAULT 0,
  dias_validos_live_mes INTEGER DEFAULT 0,
  nuevos_seguidores_mes INTEGER DEFAULT 0,
  emisiones_live_mes INTEGER DEFAULT 0,
  porcentaje_diamantes NUMERIC DEFAULT 0,
  porcentaje_duracion_live NUMERIC DEFAULT 0,
  porcentaje_dias_validos NUMERIC DEFAULT 0,
  porcentaje_seguidores NUMERIC DEFAULT 0,
  porcentaje_emisiones NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, mes_referencia)
);

-- Habilitar RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_monthly_stats ENABLE ROW LEVEL SECURITY;

-- Crear tipo de rol
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas RLS para creators (admin y manager pueden ver/editar)
CREATE POLICY "Admin y Manager pueden ver creators"
ON public.creators FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admin y Manager pueden insertar creators"
ON public.creators FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admin y Manager pueden actualizar creators"
ON public.creators FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Políticas para daily stats
CREATE POLICY "Admin y Manager pueden ver daily stats"
ON public.creator_daily_stats FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admin y Manager pueden insertar daily stats"
ON public.creator_daily_stats FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Políticas para monthly stats
CREATE POLICY "Admin y Manager pueden ver monthly stats"
ON public.creator_monthly_stats FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admin y Manager pueden insertar monthly stats"
ON public.creator_monthly_stats FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Políticas para user_roles
CREATE POLICY "Usuarios pueden ver su propio rol"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admin puede gestionar roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_creators_creator_id ON public.creators(creator_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_creator_fecha ON public.creator_daily_stats(creator_id, fecha);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_creator_mes ON public.creator_monthly_stats(creator_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_stats_updated_at
  BEFORE UPDATE ON public.creator_monthly_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();