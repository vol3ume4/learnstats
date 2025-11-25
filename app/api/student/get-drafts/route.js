import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const query = `
        SELECT sq.id, sq.topic_id, sq.pattern_id, sq.difficulty, sq.question_data, sq.created_at,
               t.name as topic_name, p.pattern as pattern_name
        FROM saved_questions sq
        LEFT JOIN topics t ON sq.topic_id = t.id
        LEFT JOIN patterns p ON sq.pattern_id = p.id
        WHERE sq.user_id = $1
        ORDER BY sq.created_at DESC
      `;
            const res = await client.query(query, [userId]);

            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching drafts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
