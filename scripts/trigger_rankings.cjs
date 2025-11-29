require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerRankings() {
    console.log('Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@soullatino.com',
        password: process.env.ADMIN_PASSWORD || 'Pues56!'
    });

    if (authError) {
        console.error('Login failed:', authError);
        return;
    }

    console.log('Login successful. Triggering calculate-rankings...');

    const { data, error } = await supabase.functions.invoke('calculate-rankings', {
        body: { periodo: 'semanal' }
    });

    if (error) {
        console.error('Error invoking function:', error);
    } else {
        console.log('Function invoked successfully:', data);
    }
}

triggerRankings();
