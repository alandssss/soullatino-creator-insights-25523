-- Migración: Limpieza de IDs numéricos en campos de nombre
-- Esta migración corrige datos donde el campo nombre/tiktok_username contiene IDs numéricos largos

-- Actualizar creators donde tiktok_username es un ID numérico largo (>= 10 dígitos)
-- Lo marcamos como 'username_invalido_[id]' para identificarlo fácilmente
UPDATE public.creators
SET 
  tiktok_username = 'ID_' || substring(tiktok_username from 1 for 8),
  nombre = CASE 
    WHEN nombre ~ '^\d{10,}$' THEN 'ID_' || substring(nombre from 1 for 8)
    ELSE nombre
  END
WHERE tiktok_username ~ '^\d{10,}$';

-- Comentario explicativo
COMMENT ON COLUMN public.creators.tiktok_username IS 
'Username de TikTok del creador. Debe ser un username válido (ej: @usuario), no un ID numérico. IDs numéricos se marcan como ID_XXXXXXXX para corrección manual.';

-- Log de cambios realizados
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.creators
  WHERE tiktok_username LIKE 'ID_%';
  
  RAISE NOTICE 'Migración completada. % creadores actualizados con IDs numéricos convertidos a ID_XXXXXXXX', updated_count;
  RAISE NOTICE 'Acción requerida: Actualizar estos creadores con sus usernames reales de TikTok';
END $$;