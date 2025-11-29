require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Use service role key if possible for admin access, but publishable is fine for reading public data if RLS allows

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreators() {
    console.log('Verificando creadores en la base de datos...\n');

    const { count, error } = await supabase
        .from('creators')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`👥 Total de creadores: ${count}`);

    if (count && count > 0) {
        const { data } = await supabase
            .from('creators')
            .select('id, nombre, tiktok_username, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        console.log('\n📋 Últimos 10 creadores creados:');
        data?.forEach((c, i) => {
            console.log(`   ${i + 1}. ${c.nombre || c.tiktok_username} (creado: ${c.created_at?.substring(0, 10)})`);
        });
    }
}

checkCreators();
