const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const topicName = process.argv[2];

if (!topicName) {
    console.error("Please provide a topic name.");
    console.error("Usage: node scripts/add-topic.js \"Topic Name\"");
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function addTopic() {
    try {
        await client.connect();

        const res = await client.query(
            "INSERT INTO topics (name) VALUES ($1) RETURNING id, name",
            [topicName]
        );

        console.log(`✅ Topic Added: "${res.rows[0].name}" (ID: ${res.rows[0].id})`);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            console.log(`⚠️  Topic "${topicName}" already exists.`);
        } else {
            console.error("Error adding topic:", err);
        }
    } finally {
        await client.end();
    }
}

addTopic();
