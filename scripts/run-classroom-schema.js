require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSchema() {
  try {
    const sqlPath = path.join(__dirname, 'create-classroom-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running SQL schema...');
    await pool.query(sql);
    console.log('✅ Schema executed successfully!');
  } catch (error) {
    console.error('❌ Error executing schema:', error);
  } finally {
    await pool.end();
  }
}

runSchema();
