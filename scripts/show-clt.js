const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function showCLT() {
    try {
        await client.connect();

        const topics = [7, 8];

        for (const id of topics) {
            const topicRes = await client.query("SELECT * FROM topics WHERE id = $1", [id]);
            if (topicRes.rows.length === 0) continue;
            const topic = topicRes.rows[0];
            console.log(`\nTopic: ${topic.name} (ID: ${topic.id})`);

            const patterns = await client.query("SELECT * FROM patterns WHERE topic_id = $1 ORDER BY id", [id]);
            if (patterns.rows.length === 0) {
                console.log("No patterns found.");
            } else {
                patterns.rows.forEach(p => {
                    console.log(`- [${p.gemini_generated ? 'AI' : 'Manual'}] ${p.pattern}`);
                    console.log(`  Approach: ${p.teacher_preferred_approach ? p.teacher_preferred_approach.substring(0, 100) + '...' : 'None'}`);
                });
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

showCLT();
