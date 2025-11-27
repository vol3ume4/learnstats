const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function addReactionSystem() {
    try {
        await client.connect();
        console.log("🔌 Connected to DB.");

        // 1. Add columns to questions table
        console.log("\n1️⃣ Adding reaction columns to questions table...");
        await client.query(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS flags_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 0
    `);
        console.log("✅ Columns added");

        // 2. Create question_reactions table
        console.log("\n2️⃣ Creating question_reactions table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS question_reactions (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'flag')),
        remark TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(question_id, user_id, reaction_type)
      )
    `);
        console.log("✅ Table created");

        // 3. Create index for performance
        console.log("\n3️⃣ Creating indexes...");
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reactions_question 
      ON question_reactions(question_id)
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reactions_user 
      ON question_reactions(user_id)
    `);
        console.log("✅ Indexes created");

        console.log("\n✨ Reaction system setup complete!");

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await client.end();
    }
}

addReactionSystem();
