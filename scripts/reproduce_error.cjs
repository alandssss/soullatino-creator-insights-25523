const { createClient } = require('@supabase/supabase-js');

// Scenario 1: New URL, Old Key (Common mistake)
const newUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const oldKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

// Scenario 2: Old URL, New Key
const oldUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MTM0MzgsImV4cCI6MjA0ODE4OTQzOH0.JxdcMEbUdNqrv6Hy_LmVUkqMxTKhVPVVnKCTvpbI0Zg';

async function testMismatch() {
    console.log('--- Testing Scenario 1: New URL + Old Key ---');
    const client1 = createClient(newUrl, oldKey);
    const { error: error1 } = await client1.functions.invoke('sync-to-airtable');
    console.log('Error 1:', error1);

    console.log('\n--- Testing Scenario 2: Old URL + New Key ---');
    const client2 = createClient(oldUrl, newKey);
    const { error: error2 } = await client2.functions.invoke('sync-to-airtable');
    console.log('Error 2:', error2);
}

testMismatch();
