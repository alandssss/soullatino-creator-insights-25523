// Script para listar todas las tablas
import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'fhboambxnmswtxalllnn';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_ROLE_KEY
);

async function listTables() {
    console.log('Listing all public tables...\n');

    // No podemos consultar information_schema directamente con supabase-js fácilmente sin RPC
    // Pero podemos intentar adivinar nombres comunes de config
    const configTables = ['config', 'settings', 'app_settings', 'secrets', 'integrations'];

    for (const table of configTables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`✅ Found table: ${table}`);
            console.log('Data:', data);
        } else {
            // console.log(`❌ Table not found: ${table} (${error.code})`);
        }
    }

    // Check if we can execute SQL via RPC (unlikely but worth a check if a helper exists)
    const { data, error } = await supabase.rpc('get_tables'); // Hypothetical
    if (!error) console.log('RPC get_tables result:', data);
}

listTables();
