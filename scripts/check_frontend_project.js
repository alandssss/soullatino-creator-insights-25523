
import { createClient } from '@supabase/supabase-js';

// Check the project from .env (frontend)
const frontendUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const frontendKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

// Check the project we linked (backend)
const backendUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const backendKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

console.log('Frontend project (from .env):', frontendUrl);
console.log('Backend project (linked):', backendUrl);
console.log('\n⚠️ THESE ARE DIFFERENT PROJECTS!');
console.log('\nChecking frontend project for data...');

const frontendClient = createClient(frontendUrl, backendKey);

async function checkFrontendProject() {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chihuahua' });

    const { count: dailyCount } = await frontendClient
        .from('creator_daily_stats')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today);

    const { count: bonifCount } = await frontendClient
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: true });

    console.log(`Frontend project (mpseoscrzpnequwvzokn):`);
    console.log(`  - creator_daily_stats (${today}): ${dailyCount} records`);
    console.log(`  - creator_bonificaciones: ${bonifCount} records`);
}

checkFrontendProject();
