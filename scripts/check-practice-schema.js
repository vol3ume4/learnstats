const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
    try {
        await client.connect();

        const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'practice_history' 
      ORDER BY ordinal_position
    `;
        const result = await client.query(query);

        console.log('\n=== practice_history Table Schema ===');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
