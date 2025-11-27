
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDataAdmin() {
    console.log('🔍 Checking data with SERVICE ROLE key...');

    // Check creators
    const responseCreators = await supabase
        .from('creators')
        .select('*', { count: 'exact' })
        .limit(1);

    console.log('Creators Response:', {
        status: responseCreators.status,
        count: responseCreators.count,
        dataLength: responseCreators.data?.length,
        error: responseCreators.error
    });

    // Check daily stats
    const responseStats = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact' })
        .limit(1);

    console.log('Daily Stats Response:', {
        status: responseStats.status,
        count: responseStats.count,
        dataLength: responseStats.data?.length,
        error: responseStats.error
    });
}

checkDataAdmin();
