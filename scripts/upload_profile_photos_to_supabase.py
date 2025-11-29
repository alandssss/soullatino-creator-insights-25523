#!/usr/bin/env python3
"""
Script para subir fotos de perfil de creadores de TikTok a Supabase
Descarga las fotos de perfil y las sube al bucket creator-avatars
Actualiza la tabla creators con las URLs públicas
"""

import os
import sys
import time
import requests
from io import BytesIO
from PIL import Image
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

# Configuración de Supabase
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Necesitas agregar esta clave

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Faltan variables de entorno")
    print("   Asegúrate de tener VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env")
    sys.exit(1)

# Crear cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Configuración
BUCKET_NAME = 'creator-avatars'
EXCEL_FILE = '/Users/worki/Downloads/27_Nov_25_con_fotos.xlsx'
TEMP_IMAGES_FOLDER = 'temp_tiktok_avatars'

# Crear carpeta temporal
os.makedirs(TEMP_IMAGES_FOLDER, exist_ok=True)

def download_tiktok_avatar(username: str) -> tuple[bytes, str]:
    """
    Descarga el avatar de TikTok usando unavatar.io
    Retorna: (imagen_bytes, content_type)
    """
    if not username or pd.isna(username):
        return None, None
    
    clean_username = str(username).strip().lstrip('@')
    
    # Intentar diferentes servicios
    services = [
        f"https://unavatar.io/tiktok/{clean_username}",
        f"https://avatars.githubusercontent.com/u/0?s=200",  # Fallback genérico
    ]
    
    for service_url in services:
        try:
            response = requests.get(service_url, timeout=15, allow_redirects=True)
            
            if response.status_code == 200 and len(response.content) > 1000:
                # Procesar la imagen
                img = Image.open(BytesIO(response.content))
                
                # Convertir a RGB si es necesario
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Redimensionar a 200x200 para mejor calidad
                img = img.resize((200, 200), Image.Resampling.LANCZOS)
                
                # Convertir a bytes
                img_byte_arr = BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=90)
                img_byte_arr.seek(0)
                
                return img_byte_arr.getvalue(), 'image/jpeg'
                
        except Exception as e:
            print(f"    ⚠️  Error con servicio {service_url}: {str(e)}")
            continue
    
    return None, None

def upload_to_supabase_storage(username: str, image_bytes: bytes, content_type: str) -> str:
    """
    Sube la imagen al bucket de Supabase Storage
    Retorna: URL pública de la imagen
    """
    clean_username = str(username).strip().lstrip('@')
    file_path = f"{clean_username}.jpg"
    
    try:
        # Subir archivo al bucket
        response = supabase.storage.from_(BUCKET_NAME).upload(
            file_path,
            image_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true"  # Sobrescribir si ya existe
            }
        )
        
        # Obtener URL pública
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        
        return public_url
        
    except Exception as e:
        print(f"    ❌ Error subiendo a Supabase: {str(e)}")
        return None

def update_creator_profile_image(username: str, image_url: str) -> bool:
    """
    Actualiza la tabla creators con la URL de la imagen de perfil
    """
    try:
        clean_username = str(username).strip().lstrip('@')
        
        # Actualizar el registro del creador
        response = supabase.table('creators').update({
            'profile_image_url': image_url,
            'profile_image_last_refreshed': datetime.utcnow().isoformat()
        }).eq('tiktok_username', clean_username).execute()
        
        # También intentar con el formato @username
        if not response.data:
            response = supabase.table('creators').update({
                'profile_image_url': image_url,
                'profile_image_last_refreshed': datetime.utcnow().isoformat()
            }).eq('tiktok_username', f'@{clean_username}').execute()
        
        return True
        
    except Exception as e:
        print(f"    ❌ Error actualizando base de datos: {str(e)}")
        return False

