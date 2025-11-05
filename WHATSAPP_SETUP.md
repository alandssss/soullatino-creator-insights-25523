# 📱 Soullatino WhatsApp Integration - Setup Completo

## ✅ Componentes Implementados

### 1. Base de Datos
- ✅ `battle_queue` - Cola de envíos WhatsApp
- ✅ `logs_whatsapp` - Registro de mensajes enviados
- ✅ Trigger automático para encolar batallas `programada`
- ✅ Vista de monitoreo `v_battle_queue_monitor`

### 2. Edge Functions
- ✅ `whatsapp-webhook` - Recibe mensajes inbound de Twilio
- ✅ `send-batalla` - Envía notificación de batalla individual
- ✅ `process-battle-queue` - Procesador CRON de cola
- ✅ `rapid-endpoint` - Endpoint de pruebas

---

## 🔑 Configuración de Secrets

### Paso 1: Configurar Secrets en Supabase

```bash
# URL y Service Key (ya deben estar configurados)
supabase secrets set SUPABASE_URL="https://mpseoscrzpnequwvzokn.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<tu-service-role-key>"

# Twilio (IMPORTANTE: configurar estos)
supabase secrets set TWILIO_ACCOUNT_SID="<tu-account-sid>"
supabase secrets set TWILIO_AUTH_TOKEN="<tu-auth-token>"
supabase secrets set TWILIO_WHATSAPP_FROM="whatsapp:+17792094503"
# Alias alternativo
supabase secrets set TWILIO_WHATSAPP_NUMBER="whatsapp:+17792094503"

# Timezone
supabase secrets set TIMEZONE="America/Chihuahua"
```

**Dónde obtener las credenciales de Twilio:**
1. Ir a https://console.twilio.com
2. Account SID y Auth Token: Dashboard principal
3. WhatsApp Number: Messaging → Try it out → WhatsApp

---

## 📞 Configuración en Twilio Console

### Paso 2: Configurar Webhook en Twilio

1. Ir a **Messaging** → **Try it out** → **WhatsApp**
2. En **Sandbox Settings** o tu número oficial:
   - **When a message comes in:**
     ```
     https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/whatsapp-webhook
     ```
     Método: `POST`
   
   - **Status callback URL** (opcional):
     ```
     https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/whatsapp-webhook
     ```

3. Guardar configuración

---

## 🧪 Pruebas

### Test 1: Webhook Inbound (simular Twilio)

```bash
# Test comando "ayuda"
curl -X POST "https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/whatsapp-webhook" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=whatsapp:+5216147531946" \
  --data-urlencode "Body=ayuda" -i

# Debe responder TwiML con el menú de comandos
```

### Test 2: Crear Batalla y Encolar

```sql
-- En Supabase SQL Editor
INSERT INTO batallas (
  creator_id,
  fecha,
  hora,
  estado,
  oponente,
  tipo
)
VALUES (
  (SELECT id FROM creators WHERE telefono = '+5216147531946' LIMIT 1),
  CURRENT_DATE + INTERVAL '7 days',
  '21:00:00',
  'programada',
  'TestOponente',
  'PK'
);

-- Verificar que se encoló
SELECT * FROM v_battle_queue_monitor WHERE status = 'pending';
```

### Test 3: Enviar Batalla Manualmente

```bash
# Reemplazar <BATALLA_UUID> y <SERVICE_ROLE_KEY>
curl -X POST "https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/send-batalla" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"batallaId":"<BATALLA_UUID>"}' -i

# Debe responder { "success": true, "message_sid": "SM..." }
```

### Test 4: Procesar Cola (Manual)

```bash
curl -X POST "https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/process-battle-queue" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" -i

# Debe procesar batallas pending y responder con resumen
```

### Test 5: Verificar Logs

```sql
-- Ver últimos mensajes enviados
SELECT * FROM logs_whatsapp ORDER BY created_at DESC LIMIT 10;

-- Ver estado de cola
SELECT 
  status,
  COUNT(*) as cantidad,
  AVG(intentos) as intentos_promedio
FROM battle_queue
GROUP BY status;

-- Ver batallas sin notificar
SELECT * FROM v_battle_queue_monitor 
WHERE notificacion_enviada = false
LIMIT 10;
```

---

## ⏰ Configurar CRON para Procesador Automático

### Opción A: Usar pg_cron (Recomendado)

