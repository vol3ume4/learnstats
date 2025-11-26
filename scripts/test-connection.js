const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
    try {
        await client.connect();
        const res = await client.query("SELECT 1");
        console.log("Connection success:", res.rows);
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await client.end();
    }
}

testConnection();
