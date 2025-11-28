require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateAssignmentsSchema() {
    try {
        console.log('Adding status column to assignments table...');

        await pool.query(`
      ALTER TABLE assignments 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);

        console.log('✅ Column added successfully');

        // Update existing assignments to active
        await pool.query(`
      UPDATE assignments 
      SET status = 'active' 
      WHERE status IS NULL;
    `);

        console.log('✅ Existing assignments updated to active status');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

updateAssignmentsSchema();
