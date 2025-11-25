const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function listTopics() {
    try {
        await client.connect();
        const res = await client.query("SELECT id, name FROM topics ORDER BY id");
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listTopics();
