const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function debugQuestions() {
    try {
        await client.connect();
        console.log("🔌 Connected to DB.");

        // 1. Find the Binomial Topic
        const topicRes = await client.query("SELECT id, name FROM topics WHERE name ILIKE '%Binomial%'");
        if (topicRes.rows.length === 0) {
            console.log("❌ Topic 'Binomial' not found.");
            return;
        }
        const topic = topicRes.rows[0];
        console.log(`\nTopic: ${topic.name} (ID: ${topic.id})`);

        // 2. Find the Pattern
        const patternRes = await client.query(
            "SELECT id, pattern FROM patterns WHERE topic_id = $1 AND pattern ILIKE '%Identify%'",
            [topic.id]
        );
        if (patternRes.rows.length === 0) {
            console.log("❌ Pattern 'Identify...' not found.");
            return;
        }
        const pattern = patternRes.rows[0];
        console.log(`Pattern: ${pattern.pattern} (ID: ${pattern.id})`);

        // 3. Count Questions
        const countRes = await client.query(
            "SELECT difficulty, COUNT(*) FROM questions WHERE topic_id = $1 AND pattern_id = $2 GROUP BY difficulty",
            [topic.id, pattern.id]
        );
        console.log("\nQuestion Counts:");
        console.table(countRes.rows);

        // 4. List a few questions to check data integrity
        const listRes = await client.query(
            "SELECT id, difficulty, left(question_text, 50) as text FROM questions WHERE topic_id = $1 AND pattern_id = $2 LIMIT 5",
            [topic.id, pattern.id]
        );
        console.log("\nSample Questions:");
        console.table(listRes.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

debugQuestions();
