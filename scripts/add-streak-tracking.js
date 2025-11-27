const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function addStreakTracking() {
    try {
        await client.connect();
        console.log("🔌 Connected to DB.");

        console.log("\n📊 Creating streaks table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        pattern_id INTEGER REFERENCES patterns(id) ON DELETE CASCADE,
        difficulty TEXT NOT NULL,
        current_streak INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, topic_id, pattern_id, difficulty)
      )
    `);
        console.log("✅ Streaks table created");

        console.log("\n🔍 Creating indexes...");
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_streaks_user 
      ON streaks(user_id)
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_streaks_lookup 
      ON streaks(user_id, topic_id, pattern_id, difficulty)
    `);
        console.log("✅ Indexes created");

        console.log("\n✨ Streak tracking setup complete!");

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await client.end();
    }
}

addStreakTracking();
