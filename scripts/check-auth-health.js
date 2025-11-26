import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Usar SERVICE_ROLE_KEY si está disponible en .env, sino usar PUBLISHABLE (pero publishable no puede listar usuarios)
// Asumimos que el usuario tiene acceso a las keys.
// Voy a intentar leer SUPABASE_SERVICE_ROLE_KEY del entorno si existe, o pedirlo.
// Pero en el entorno local del usuario, .env suele tener VITE_...
// Voy a intentar usar VITE_SUPABASE_PUBLISHABLE_KEY para login normal.

const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
    console.log('🔍 Verificando estado de autenticación...');

    // 1. Intentar listar user_roles (si RLS lo permite para anon/public, lo cual es improbable, pero probemos)
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(5);

    if (rolesError) {
        console.log('❌ Error leyendo user_roles (esperado si es anon):', rolesError.message);
    } else {
        console.log('✅ user_roles accesibles:', roles.length);
    }

    // 2. Verificar configuración
    console.log('\nConfiguración:');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Presente' : 'Faltante');
}

checkAuth().catch(console.error);
