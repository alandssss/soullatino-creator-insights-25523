async function testAirtableSyncToday() {
    const functionUrl = 'https://fhboambxnmswtxalllnn.supabase.co/functions/v1/sync-to-airtable';

    console.log('Testing sync with today date...');

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
        const text = await response.text();

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('✅ Success!');
            console.log('Records processed:', data.totalRecords);
            console.log('Creators processed:', data.creatorsProcessed);
            console.log('Metrics created:', data.metricsCreated);
            console.log('Duration:', data.duration, 'ms');
            console.log('Errors:', data.errors.length);
        } else {
            console.log('❌ Error:', text);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testAirtableSyncToday();
