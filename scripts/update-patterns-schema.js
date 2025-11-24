const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function updateSchema() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        console.log("Adding 'created_by' column...");
        await client.query(`
      ALTER TABLE patterns 
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
    `);

        console.log("Adding 'gemini_generated' column...");
        await client.query(`
      ALTER TABLE patterns 
      ADD COLUMN IF NOT EXISTS gemini_generated BOOLEAN DEFAULT FALSE;
    `);

        console.log("Schema update complete! 🚀");
    } catch (err) {
        console.error("Schema Update Failed:", err);
    } finally {
        await client.end();
    }
}

updateSchema();
