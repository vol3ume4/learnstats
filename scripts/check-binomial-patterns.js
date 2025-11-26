const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL.replace(":5432", ":6543"),
    ssl: { rejectUnauthorized: false }
});

async function showPatterns() {
    try {
        await client.connect();

        // Get Binomial Distribution topic ID
        const topicRes = await client.query("SELECT id, name FROM topics WHERE name LIKE '%Binomial%';");
        console.log("Binomial topic:", topicRes.rows);

        if (topicRes.rows.length > 0) {
            const topicId = topicRes.rows[0].id;
            const patternsRes = await client.query("SELECT id, pattern FROM patterns WHERE topic_id = $1;", [topicId]);
            console.log("\nPatterns for Binomial Distribution:");
            patternsRes.rows.forEach(p => console.log(`  ${p.id}: ${p.pattern}`));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

showPatterns();
