#!/usr/bin/env python3
"""
Script interactivo para configurar y ejecutar la subida de fotos a Supabase
"""

import os
import sys

def main():
    print("=" * 80)
    print("🔧 CONFIGURACIÓN DE SUBIDA DE FOTOS A SUPABASE")
    print("=" * 80)
    print()
    
    # Cambiar al directorio del proyecto
    project_dir = '/Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523'
    os.chdir(project_dir)
    
    # Verificar archivo .env
    env_file = '.env'
    if not os.path.exists(env_file):
        print("❌ Error: No se encuentra el archivo .env")
        sys.exit(1)
    
    print("✅ Archivo .env encontrado")
    
    # Leer contenido actual del .env
    with open(env_file, 'r') as f:
        env_content = f.read()
    
    # Verificar si ya existe la Service Role Key
    if 'SUPABASE_SERVICE_ROLE_KEY' in env_content:
        print("✅ SUPABASE_SERVICE_ROLE_KEY ya está configurada")
        print()
        response = input("¿Deseas reemplazarla? (s/n): ").strip().lower()
        
        if response != 's':
            print("✅ Usando la clave existente")
            run_upload_script()
            return
    else:
        print("⚠️  SUPABASE_SERVICE_ROLE_KEY no encontrada")
    
    print()
    print("📋 INSTRUCCIONES PARA OBTENER LA SERVICE ROLE KEY:")
    print()
    print("1. Ve a Supabase Dashboard (ya está abierto en tu navegador)")
    print("2. Inicia sesión si es necesario")
    print("3. Ve a Settings → API")
    print("4. En la sección 'Project API keys', busca 'service_role'")
    print("5. Clic en el ícono de 'Reveal' para mostrar la clave")
    print("6. Copia la clave completa (empieza con 'eyJ...')")
    print()
    print("🔗 URL directa: https://supabase.com/dashboard/project/fhboambxnmswtxalllnn/settings/api")
    print()
    
    # Solicitar la clave
    service_key = input("Pega aquí tu Service Role Key: ").strip()
    
    if not service_key:
        print("❌ No se proporcionó ninguna clave")
        sys.exit(1)
    
    if not service_key.startswith('eyJ'):
        print("⚠️  Advertencia: La clave no parece tener el formato correcto")
        print("   Las Service Role Keys normalmente empiezan con 'eyJ'")
        response = input("¿Deseas continuar de todas formas? (s/n): ").strip().lower()
        if response != 's':
            sys.exit(1)
    
    # Actualizar el archivo .env
    if 'SUPABASE_SERVICE_ROLE_KEY' in env_content:
        # Reemplazar la clave existente
        lines = env_content.split('\n')
        new_lines = []
        for line in lines:
            if line.startswith('SUPABASE_SERVICE_ROLE_KEY'):
                new_lines.append(f'SUPABASE_SERVICE_ROLE_KEY="{service_key}"')
            else:
                new_lines.append(line)
        env_content = '\n'.join(new_lines)
    else:
        # Agregar la nueva clave
        if not env_content.endswith('\n'):
            env_content += '\n'
        env_content += f'SUPABASE_SERVICE_ROLE_KEY="{service_key}"\n'
    
    # Guardar el archivo .env
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print()
    print("✅ Service Role Key guardada en .env")
    print()
    
    # Preguntar si desea ejecutar el script ahora
    response = input("¿Deseas ejecutar el script de subida ahora? (s/n): ").strip().lower()
    
    if response == 's':
        run_upload_script()
    else:
        print()
        print("✅ Configuración completada")
        print()
        print("🚀 Para ejecutar el script más tarde, usa:")
        print("   cd /Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523/scripts")
        print("   python3 upload_profile_photos_to_supabase.py")
        print()

def run_upload_script():
    """Ejecuta el script de subida de fotos"""
    print()
    print("=" * 80)
    print("🚀 EJECUTANDO SCRIPT DE SUBIDA DE FOTOS")
    print("=" * 80)
    print()
    
    # Cambiar al directorio de scripts
    os.chdir('/Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523/scripts')
    
    # Ejecutar el script
    os.system('python3 upload_profile_photos_to_supabase.py')

if __name__ == "__main__":
    main()
