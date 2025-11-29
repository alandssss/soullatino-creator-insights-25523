// Script para invocar directamente la función y ver el error
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUploadFunction() {
    console.log('Testing upload-excel-recommendations function...\n');

    // Get auth token
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
        console.error('❌ No hay sesión activa. Por favor login primero en la app.');
        return;
    }

    console.log('✅ Sesión encontrada para:', session.user.email);
    console.log('Invocando función...\n');

    try {
        // Call function - note: can't actually send file via invoke, 
        // but we can check if it's accessible
        const { data, error } = await supabase.functions.invoke('upload-excel-recommendations', {
            body: { test: true }
        });

        console.log('Response data:', data);
        console.log('Response error:', error);
    } catch (err) {
        console.error('Exception:', err);
    }
}

testUploadFunction();
