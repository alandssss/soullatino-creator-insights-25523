require('dotenv').config();

async function testUploadHealth() {
    const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
    const functionUrl = `${supabaseUrl}/functions/v1/upload-excel-recommendations`;
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

    console.log('Testing upload function health check (OPTIONS)...');

    try {
        const response = await fetch(functionUrl, {
            method: 'OPTIONS',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
            }
        });

        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            console.log('✅ Upload function is reachable and responding to OPTIONS');
        } else {
            console.error('❌ Upload function returned error status');
        }

    } catch (error) {
        console.error('❌ Error connecting to upload function:', error);
    }
}

testUploadHealth();
