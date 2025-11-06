# Sistema Manual de Notificaciones WhatsApp (wa.me)

## Descripción General

Sistema de notificación manual para batallas mediante enlaces `wa.me`, reemplazando la integración automática de Twilio. Los usuarios pueden seleccionar batallas y enviarlas manualmente con plantillas personalizables.

---

## Componente Principal

**Ubicación**: `src/components/batallas/EnviarBatallasWaMe.tsx`

### Características

✅ **Plantillas de mensajes personalizables:**
- **Formal**: Tono profesional para notificaciones oficiales
- **Motivacional**: Mensajes energéticos para inspirar
- **Urgente**: Para batallas próximas o cambios importantes
- **Simple**: Mensaje básico con información esencial

✅ **Filtros de batallas:**
- Todas las batallas
- Solo enviadas (con historial)
- Pendientes de enviar

✅ **Tracking de envíos:**
- Fecha y hora de envío (`wa_me_enviado_at`)
- Usuario que envió (`wa_me_enviado_por`)
- Visual badge de "Enviada" en tabla

✅ **Funcionalidad:**
- Selección múltiple de batallas
- Generación automática de enlaces `wa.me`
- Apertura en nueva pestaña del navegador
- Marcado automático como enviada

---

## Campos de Base de Datos

### Tabla: `batallas`

```sql
wa_me_enviado_at TIMESTAMPTZ     -- Timestamp de envío manual
wa_me_enviado_por UUID            -- Usuario que envió (FK auth.users)
```

**Índice creado:**
```sql
CREATE INDEX idx_batallas_wa_me_enviado 
ON batallas(wa_me_enviado_at) 
WHERE wa_me_enviado_at IS NOT NULL;
```

---

## Flujo de Uso

### 1. Acceder al Panel
Navegar a **Batallas** → Panel de "Enviar Batallas por WhatsApp"

### 2. Configurar Envío
- Seleccionar **plantilla de mensaje** (Formal, Motivacional, Urgente, Simple)
- Aplicar **filtros** (Todas, Enviadas, Pendientes)

### 3. Seleccionar Batallas
- Usar checkboxes para seleccionar batallas específicas
- Ver detalles: creador, fecha, hora, oponente, tipo
- Verificar si tiene teléfono registrado

### 4. Enviar
- Click en "Enviar Seleccionadas"
- Se abren pestañas `wa.me` automáticamente
- Sistema marca batallas como enviadas

### 5. Tracking
- Ver badge "Enviada" en batallas procesadas
- Filtrar por historial de envíos
- Revisar fecha/hora de último envío

---

## Ejemplo de Mensaje Generado

### Plantilla Formal
```
🎯 *Batalla Programada*

Hola {nombre},

Confirmo tu batalla próxima:
📅 Fecha: {fecha}
⏰ Hora: {hora}
🥊 Oponente: {oponente}
🥊 Guantes: {guantes}
💎 Reto: {reto}

Por favor confirma tu asistencia.

Saludos,
Soullatino Team
```

### Plantilla Motivacional
```
🔥 *¡PREPÁRATE PARA LA BATALLA!* 🔥

¡Hola {nombre}! 💪

Tu momento de brillar está cerca:
📅 {fecha} a las {hora}
🎯 Contra: {oponente}
💎 {guantes} | {reto}

¡A DARLO TODO! 🚀✨
```

---

## Ventajas del Sistema Manual

✅ **Control Total**: Decides cuándo enviar mensajes
✅ **Sin Costos de API**: No requiere cuenta Twilio
✅ **Personalización**: Plantillas ajustables al contexto
✅ **Transparencia**: Tracking completo de envíos
✅ **Flexibilidad**: Puedes revisar antes de enviar
✅ **Sin Bloqueos**: No hay restricciones de API

---

## Migración desde Twilio

### ✅ Eliminado
- ❌ Triggers automáticos de batallas
- ❌ Edge functions de Twilio (`battle-created`, `send-batalla`, `whatsapp-webhook`, `process-battle-queue`, `send-optin-masivo`)
- ❌ Tablas: `battle_queue`, `logs_whatsapp`, `whatsapp_activity`
- ❌ Vistas: `v_battle_queue_monitor`, `v_batallas_pendientes_notificacion`
- ❌ Funciones: `trg_batallas_created_notify()`, `trg_enqueue_battle()`

### ✅ Mantenido
- ✅ Tabla `batallas` (con nuevos campos de tracking)
- ✅ Sistema manual `EnviarBatallasWaMe`
- ✅ Portal del creador (lectura de batallas)

---

## Próximos Pasos Sugeridos

1. **Preview de mensajes**: Visualizar mensaje antes de enviar
2. **Plantillas personalizadas**: Crear y guardar templates propios
3. **Recordatorios**: Sistema de alertas 24h y 2h antes
4. **Reportes**: Exportar historial de envíos con analytics
5. **Bulk actions**: Enviar a múltiples creadores con un click

---

## Soporte

Para cualquier duda sobre el sistema manual de notificaciones, contacta al equipo técnico.

**Última actualización**: 2025-11-06
