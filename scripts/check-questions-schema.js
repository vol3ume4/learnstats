const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkQuestionsSchema() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions'
      ORDER BY ordinal_position;
    `);
        console.log("=== QUESTIONS TABLE SCHEMA ===");
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkQuestionsSchema();
