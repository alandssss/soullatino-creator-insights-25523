const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Cleaning up test creator...');
    const { error } = await supabase
        .from('creators')
        .delete()
        .eq('creator_id', 'test_creator_manual_1');

    if (error) {
        console.error('Error cleaning up:', error);
    } else {
        console.log('Cleanup successful');
    }
}

cleanup();
