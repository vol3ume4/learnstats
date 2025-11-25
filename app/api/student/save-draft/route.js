import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
    try {
        const { userId, topicId, patternId, difficulty, questionData } = await request.json();

        if (!userId || !questionData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check if a draft already exists for this exact question (optional, but good to prevent dupes)
            // For now, we'll just insert. If they save multiple times, they get multiple drafts.
            // Or we could update if one exists for this user/topic/pattern? 
            // Let's stick to simple insert for now, maybe with a limit check later.

            const query = `
        INSERT INTO saved_questions (user_id, topic_id, pattern_id, difficulty, question_data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
            const values = [userId, topicId, patternId, difficulty, questionData];
            const res = await client.query(query, values);

            return NextResponse.json({ success: true, id: res.rows[0].id });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error saving draft:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
