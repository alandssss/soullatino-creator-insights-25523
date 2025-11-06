-- Agregar campos de tracking para envío manual de batallas via wa.me
ALTER TABLE batallas
ADD COLUMN IF NOT EXISTS wa_me_enviado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wa_me_enviado_por UUID REFERENCES auth.users(id);

-- Crear índice para filtrado eficiente
CREATE INDEX IF NOT EXISTS idx_batallas_wa_me_enviado 
ON batallas(wa_me_enviado_at) 
WHERE wa_me_enviado_at IS NOT NULL;

COMMENT ON COLUMN batallas.wa_me_enviado_at IS 'Timestamp de cuando se envió la batalla manualmente via wa.me';
COMMENT ON COLUMN batallas.wa_me_enviado_por IS 'Usuario que envió la batalla manualmente';