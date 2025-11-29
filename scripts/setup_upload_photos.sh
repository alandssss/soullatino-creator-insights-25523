#!/bin/bash

# Script de configuración para subir fotos de perfil a Supabase

echo "🔧 CONFIGURACIÓN DE SUBIDA DE FOTOS A SUPABASE"
echo "=============================================="
echo ""

# Verificar que estamos en el directorio correcto
cd /Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523

# Verificar archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encuentra el archivo .env"
    exit 1
fi

echo "✅ Archivo .env encontrado"
echo ""

# Verificar si existe SUPABASE_SERVICE_ROLE_KEY
if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY ya está configurada"
else
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY no encontrada"
    echo ""
    echo "📋 INSTRUCCIONES:"
    echo "1. Ve a: https://supabase.com/dashboard/project/fhboambxnmswtxalllnn/settings/api"
    echo "2. Copia la 'service_role' key (NO la 'anon' key)"
    echo "3. Pégala aquí cuando se te solicite"
    echo ""
    read -p "Pega tu Service Role Key: " service_key
    
    if [ -z "$service_key" ]; then
        echo "❌ No se proporcionó ninguna clave"
        exit 1
    fi
    
    echo "" >> .env
    echo "SUPABASE_SERVICE_ROLE_KEY=\"$service_key\"" >> .env
    echo "✅ Service Role Key agregada al archivo .env"
fi

echo ""
echo "📦 Instalando dependencias Python..."
cd scripts
pip3 install -r requirements.txt

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "🚀 Para ejecutar el script, usa:"
echo "   cd /Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523/scripts"
echo "   python3 upload_profile_photos_to_supabase.py"
echo ""
