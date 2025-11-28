require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createNotificationsTable() {
    try {
        console.log('Creating notifications table...');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        link TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        console.log('✅ Table created successfully');

        console.log('Creating index...');
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user 
      ON notifications(user_id, is_read);
    `);

        console.log('✅ Index created successfully');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

createNotificationsTable();
