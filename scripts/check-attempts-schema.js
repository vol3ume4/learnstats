const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
    try {
        await client.connect();

        // Check attempts table schema
        const schemaQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attempts' 
      ORDER BY ordinal_position
    `;
        const schemaResult = await client.query(schemaQuery);

        console.log('\n=== Attempts Table Schema ===');
        schemaResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });

        // Check if there are any attempts
        const countQuery = 'SELECT COUNT(*) as total FROM attempts';
        const countResult = await client.query(countQuery);
        console.log(`\n=== Total Attempts: ${countResult.rows[0].total} ===`);

        // Check sample data
        if (countResult.rows[0].total > 0) {
            const sampleQuery = 'SELECT user_id, topic_id, pattern_id, difficulty, created_at FROM attempts LIMIT 3';
            const sampleResult = await client.query(sampleQuery);
            console.log('\n=== Sample Attempts ===');
            sampleResult.rows.forEach(row => {
                console.log(row);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