def main():
    """
    Función principal
    """
    print("=" * 80)
    print("🚀 SUBIDA DE FOTOS DE PERFIL A SUPABASE")
    print("=" * 80)
    print(f"\n📁 Archivo Excel: {EXCEL_FILE}")
    print(f"🪣 Bucket de Supabase: {BUCKET_NAME}")
    print(f"🌐 URL de Supabase: {SUPABASE_URL}\n")
    
    # Verificar que el bucket existe, si no, crearlo
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if BUCKET_NAME not in bucket_names:
            print(f"⚠️  El bucket '{BUCKET_NAME}' no existe. Intentando crearlo...")
            try:
                supabase.storage.create_bucket(
                    BUCKET_NAME,
                    options={"public": True, "file_size_limit": 5242880, "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"]}
                )
                print(f"✅ Bucket '{BUCKET_NAME}' creado exitosamente")
            except Exception as create_error:
                print(f"❌ Error creando bucket: {str(create_error)}")
                print("   Intentando continuar de todas formas (tal vez ya existe pero no tengo permisos de lista)...")
        else:
            print(f"✅ Bucket '{BUCKET_NAME}' encontrado\n")
    except Exception as e:
        print(f"⚠️  Advertencia verificando buckets: {str(e)}")
        print("   Intentando continuar...")
    
    # Leer archivo Excel
    try:
        print(f"📖 Leyendo archivo Excel...")
        df = pd.read_excel(EXCEL_FILE)
        print(f"✅ Archivo leído: {len(df)} creadores encontrados\n")
    except Exception as e:
        print(f"❌ Error leyendo Excel: {str(e)}")
        sys.exit(1)
    
    # Procesar cada creador
    print("🔄 Procesando creadores...\n")
    
    stats = {
        'total': len(df),
        'downloaded': 0,
        'uploaded': 0,
        'updated': 0,
        'failed': 0
    }
    
    for idx, row in df.iterrows():
        username = row.get("Creator's username", '')
        
        if not username or pd.isna(username):
            print(f"[{idx+1}/{stats['total']}] ⏭️  Sin username, saltando...")
            stats['failed'] += 1
            continue
        
        clean_username = str(username).strip().lstrip('@')
        print(f"[{idx+1}/{stats['total']}] 📸 @{clean_username}")
        
        # 1. Descargar imagen
        print(f"    ⬇️  Descargando avatar...", end=' ')
        image_bytes, content_type = download_tiktok_avatar(username)
        
        if not image_bytes:
            print("❌ Fallo")
            stats['failed'] += 1
            continue
        
        print("✅")
        stats['downloaded'] += 1
        
        # 2. Subir a Supabase Storage
        print(f"    ⬆️  Subiendo a Supabase Storage...", end=' ')
        public_url = upload_to_supabase_storage(username, image_bytes, content_type)
        
        if not public_url:
            print("❌ Fallo")
            stats['failed'] += 1
            continue
        
        print("✅")
        stats['uploaded'] += 1
        
        # 3. Actualizar base de datos
        print(f"    💾 Actualizando base de datos...", end=' ')
        success = update_creator_profile_image(username, public_url)
        
        if success:
            print("✅")
            stats['updated'] += 1
        else:
            print("⚠️  Advertencia")
        
        print(f"    🔗 URL: {public_url}\n")
        
        # Pausa para no saturar los servicios
        time.sleep(0.5)
    
    # Resumen final
    print("\n" + "=" * 80)
    print("📊 RESUMEN FINAL")
    print("=" * 80)
    print(f"Total de creadores:        {stats['total']}")
    print(f"✅ Avatares descargados:   {stats['downloaded']}")
    print(f"✅ Subidos a Storage:      {stats['uploaded']}")
    print(f"✅ BD actualizada:         {stats['updated']}")
    print(f"❌ Fallidos:               {stats['failed']}")
    print("\n🎉 ¡Proceso completado!")
    print(f"🌐 Las fotos ahora están disponibles en: {SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/")
    print("=" * 80)

if __name__ == "__main__":
    main()
