
-- Reconstruct Schema based on types.ts

-- 1. Creators Table
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT, -- External ID
    nombre TEXT NOT NULL,
    tiktok_username TEXT,
    manager TEXT,
    graduacion TEXT,
    estado_graduacion TEXT,
    categoria TEXT,
    grupo TEXT,
    status TEXT,
    telefono TEXT,
    email TEXT,
    instagram TEXT,
    agente TEXT,
    
    -- Metrics
    diamantes NUMERIC DEFAULT 0,
    horas_live NUMERIC DEFAULT 0,
    dias_live INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagement_rate NUMERIC DEFAULT 0,
    live_streams INTEGER DEFAULT 0,
    
    -- Historical / Snapshot
    last_month_diamantes NUMERIC,
    last_month_views NUMERIC,
    last_month_engagement NUMERIC,
    base_diamantes_antes_union NUMERIC,
    hito_diamantes NUMERIC,
    
    -- Dates
    fecha_ingreso TIMESTAMP WITH TIME ZONE,
    fecha_incorporacion TIMESTAMP WITH TIME ZONE,
    dias_en_agencia INTEGER,
    dias_desde_inicio INTEGER,
    dias_desde_incorporacion INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_creators_tiktok_username ON public.creators(tiktok_username);
CREATE INDEX IF NOT EXISTS idx_creators_manager ON public.creators(manager);

-- 2. Creator Daily Stats
CREATE TABLE IF NOT EXISTS public.creator_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    
    diamantes NUMERIC DEFAULT 0,
    duracion_live_horas NUMERIC DEFAULT 0,
    emisiones_live INTEGER DEFAULT 0,
    nuevos_seguidores INTEGER DEFAULT 0,
    
    -- Detailed breakdown
    diamantes_partidas NUMERIC DEFAULT 0,
    diamantes_modo_varios NUMERIC DEFAULT 0,
    diamantes_varios_anfitrion NUMERIC DEFAULT 0,
    diamantes_varios_invitado NUMERIC DEFAULT 0,
    partidas INTEGER DEFAULT 0,
    
    -- Subscriptions
    ingresos_suscripciones NUMERIC DEFAULT 0,
    suscripciones_compradas INTEGER DEFAULT 0,
    suscriptores INTEGER DEFAULT 0,
    
    -- Validation
    dias_validos_live INTEGER DEFAULT 0, -- 0 or 1 usually
    
    -- Metadata
    creator_username TEXT,
    phone_e164 TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_creator_fecha ON public.creator_daily_stats(creator_id, fecha);

-- 3. Creator Bonificaciones
CREATE TABLE IF NOT EXISTS public.creator_bonificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
    mes_referencia DATE NOT NULL, -- First day of month
    
    -- Calculated Metrics
    diam_live_mes NUMERIC DEFAULT 0,
    horas_live_mes NUMERIC DEFAULT 0,
    dias_live_mes INTEGER DEFAULT 0,
    
    -- Projections
    dias_restantes INTEGER,
    req_diam_por_dia NUMERIC,
    req_horas_por_dia NUMERIC,
    
    -- Milestones / Goals
    meta_recomendada TEXT,
    cerca_de_objetivo BOOLEAN,
    
    -- Status flags
    es_nuevo_menos_90_dias BOOLEAN,
    es_prioridad_300k BOOLEAN,
    
    -- Graduation Status (Booleans)
    grad_50k BOOLEAN,
    grad_100k BOOLEAN,
    grad_300k BOOLEAN,
    grad_500k BOOLEAN,
    grad_1m BOOLEAN,
    
    -- Semaphores (Colors)
    semaforo_50k TEXT,
    semaforo_100k TEXT,
    semaforo_300k TEXT,
    semaforo_500k TEXT,
    semaforo_1m TEXT,
    
    -- Missing amounts
    faltan_50k NUMERIC,
    faltan_100k NUMERIC,
    faltan_300k NUMERIC,
    faltan_500k NUMERIC,
    faltan_1m NUMERIC,
    
    -- Estimated dates
    fecha_estimada_50k DATE,
    fecha_estimada_100k DATE,
    fecha_estimada_300k DATE,
    fecha_estimada_500k DATE,
    fecha_estimada_1m DATE,
    
    -- Bonuses
    bono_extra_usd NUMERIC,
    bono_dias_extra_usd NUMERIC,
    
    -- Generated Texts
    texto_creador TEXT,
    texto_manager TEXT,
    
    fecha_calculo TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bonificaciones_creator_mes ON public.creator_bonificaciones(creator_id, mes_referencia);

-- 4. User Roles (for Admin access)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_bonificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Open for now to unblock, or restricted?)
-- Let's make them permissible for authenticated users for now to avoid issues
CREATE POLICY "Enable read access for all users" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.creator_daily_stats FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.creator_bonificaciones FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.user_roles FOR SELECT USING (true);

-- Allow admins to write (simplified)
-- Note: This requires the user to have the admin role in user_roles, which we just created.
-- But to insert the FIRST admin, we need a policy that allows it or use service_role.
-- Service role bypasses RLS, so it's fine.

