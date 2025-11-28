const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkProfiles() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'profiles' ORDER BY ordinal_position
        `);
        console.log('profiles columns:');
        console.table(res.rows);
    } finally {
        client.release();
        await pool.end();
    }
}

checkProfiles();
