const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function testGetTopics() {
    try {
        await client.connect();
        const res = await client.query("SELECT * FROM topics ORDER BY id");
        console.log("Topics found:", res.rows.length);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

testGetTopics();
