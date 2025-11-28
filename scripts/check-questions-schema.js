require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
    const res = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='questions' 
    ORDER BY ordinal_position
  `);
    console.log('Questions columns:', res.rows.map(r => r.column_name).join(', '));
    pool.end();
}

checkSchema();
