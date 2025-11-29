
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanup() {
    console.log('🧹 Cleaning up test data...');

    const { error } = await supabase
        .from('creators')
        .delete()
        .eq('email', 'test@soullatino.com');

    if (error) {
        console.error('❌ Error deleting creator:', error);
    } else {
        console.log('✅ Deleted creator with email test@soullatino.com');
    }
}

cleanup();
