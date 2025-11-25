const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function createSavedQuestionsTable() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS saved_questions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        topic_id INTEGER REFERENCES topics(id),
        pattern_id INTEGER REFERENCES patterns(id),
        difficulty TEXT,
        question_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await client.query(createTableQuery);
        console.log("Created 'saved_questions' table.");

    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await client.end();
        console.log("Disconnected.");
    }
}

createSavedQuestionsTable();
