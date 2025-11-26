const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkProfilesSchema() {
    try {
        await client.connect();

        const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `;
        const result = await client.query(query);

        console.log('\n=== profiles Table Schema ===');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });

        // Show sample data
        const sampleQuery = 'SELECT * FROM profiles LIMIT 3';
        const sample = await client.query(sampleQuery);

        console.log('\n=== Sample Data ===');
        console.log(sample.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkProfilesSchema();
