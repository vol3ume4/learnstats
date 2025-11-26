const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL.replace(":5432", ":6543"),
    ssl: { rejectUnauthorized: false }
});

async function showTopics() {
    try {
        await client.connect();
        const res = await client.query("SELECT id, name FROM topics ORDER BY name;");
        console.log("Topics in database:");
        res.rows.forEach(t => console.log(`  ${t.id}: ${t.name}`));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

showTopics();
