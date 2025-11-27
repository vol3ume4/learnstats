const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function addDifficultyUnlocks() {
    try {
        await client.connect();
        console.log("🔌 Connected to DB.");

        console.log("\n📊 Creating difficulty_unlocks table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS difficulty_unlocks (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        pattern_id INTEGER REFERENCES patterns(id) ON DELETE CASCADE,
        difficulty TEXT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, topic_id, pattern_id, difficulty)
      )
    `);
        console.log("✅ Table created");

        console.log("\n🔍 Creating indexes...");
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_unlocks_user 
      ON difficulty_unlocks(user_id)
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_unlocks_lookup 
      ON difficulty_unlocks(user_id, topic_id, pattern_id, difficulty)
    `);
        console.log("✅ Indexes created");

        console.log("\n🎯 Auto-unlocking Easy difficulty for all existing users...");
        // Give all users Easy difficulty for all topics/patterns
        await client.query(`
      INSERT INTO difficulty_unlocks (user_id, topic_id, pattern_id, difficulty)
      SELECT DISTINCT 
        p.id as user_id,
        t.id as topic_id,
        pat.id as pattern_id,
        'Easy' as difficulty
      FROM profiles p
      CROSS JOIN topics t
      CROSS JOIN patterns pat
      ON CONFLICT (user_id, topic_id, pattern_id, difficulty) DO NOTHING
    `);
        console.log("✅ Easy difficulty unlocked for all users");

        console.log("\n✨ Difficulty unlocking system setup complete!");

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await client.end();
    }
}

addDifficultyUnlocks();
