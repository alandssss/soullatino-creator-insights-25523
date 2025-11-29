```javascript
const https = require('https');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'YOUR_API_KEY';
const baseId = "apprY9jmQ4RvDGo17";
const tableId = "tbl2KTAcZLmLx5mcw"; // Daily Metrics table

const options = {
    hostname: 'api.airtable.com',
    path: `/ v0 / meta / bases / ${ baseId }/tables`,
method: 'GET',
    headers: {
    'Authorization': `Bearer ${apiKey}`
}
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
            return;
        }

        try {
            const response = JSON.parse(data);
            const table = response.tables.find(t => t.id === tableId);

            if (!table) {
                console.log(`Table ${tableId} not found.`);
                return;
            }

            console.log(`Fields for table "${table.name}" (${table.id}):`);
            table.fields.forEach(field => {
                console.log(`- "${field.name}" (ID: ${field.id}, Type: ${field.type})`);
            });

        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
