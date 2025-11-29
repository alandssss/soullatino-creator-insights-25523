import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const files = fs.readdirSync(migrationsDir);

console.log('=== Starting Migration Repair ===');

files.forEach(file => {
    if (!file.endsWith('.sql')) return;

    // Skip my new migrations
    if (file.startsWith('20251128')) {
        console.log(`Skipping new migration: ${file}`);
        return;
    }

    const version = file.split('_')[0];
    console.log(`Repairing ${version} (${file})...`);

    try {
        execSync(`supabase migration repair --status applied ${version}`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Failed to repair ${version}`);
        // Don't exit, try next
    }
});

console.log('=== Repair Complete ===');
