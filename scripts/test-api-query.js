const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function testAPI() {
    try {
        await client.connect();

        // Simulate the exact API call
        const topicId = 4;
        const patternId = 54;
        const difficulty = "Easy";

        console.log(`Testing API call with: Topic=${topicId}, Pattern=${patternId}, Diff=${difficulty}`);

        const res = await client.query(
            `SELECT * FROM questions 
       WHERE topic_id = $1 AND pattern_id = $2 AND difficulty = $3
       ORDER BY created_at DESC`,
            [topicId, patternId, difficulty]
        );

        console.log(`\nResult: ${res.rows.length} questions found`);

        if (res.rows.length > 0) {
            console.log("\nFirst question:");
            console.log(res.rows[0]);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

testAPI();
