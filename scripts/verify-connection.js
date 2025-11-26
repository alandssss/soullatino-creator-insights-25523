import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function verifyConnection() {
    console.log('🔍 Verificando conexión a Supabase...');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Key: ${supabaseKey ? 'Presente (' + supabaseKey.substring(0, 10) + '...)' : 'Faltante'}`);

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Faltan variables de entorno');
        return;
    }

    try {
        // 1. Verificar Auth (GoTrue)
        console.log('\n1. Probando Auth (GET /auth/v1/health)...');
        const authRes = await fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        console.log(`   Status: ${authRes.status} ${authRes.statusText}`);

        if (authRes.ok) {
            console.log('   ✅ Auth service accesible');
        } else {
            console.log('   ⚠️ Auth service respondió con error');
        }

        // 2. Verificar Rest (PostgREST) - Intentar leer tabla pública (si existe alguna accesible)
        // Intentaremos leer la raíz de la API REST
        console.log('\n2. Probando REST API (GET /rest/v1/)...');
        const restRes = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        console.log(`   Status: ${restRes.status} ${restRes.statusText}`);

        if (restRes.ok || restRes.status === 404) { // 404 en root es normal para PostgREST a veces, o 200 con OpenAPI
            console.log('   ✅ REST API accesible (servidor responde)');
        } else {
            console.log('   ❌ REST API error');
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        if (error.cause) console.error('   Causa:', error.cause);
    }
}

verifyConnection();
