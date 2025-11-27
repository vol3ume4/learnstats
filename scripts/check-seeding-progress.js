const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const TARGET = 30;

async function checkProgress() {
    try {
        await client.connect();
        console.log("📊 Seeding Progress Report\n");

        const topicsRes = await client.query(`
      SELECT id, name FROM topics 
      WHERE name NOT ILIKE '%Introduction to Data%'
        AND name NOT ILIKE '%Descriptive Statistics%'
        AND name NOT ILIKE '%Probability Basics%'
      ORDER BY id
    `);

        for (const topic of topicsRes.rows) {
            const patternsRes = await client.query(
                "SELECT id, pattern FROM patterns WHERE topic_id = $1 ORDER BY id",
                [topic.id]
            );

            if (patternsRes.rows.length === 0) continue;

            console.log(`\n📚 ${topic.name}`);

            let topicComplete = true;
            for (const pattern of patternsRes.rows) {
                const countsRes = await client.query(
                    `SELECT difficulty, COUNT(*) as count 
           FROM questions 
           WHERE topic_id = $1 AND pattern_id = $2 
           GROUP BY difficulty`,
                    [topic.id, pattern.id]
                );

                const counts = { Easy: 0, Medium: 0, Hard: 0 };
                countsRes.rows.forEach(r => counts[r.difficulty] = parseInt(r.count));

                const easy = counts.Easy >= TARGET ? '✅' : `❌ ${counts.Easy}`;
                const medium = counts.Medium >= TARGET ? '✅' : `❌ ${counts.Medium}`;
                const hard = counts.Hard >= TARGET ? '✅' : `❌ ${counts.Hard}`;

                if (counts.Easy < TARGET || counts.Medium < TARGET || counts.Hard < TARGET) {
                    topicComplete = false;
                }

                console.log(`   ${pattern.pattern.substring(0, 50).padEnd(50)} | E:${easy.padEnd(6)} M:${medium.padEnd(6)} H:${hard.padEnd(6)}`);
            }

            if (topicComplete) {
                console.log(`   ✨ COMPLETE`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

checkProgress();
