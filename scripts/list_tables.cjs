require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    console.log('Listando todas las tablas en la base de datos...\n');

    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

    if (error) {
        console.error('Error:', error.message);

        // Try alternative approach
        console.log('\nIntentando enfoque alternativo...\n');

        const tables = [
            'creators',
            'creator_bonificaciones',
            'creator_live_daily',
            'creator_recommendations',
            'daily_recommendations',
            'excel_uploads',
            'recommendations'
        ];

        for (const table of tables) {
            const { count, error: countError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (!countError) {
                console.log(`✅ ${table}: ${count} registros`);
            } else {
                console.log(`❌ ${table}: tabla no existe o sin acceso`);
            }
        }
        return;
    }

    if (data) {
        console.log('Tablas encontradas:');
        data.forEach(t => console.log(`  - ${t.table_name}`));
    }
}

listAllTables();
