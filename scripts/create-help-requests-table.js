require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createHelpRequestsTable() {
    const client = await pool.connect();
    try {
        console.log('Creating student_help_requests table...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS student_help_requests (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        input_mode VARCHAR(10) NOT NULL CHECK (input_mode IN ('text', 'image')),
        detected_topic VARCHAR(255),
        detected_pattern VARCHAR(255),
        was_saved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        console.log('✅ Table created successfully');

        // Create index for faster queries
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON student_help_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON student_help_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_help_requests_was_saved ON student_help_requests(was_saved);
    `);

        console.log('✅ Indexes created successfully');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

createHelpRequestsTable();
