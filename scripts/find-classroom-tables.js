const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkTables() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE '%classroom%'
        `);
        console.log('Classroom-related tables:');
        console.table(res.rows);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTables();
