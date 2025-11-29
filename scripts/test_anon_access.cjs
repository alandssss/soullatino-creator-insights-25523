async function testAnonymousAccess() {
    const functionUrl = 'https://fhboambxnmswtxalllnn.supabase.co/functions/v1/sync-to-airtable';

    console.log('Testing anonymous access to:', functionUrl);

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: '2025-11-28' })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text.substring(0, 200));

        if (response.ok) {
            console.log('✅ Success! Function is publicly accessible.');
        } else {
            console.log('❌ Failed. Auth is likely enforced by Gateway.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testAnonymousAccess();
