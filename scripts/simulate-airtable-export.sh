#!/bin/bash

# ================================================================
# Script de Prueba: Simulación de Exportación a Airtable
# Muestra qué datos se exportarían sin hacer la exportación real
# ================================================================

set -e

echo "=================================================="
echo "🧪 Simulación de Exportación a Airtable"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ================================================================
# Configuración
# ================================================================
SUPABASE_URL="${SUPABASE_URL:-https://mpseoscrzpnequwvzokn.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8}"

TARGET_DATE="2025-11-26"

echo -e "\n${BLUE}📅 Fecha objetivo:${NC} $TARGET_DATE"
echo -e "${BLUE}🔗 Supabase URL:${NC} $SUPABASE_URL"

# ================================================================
# 1. Consultar datos de creator_daily_stats para el 26 de nov
# ================================================================
echo -e "\n${YELLOW}[1/3]${NC} Consultando datos de Supabase..."

response=$(curl -s "${SUPABASE_URL}/rest/v1/creator_daily_stats?fecha=eq.${TARGET_DATE}&select=*,creators(creator_id,nombre,email,estado_graduacion,meta_dias_mes,meta_horas_mes)" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

# Verificar si hay datos
record_count=$(echo "$response" | jq '. | length' 2>/dev/null || echo "0")

if [ "$record_count" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No se encontraron datos para ${TARGET_DATE}${NC}"
    echo ""
    echo "Verificando fechas disponibles en los últimos 7 días..."
    
    # Buscar fechas disponibles
    for i in {0..7}; do
        test_date=$(date -v-${i}d +%Y-%m-%d 2>/dev/null || date -d "${i} days ago" +%Y-%m-%d)
        count=$(curl -s "${SUPABASE_URL}/rest/v1/creator_daily_stats?fecha=eq.${test_date}&select=id" \
          -H "apikey: ${SUPABASE_ANON_KEY}" \
          -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" | jq '. | length' 2>/dev/null || echo "0")
        
        if [ "$count" -gt 0 ]; then
            echo "  ✅ $test_date: $count registros"
        fi
    done
    
    exit 0
fi

echo -e "${GREEN}✅ Encontrados ${record_count} registros${NC}"

# ================================================================
# 2. Transformar datos al formato Airtable
# ================================================================
echo -e "\n${YELLOW}[2/3]${NC} Transformando datos al formato Airtable..."

echo "$response" | jq -r '
  .[] | 
  {
    creator_id: (.creators.creator_id // "unknown"),
    username: (.creators.nombre // "Sin nombre"),
    email: (.creators.email // null),
    nivel_actual: (.creators.estado_graduacion // null),
    meta_dias_mes: (.creators.meta_dias_mes // 22),
    meta_horas_mes: (.creators.meta_horas_mes // 80),
    fecha: .fecha,
    diamonds_dia: (.diamantes // 0),
    live_hours_dia: (.duracion_live_horas // 0),
    new_followers_dia: (.nuevos_seguidores // 0),
    hizo_live: (if (.emisiones_live // 0) > 0 then 1 else 0 end)
  }
' > /tmp/airtable_export_preview.json

echo -e "${GREEN}✅ Datos transformados${NC}"

# ================================================================
# 3. Mostrar preview de los datos
# ================================================================
echo -e "\n${YELLOW}[3/3]${NC} Preview de datos a exportar..."
echo ""
echo "=================================================="
echo "📊 DATOS QUE SE EXPORTARÍAN A AIRTABLE"
echo "=================================================="

# Mostrar primeros 5 registros
echo ""
echo "Primeros 5 registros:"
echo ""
cat /tmp/airtable_export_preview.json | jq -r '
  "Creator ID: \(.creator_id)",
  "Username: \(.username)",
  "Email: \(.email // "N/A")",
  "Nivel: \(.nivel_actual // "N/A")",
  "Fecha: \(.fecha)",
  "Diamonds: \(.diamonds_dia)",
  "Live Hours: \(.live_hours_dia)",
  "New Followers: \(.new_followers_dia)",
  "Hizo Live: \(.hizo_live)",
  "---"
' | head -50

# ================================================================
# Resumen estadístico
# ================================================================
echo ""
echo "=================================================="
echo "📈 RESUMEN ESTADÍSTICO"
echo "=================================================="

total_creators=$(cat /tmp/airtable_export_preview.json | jq '. | length')
total_diamonds=$(cat /tmp/airtable_export_preview.json | jq '[.[].diamonds_dia] | add')
total_hours=$(cat /tmp/airtable_export_preview.json | jq '[.[].live_hours_dia] | add')
total_followers=$(cat /tmp/airtable_export_preview.json | jq '[.[].new_followers_dia] | add')
creators_with_live=$(cat /tmp/airtable_export_preview.json | jq '[.[].hizo_live] | add')
creators_with_email=$(cat /tmp/airtable_export_preview.json | jq '[.[] | select(.email != null)] | length')

echo "Total Creadores: $total_creators"
echo "Total Diamonds: $total_diamonds"
echo "Total Horas Live: $total_hours"
echo "Total Nuevos Seguidores: $total_followers"
echo "Creadores que hicieron live: $creators_with_live"
echo "Creadores con email: $creators_with_email"

# ================================================================
# Formato Airtable
# ================================================================
echo ""
echo "=================================================="
echo "📋 FORMATO PARA AIRTABLE"
echo "=================================================="
echo ""
echo "Tabla: Creadores"
echo "Campos: creator_id, username, email, nivel_actual, meta_dias_mes, meta_horas_mes"
echo ""
echo "Tabla: DailyMetrics"
echo "Campos: creator (linked), fecha, diamonds_dia, live_hours_dia, new_followers_dia, hizo_live"
echo ""

# ================================================================
# Guardar archivo completo
# ================================================================
output_file="airtable_export_${TARGET_DATE}.json"
cp /tmp/airtable_export_preview.json "$output_file"

echo "=================================================="
echo -e "${GREEN}✅ Simulación Completa${NC}"
echo "=================================================="
echo ""
echo "📁 Archivo generado: $output_file"
echo ""
echo "Para exportar realmente a Airtable:"
echo "1. Configura las variables de entorno (AIRTABLE_API_KEY, etc.)"
echo "2. Ejecuta: ./scripts/test-airtable-sync.sh"
echo ""
