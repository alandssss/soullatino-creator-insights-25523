#!/bin/bash

echo "🚀 DESPLIEGUE DE EDGE FUNCTIONS A SUPABASE"
echo "=========================================="
echo ""

# Verificar si npx está disponible
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx no está instalado. Por favor instala Node.js."
    exit 1
fi

# Cargar variables existentes
source .env.production

# Función para pedir variable si está vacía
ask_var() {
    local var_name=$1
    local var_value=$2
    local prompt=$3
    local optional=$4
    
    if [ -z "$var_value" ]; then
        if [ "$optional" == "true" ]; then
            echo "⚠️  Falta $var_name (Opcional)"
            read -p "$prompt (Enter para saltar): " input_value
        else
            echo "⚠️  Falta $var_name"
            read -p "$prompt: " input_value
        fi
        
        if [ -n "$input_value" ]; then
            # Actualizar archivo .env.production
            sed -i '' "s|$var_name=\"\"|$var_name=\"$input_value\"|" .env.production
            export $var_name="$input_value"
            echo "✅ Guardado"
        elif [ "$optional" != "true" ]; then
            echo "❌ Error: $var_name es requerido"
            exit 1
        else
            echo "⚠️  Saltando configuración de $var_name"
        fi
    else
        echo "✅ $var_name configurado"
        export $var_name="$var_value"
    fi
}

echo "📋 Verificando configuración de Airtable..."
ask_var "AIRTABLE_API_KEY" "$AIRTABLE_API_KEY" "Ingresa tu Airtable API Key (empieza con pat...)" "true"
ask_var "AIRTABLE_BASE_ID" "$AIRTABLE_BASE_ID" "Ingresa tu Base ID"
ask_var "AIRTABLE_CREATORS_TABLE_ID" "$AIRTABLE_CREATORS_TABLE_ID" "Ingresa el ID de la tabla Creators"
ask_var "AIRTABLE_DAILY_METRICS_TABLE_ID" "$AIRTABLE_DAILY_METRICS_TABLE_ID" "Ingresa el ID de la tabla Daily Metrics"

echo ""
echo "🔑 Autenticación en Supabase CLI"
echo "Necesitas iniciar sesión para desplegar funciones."
echo "Se abrirá el navegador para autenticarte."
read -p "Presiona Enter para continuar..."

npx supabase login

echo ""
echo "🚀 Desplegando funciones..."

# Lista de funciones a desplegar
FUNCTIONS=(
    "calculate-bonificaciones-unified"
    "refresh-profile-photo"
    "cron-daily-recompute"
    "upload-excel-recommendations"
)

# Solo agregar sync-to-airtable si tenemos la API Key
if [ -n "$AIRTABLE_API_KEY" ]; then
    FUNCTIONS+=("sync-to-airtable")
else
    echo "⚠️  Saltando despliegue de 'sync-to-airtable' por falta de API Key"
fi

# Recargar variables para asegurar que las tenemos todas
source .env.production

for func in "${FUNCTIONS[@]}"; do
    echo ""
    echo "Deploying $func..."
    
    # Construir string de secretos
    SECRETS="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
    
    if [ "$func" == "sync-to-airtable" ]; then
        SECRETS="$SECRETS,AIRTABLE_API_KEY=$AIRTABLE_API_KEY,AIRTABLE_BASE_ID=$AIRTABLE_BASE_ID,AIRTABLE_CREATORS_TABLE_ID=$AIRTABLE_CREATORS_TABLE_ID,AIRTABLE_DAILY_METRICS_TABLE_ID=$AIRTABLE_DAILY_METRICS_TABLE_ID"
    fi
    
    # Establecer secretos primero
    echo "  Configurando secretos..."
    npx supabase secrets set $SECRETS --project-ref fhboambxnmswtxalllnn
    
    # Desplegar función
    echo "  Subiendo código..."
    npx supabase functions deploy $func --project-ref fhboambxnmswtxalllnn --no-verify-jwt
    
    echo "✅ $func desplegada exitosamente"
done

echo ""
echo "🎉 ¡Despliegue completado!"
if [ -z "$AIRTABLE_API_KEY" ]; then
    echo "⚠️  Nota: La función de sincronización con Airtable NO se desplegó."
    echo "   Cuando tengas la API Key, agrégala a .env.production y ejecuta este script nuevamente."
fi
