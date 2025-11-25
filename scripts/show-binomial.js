const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function showBinomial() {
    try {
        await client.connect();
        const res = await client.query("SELECT id, name FROM topics WHERE name ILIKE '%Binomial%'");
        if (res.rows.length === 0) {
            console.log("Topic 'Binomial Distribution' not found.");
            return;
        }
        const topic = res.rows[0];
        console.log(`Topic: ${topic.name} (ID: ${topic.id})`);

        const patterns = await client.query("SELECT * FROM patterns WHERE topic_id = $1 ORDER BY id", [topic.id]);
        if (patterns.rows.length === 0) {
            console.log("No patterns found.");
        } else {
            patterns.rows.forEach(p => {
                console.log(`- [${p.gemini_generated ? 'AI' : 'Manual'}] ${p.pattern}`);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

showBinomial();
