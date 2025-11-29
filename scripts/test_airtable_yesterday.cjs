async function testAirtableSync() {
    const functionUrl = 'https://fhboambxnmswtxalllnn.supabase.co/functions/v1/sync-to-airtable';

    console.log('Testing sync with yesterday date...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateToSync = yesterday.toISOString().split('T')[0];

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
        console.log('Response:', text);

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('✅ Success!');
            console.log('Records processed:', data.totalRecords);
        } else {
            console.log('❌ Error:', text);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testAirtableSync();
