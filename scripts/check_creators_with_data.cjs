require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreatorsCount() {
    const { count } = await supabase
        .from('creators')
        .select('*', { count: 'exact', head: true });

    console.log(`Total creadores en BD: ${count}`);

    const { data } = await supabase
        .from('creator_daily_stats')
        .select('creator_id')
        .eq('fecha', '2025-11-28');

    console.log(`\nCreadores con datos para 2025-11-28: ${data?.length || 0}`);

    if (data && data.length > 0) {
        console.log('\nIDs de creadores:');
        data.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.creator_id?.substring(0, 20)}...`);
        });
    }
}

checkCreatorsCount();
