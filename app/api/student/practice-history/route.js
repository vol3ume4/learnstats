import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
    try {
        const { userId, topicId, patternId, difficulty } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            let query = `
        SELECT 
          a.id,
          a.question_id,
          a.user_answer,
          a.correct,
          a.student_remark,
          a.used_hint_stats,
          a.used_hint_python,
          a.created_at,
          q.question_text,
          q.solution_stats,
          q.solution_python,
          t.name as topic_name,
          p.pattern as pattern_name,
          a.difficulty
        FROM practice_history a
        INNER JOIN questions q ON a.question_id = q.id
        INNER JOIN topics t ON a.topic_id = t.id
        INNER JOIN patterns p ON a.pattern_id = p.id
        WHERE a.user_id = $1
      `;

            const params = [userId];
            let paramIndex = 2;

            if (topicId) {
                query += ` AND a.topic_id = $${paramIndex}`;
                params.push(topicId);
                paramIndex++;
            }

            if (patternId) {
                query += ` AND a.pattern_id = $${paramIndex}`;
                params.push(patternId);
                paramIndex++;
            }

            if (difficulty && difficulty !== "All") {
                query += ` AND a.difficulty = $${paramIndex}`;
                params.push(difficulty);
                paramIndex++;
            }

            query += ` ORDER BY a.created_at DESC LIMIT 50`;

            const result = await client.query(query, params);

            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching practice history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
