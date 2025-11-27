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
            // Get total questions practiced
            const questionsQuery = `
        SELECT COUNT(DISTINCT question_id) as total_questions
        FROM practice_history
        WHERE user_id = $1
      `;
            const questionsResult = await client.query(questionsQuery, [userId]);

            // Get topics explored with pattern counts
            const topicsQuery = `
        SELECT 
          t.id,
          t.name,
          COUNT(DISTINCT a.pattern_id) as patterns_practiced
        FROM topics t
        INNER JOIN practice_history a ON a.topic_id = t.id
        WHERE a.user_id = $1
        GROUP BY t.id, t.name
        ORDER BY t.name
      `;
            const topicsResult = await client.query(topicsQuery, [userId]);

            // Get shared questions count
            const sharedQuery = `
                SELECT COUNT(*) as shared_count
                FROM questions
                WHERE created_by = $1 AND source = 'student_contribution'
            `;
            const sharedResult = await client.query(sharedQuery, [userId]);

            return NextResponse.json({
                totalQuestions: questionsResult.rows[0].total_questions || 0,
                topicsExplored: topicsResult.rows.length,
                sharedQuestions: sharedResult.rows[0].shared_count || 0,
                topics: topicsResult.rows
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
