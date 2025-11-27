const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkPMF() {
    try {
        await client.connect();
        console.log("🔌 Connected to DB.");

        // Find Binomial topic
        const topicRes = await client.query("SELECT id, name FROM topics WHERE name ILIKE '%Binomial%'");
        const topic = topicRes.rows[0];
        console.log(`\nTopic: ${topic.name} (ID: ${topic.id})`);

        // Find PMF pattern
        const patternRes = await client.query(
            "SELECT id, pattern FROM patterns WHERE topic_id = $1 AND pattern ILIKE '%PMF%'",
            [topic.id]
        );

        console.log("\nPatterns matching 'PMF':");
        console.table(patternRes.rows);

        if (patternRes.rows.length > 0) {
            const pattern = patternRes.rows[0];

            // Count questions
            const countRes = await client.query(
                "SELECT difficulty, COUNT(*) FROM questions WHERE topic_id = $1 AND pattern_id = $2 GROUP BY difficulty",
                [topic.id, pattern.id]
            );
            console.log("\nQuestion Counts:");
            console.table(countRes.rows);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

checkPMF();
