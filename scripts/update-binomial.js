const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const NEW_PATTERNS = [
    "Identify Binomial Scenarios (Bernoulli Trials)",
    "Calculate Exact Probability (PMF) given n, p, x",
    "Calculate Cumulative Probability (CDF) given n, p, x",
    "Inverse Problems: Find n, p, or x given Probability"
];

async function updateBinomial() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Get Topic ID
        const res = await client.query("SELECT id FROM topics WHERE name ILIKE '%Binomial%'");
        if (res.rows.length === 0) {
            console.error("Topic 'Binomial Distribution' not found.");
            return;
        }
        const topicId = res.rows[0].id;
        console.log(`Found Topic ID: ${topicId}`);

        // 2. Delete existing patterns for this topic
        console.log("Deleting old patterns...");
        await client.query("DELETE FROM patterns WHERE topic_id = $1", [topicId]);

        // 3. Insert new patterns
        console.log("Inserting new patterns...");
        for (const p of NEW_PATTERNS) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [topicId, p]
            );
        }

        console.log("✅ Binomial curriculum updated successfully!");
    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        await client.end();
    }
}

updateBinomial();
