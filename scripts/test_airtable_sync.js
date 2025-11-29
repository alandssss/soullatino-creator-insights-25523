
import { createClient } from '@supabase/supabase-js';

// Credentials from scripts/check_data.js (assuming this is the correct project)
const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

async function testAirtableSync() {
    console.log('🚀 Testing Airtable Sync Function...');
    console.log(`Target: ${supabaseUrl}/functions/v1/sync-to-airtable`);

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/sync-to-airtable`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Sync for today (where we saw data in debug_tables.js)
                date: '2025-11-28'
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log('Response Data:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Response Text:', text);
        }

    } catch (error) {
        console.error('❌ Error invoking function:', error);
    }
}

testAirtableSync();
