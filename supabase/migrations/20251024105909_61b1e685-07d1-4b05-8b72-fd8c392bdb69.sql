-- FASE 3: White-Label / Custom Branding
-- Tabla de configuración de branding por tenant
CREATE TABLE IF NOT EXISTS public.tenant_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  product_name text DEFAULT 'Soullatino Analytics',
  logo_url text,
  primary_color text DEFAULT '211 75% 59%',
  accent_color text DEFAULT '211 80% 64%',
  secondary_color text DEFAULT '119 38% 66%',
  custom_domain text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- RLS
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_branding_read"
  ON public.tenant_branding FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tenant_branding_write"
  ON public.tenant_branding FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_tenant_branding_updated_at
  BEFORE UPDATE ON public.tenant_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- FASE 4: Feedback Loop Inteligente (IA)
-- Extender creator_recommendations para tracking
ALTER TABLE public.creator_recommendations
  ADD COLUMN IF NOT EXISTS seguida_por_manager boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fecha_seguimiento timestamptz,
  ADD COLUMN IF NOT EXISTS resultado_creador text,
  ADD COLUMN IF NOT EXISTS diam_antes_recomendacion numeric,
  ADD COLUMN IF NOT EXISTS diam_despues_recomendacion numeric,
  ADD COLUMN IF NOT EXISTS lift_percentage numeric;

-- Función para calcular lift automáticamente
CREATE OR REPLACE FUNCTION calculate_recommendation_lift()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.diam_despues_recomendacion IS NOT NULL AND NEW.diam_antes_recomendacion IS NOT NULL THEN
    NEW.lift_percentage := ((NEW.diam_despues_recomendacion - NEW.diam_antes_recomendacion) 
                            / NULLIF(NEW.diam_antes_recomendacion, 0)) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_calculate_lift
  BEFORE INSERT OR UPDATE ON public.creator_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_recommendation_lift();

-- Vista para análisis de efectividad de IA
CREATE OR REPLACE VIEW public.v_ia_effectiveness AS
SELECT
  DATE_TRUNC('month', fecha_creacion) AS mes,
  COUNT(*) FILTER (WHERE seguida_por_manager = true) AS recomendaciones_seguidas,
  COUNT(*) FILTER (WHERE seguida_por_manager = false) AS recomendaciones_ignoradas,
  AVG(lift_percentage) FILTER (WHERE seguida_por_manager = true) AS lift_promedio_seguidas,
  AVG(lift_percentage) FILTER (WHERE seguida_por_manager = false OR seguida_por_manager IS NULL) AS lift_promedio_no_seguidas
FROM public.creator_recommendations
WHERE fecha_creacion >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
GROUP BY 1
ORDER BY 1 DESC;

-- FASE 6: Scoring Customizable
-- Tabla de pesos del scoring por tenant
CREATE TABLE IF NOT EXISTS public.scoring_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  peso_dias_en_agencia numeric DEFAULT 1.5,
  umbral_dias_nuevos int DEFAULT 90,
  umbral_verde_multiplicador numeric DEFAULT 1.15,
  umbral_amarillo_multiplicador numeric DEFAULT 0.85,
  bono_por_dia_extra numeric DEFAULT 3,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Insertar valores por defecto
INSERT INTO public.scoring_weights (tenant_id, peso_dias_en_agencia)
VALUES ('00000000-0000-0000-0000-000000000000', 1.5)
ON CONFLICT (tenant_id) DO NOTHING;

-- RLS
ALTER TABLE public.scoring_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_weights_read"
  ON public.scoring_weights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "scoring_weights_write"
  ON public.scoring_weights FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_scoring_weights_updated_at
  BEFORE UPDATE ON public.scoring_weights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();