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
            // Check if user is admin
            const adminCheck = await client.query(
                "SELECT is_admin FROM profiles WHERE user_id = $1",
                [userId]
            );

            if (!adminCheck.rows[0]?.is_admin) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }

            // Get total users
            const totalUsersQuery = "SELECT COUNT(*) as count FROM profiles";
            const totalUsers = await client.query(totalUsersQuery);

            // Get active users (practiced in last 30 days)
            const activeUsersQuery = `
        SELECT COUNT(DISTINCT user_id) as count 
        FROM practice_history 
        WHERE created_at > NOW() - INTERVAL '30 days'
      `;
            const activeUsers = await client.query(activeUsersQuery);

            // Get total questions practiced
            const totalQuestionsQuery = "SELECT COUNT(*) as count FROM practice_history";
            const totalQuestions = await client.query(totalQuestionsQuery);

            // Get questions by difficulty
            const difficultyQuery = `
        SELECT difficulty, COUNT(*) as count 
        FROM practice_history 
        GROUP BY difficulty 
        ORDER BY difficulty
      `;
            const byDifficulty = await client.query(difficultyQuery);

            // Get top topics
            const topTopicsQuery = `
        SELECT t.name, COUNT(*) as count 
        FROM practice_history ph
        INNER JOIN topics t ON ph.topic_id = t.id
        GROUP BY t.name 
        ORDER BY count DESC 
        LIMIT 5
      `;
            const topTopics = await client.query(topTopicsQuery);

            // Get top patterns
            const topPatternsQuery = `
        SELECT p.pattern, COUNT(*) as count 
        FROM practice_history ph
        INNER JOIN patterns p ON ph.pattern_id = p.id
        GROUP BY p.pattern 
        ORDER BY count DESC 
        LIMIT 5
      `;
            const topPatterns = await client.query(topPatternsQuery);

            // Get new users in last 7 days
            const newUsersQuery = `
        SELECT COUNT(*) as count 
        FROM profiles 
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;
            const newUsers = await client.query(newUsersQuery);

            return NextResponse.json({
                totalUsers: parseInt(totalUsers.rows[0].count),
                activeUsers: parseInt(activeUsers.rows[0].count),
                totalQuestions: parseInt(totalQuestions.rows[0].count),
                byDifficulty: byDifficulty.rows,
                topTopics: topTopics.rows,
                topPatterns: topPatterns.rows,
                newUsersLast7Days: parseInt(newUsers.rows[0].count),
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
