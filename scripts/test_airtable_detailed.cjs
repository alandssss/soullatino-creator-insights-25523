async function testAirtableDetailed() {
    const functionUrl = 'https://fhboambxnmswtxalllnn.supabase.co/functions/v1/sync-to-airtable';

    console.log('Testing sync with detailed error info...');

    const dateToSync = new Date().toISOString().split('T')[0];
    console.log('Date to sync:', dateToSync);

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: dateToSync })
        });

        console.log('Status:', response.status);
        const data = await response.json();

        console.log('\n=== RESPONSE ===');
        console.log('Success:', data.success);
        console.log('Total Records:', data.totalRecords);
        console.log('Errors:', data.errors?.length || 0);

        if (data.errors && data.errors.length > 0) {
            console.log('\n=== FIRST 3 ERRORS ===');
            data.errors.slice(0, 3).forEach((err, i) => {
                console.log(`\nError ${i + 1}:`);
                console.log('  Creator:', err.creator_id);
                console.log('  Operation:', err.operation);
                console.log('  Message:', err.error);
            });
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testAirtableDetailed();
