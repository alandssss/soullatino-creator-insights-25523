require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

async function debugConnection() {
    console.log('--- Debugging Connection ---');
    console.log('URL:', supabaseUrl);

    const decoded = parseJwt(supabaseKey);
    console.log('Key Role:', decoded ? decoded.role : 'Invalid JWT');
    console.log('Key Iss:', decoded ? decoded.iss : 'Invalid JWT');
    console.log('Key Ref:', decoded ? decoded.ref : 'Invalid JWT');

    const tables = ['creators', 'creator_daily_stats', 'creator_bonificaciones'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ Error counting ${table}:`, error.message);
        } else {
            console.log(`✅ ${table}: ${count} rows`);
        }
    }
}

debugConnection();
