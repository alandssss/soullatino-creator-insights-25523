const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MTM0MzgsImV4cCI6MjA0ODE4OTQzOH0.JxdcMEbUdNqrv6Hy_LmVUkqMxTKhVPVVnKCTvpbI0Zg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Testing login for admin@soullatino.com...');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@soullatino.com',
        password: 'Pues56!'
    });

    if (error) {
        console.error('❌ Login failed:', error.message);
    } else {
        console.log('✅ Login successful!');
        console.log('User ID:', data.user.id);
    }
}

testLogin();
