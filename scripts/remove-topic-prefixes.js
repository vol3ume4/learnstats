const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL.replace(":5432", ":6543"),
    ssl: { rejectUnauthorized: false }
});

async function removeTopicPrefixes() {
    try {
        await client.connect();

        // Show current topics
        console.log("Current topics:");
        const before = await client.query("SELECT id, name FROM topics ORDER BY id;");
        before.rows.forEach(t => console.log(`  ${t.id}: ${t.name}`));

        // Remove prefixes like "1. ", "2. ", etc.
        const result = await client.query(`
            UPDATE topics 
            SET name = TRIM(SUBSTRING(name FROM POSITION('. ' IN name) + 2))
            WHERE name ~ '^\\d+\\. '
        `);

        console.log(`\n✅ Updated ${result.rowCount} topics`);

        // Show updated topics
        console.log("\nUpdated topics:");
        const after = await client.query("SELECT id, name FROM topics ORDER BY id;");
        after.rows.forEach(t => console.log(`  ${t.id}: ${t.name}`));

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.end();
    }
}

removeTopicPrefixes();
