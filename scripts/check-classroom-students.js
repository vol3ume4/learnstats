const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'classroom_students'
            ORDER BY ordinal_position
        `);
        console.log('classroom_students schema:');
        console.table(res.rows);

        const fk = await client.query(`
            SELECT * FROM information_schema.table_constraints 
            WHERE table_name = 'classroom_students' AND constraint_type = 'FOREIGN KEY'
        `);
        console.log('\nForeign keys:');
        console.table(fk.rows);

        const sample = await client.query('SELECT * FROM classroom_students LIMIT 3');
        console.log('\nSample data:');
        console.table(sample.rows);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
