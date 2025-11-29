require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connectionString = 'postgresql://postgres:postgres@db.fhboambxnmswtxalllnn.supabase.co:5432/postgres';
    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/create_debug_logs.sql'), 'utf8');
        await client.query(sql);
        console.log('Migration executed successfully');

    } catch (err) {
        console.error('Error executing migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
