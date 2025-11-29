const { createClient } = require('@supabase/supabase-js');

// Use the CORRECT project credentials
const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTk0MjAsImV4cCI6MjA3OTY3NTQyMH0.YOUR_ACTUAL_ANON_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInvoke() {
    console.log('Testing supabase.functions.invoke...');

    const { data, error } = await supabase.functions.invoke('sync-to-airtable', {
        body: { date: '2025-11-28' }
    });

    console.log('Data:', data);
    console.log('Error:', error);
}

testInvoke().catch(console.error);
