const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function dumpState() {
    try {
        await client.connect();

        const topicsRes = await client.query("SELECT * FROM topics ORDER BY id");
        const topics = topicsRes.rows;

        const fullData = [];

        for (const topic of topics) {
            const patternsRes = await client.query("SELECT pattern FROM patterns WHERE topic_id = $1 ORDER BY id", [topic.id]);
            fullData.push({
                name: topic.name,
                patterns: patternsRes.rows.map(p => p.pattern)
            });
        }

        console.log(JSON.stringify(fullData, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

dumpState();
