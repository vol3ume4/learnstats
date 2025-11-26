const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function updateQuestionsSchema() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Add created_by column
        await client.query(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS created_by UUID,
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai_generated',
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE
    `);

        console.log('✓ Added created_by, source, and is_verified columns to questions table');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

updateQuestionsSchema();