```sql
-- Habilitar extensiones (si no están)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Programar ejecución cada 5 minutos
SELECT cron.schedule(
  'process-battle-queue-5min',
  '*/5 * * * *', -- Cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/process-battle-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Ver jobs programados
SELECT * FROM cron.job;

-- Desactivar (si necesitas)
SELECT cron.unschedule('process-battle-queue-5min');
```

### Opción B: Usar Supabase Scheduler (UI)

1. Ir a **Database** → **Cron Jobs**
2. Crear nuevo job:
   - **Name:** Process Battle Queue
   - **Schedule:** `*/5 * * * *` (cada 5 min)
   - **Command:**
     ```sql
     SELECT net.http_post(
       url := 'https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/process-battle-queue',
       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
     );
     ```

---

## 📋 Comandos WhatsApp Disponibles

Los creadores pueden enviar estos mensajes al número de WhatsApp:

| Comando | Respuesta |
|---------|-----------|
| `hola` | Mensaje de bienvenida |
| `ayuda` | Menú de comandos |
| `batalla` | Próxima batalla programada |
| `consultar batallas` o `batallas` | Lista de próximas 3 batallas |
| `quiero una batalla` | Registra solicitud para manager |

---

## 🔍 Monitoreo y Troubleshooting

### Ver estado del sistema

```sql
-- KPIs de notificaciones (últimos 7 días)
SELECT 
  COUNT(*) FILTER (WHERE status = 'sent') as enviadas,
  COUNT(*) FILTER (WHERE status = 'failed') as fallidas,
  COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::NUMERIC * 100 / 
    NULLIF(COUNT(*), 0), 2
  ) as tasa_exito_pct
FROM battle_queue
WHERE enqueued_at > NOW() - INTERVAL '7 days';

-- Creadores sin teléfono
SELECT COUNT(*) as total_sin_telefono
FROM creators 
WHERE status = 'activo' 
  AND (telefono IS NULL OR telefono = '');

-- Ver creadores sin teléfono
SELECT * FROM v_creators_sin_telefono LIMIT 20;
```

### Problemas comunes

**❌ No llega WhatsApp al creador:**
1. Verificar que `creators.telefono` está en formato `+52XXXXXXXXXX`
2. Ver logs: `SELECT * FROM logs_whatsapp WHERE batalla_id = '<id>' ORDER BY created_at DESC`
3. Verificar secrets Twilio están configurados
4. Revisar logs de edge function: Supabase → Functions → send-batalla → Logs

**❌ Cola no se procesa:**
1. Verificar CRON está activo: `SELECT * FROM cron.job`
2. Ejecutar manualmente: `curl ... process-battle-queue`
3. Ver errores en `battle_queue.last_error`

**❌ Trigger no encola batallas:**
1. Verificar estado es exactamente `'programada'`
2. Ver si trigger existe: `SELECT * FROM pg_trigger WHERE tgrelid = 'batallas'::regclass`
3. Verificar logs PostgreSQL en Supabase → Database → Logs

---

## 📝 Formato de Teléfonos

**Formato requerido en `creators.telefono`:**
- México: `+5216147531946` (código país + 10 dígitos)
- Colombia: `+573001234567`
- Venezuela: `+584121234567`

**Actualización masiva:**
```sql
-- Corregir formato (ejemplo México)
UPDATE creators
SET telefono = '+52' || REGEXP_REPLACE(telefono, '\D', '', 'g')
WHERE telefono ~ '^\d{10}$' AND status = 'activo';
```

---

## 🎯 Mensajes Finales Utilizados

Todos los mensajes usan el formato definido en el prompt original:
- Tono profesional y claro
- Emojis estratégicos
- Firma: "— Agencia Soullatino"
- Sin "grinding" ni anglicismos

Ver código fuente en `whatsapp-webhook/index.ts` para textos exactos.

---

## 🚀 Próximos Pasos

1. ✅ Configurar todos los secrets
2. ✅ Configurar webhook en Twilio
3. ✅ Cargar teléfonos de creadores activos
4. ✅ Ejecutar pruebas end-to-end
5. ✅ Activar CRON para procesamiento automático
6. 📊 Monitorear logs primeras 48 horas
7. 🔒 Opcional: Agregar validación de firma Twilio en `whatsapp-webhook`

---

## 📞 Soporte

Para issues:
1. Revisar logs en Supabase → Functions → [nombre-función] → Logs
2. Revisar `logs_whatsapp` table
3. Revisar `battle_queue` con `last_error`
