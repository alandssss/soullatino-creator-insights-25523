```javascript
const https = require('https');

const apiKey = process.env.AIRTABLE_API_KEY || 'YOUR_API_KEY';
const baseId = "apprY9jmQ4RvDGo17";
const tableId = "tblFK1tY8yvFpl4bP"; // Creators table

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

            // Find "Nivel Actual" field
            const nivelActualField = table.fields.find(f => f.name === "Nivel Actual");

            if (nivelActualField && nivelActualField.options && nivelActualField.options.choices) {
                console.log(`Valid options for "Nivel Actual":`);
                nivelActualField.options.choices.forEach(choice => {
                    console.log(`- "${choice.name}" (ID: ${choice.id})`);
                });
            } else {
                console.log('"Nivel Actual" field not found or has no choices.');
            }

        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
