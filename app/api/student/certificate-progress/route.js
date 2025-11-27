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
            // Get all topics with their patterns
            const topicsQuery = `
                SELECT 
                    t.id as topic_id,
                    t.name as topic_name,
                    p.id as pattern_id,
                    p.pattern as pattern_name
                FROM topics t
                LEFT JOIN patterns p ON p.topic_id = t.id
                ORDER BY t.id, p.id
            `;
            const topicsResult = await client.query(topicsQuery);

            // Get user's streak progress for all patterns
            const streaksQuery = `
                SELECT 
                    topic_id,
                    pattern_id,
                    difficulty,
                    current_streak
                FROM user_streaks
                WHERE user_id = $1
            `;
            const streaksResult = await client.query(streaksQuery, [userId]);

            // Build a map of user's progress
            const progressMap = {};
            streaksResult.rows.forEach(row => {
                const key = `${row.topic_id}-${row.pattern_id}`;
                if (!progressMap[key]) {
                    progressMap[key] = {};
                }
                progressMap[key][row.difficulty] = row.current_streak;
            });

            // Group patterns by topic
            const topicsData = {};
            topicsResult.rows.forEach(row => {
                if (!row.pattern_id) return; // Skip topics with no patterns

                if (!topicsData[row.topic_id]) {
                    topicsData[row.topic_id] = {
                        id: row.topic_id,
                        name: row.topic_name,
                        patterns: []
                    };
                }

                const key = `${row.topic_id}-${row.pattern_id}`;
                const progress = progressMap[key] || {};

                // Check if pattern is completed (3-4-5 streaks)
                const easyStreak = progress['Easy'] || 0;
                const mediumStreak = progress['Medium'] || 0;
                const hardStreak = progress['Hard'] || 0;

                const isCompleted = easyStreak >= 3 && mediumStreak >= 4 && hardStreak >= 5;
                const hasProgress = easyStreak > 0 || mediumStreak > 0 || hardStreak > 0;

                topicsData[row.topic_id].patterns.push({
                    id: row.pattern_id,
                    name: row.pattern_name,
                    completed: isCompleted,
                    hasProgress: hasProgress,
                    streaks: {
                        easy: easyStreak,
                        medium: mediumStreak,
                        hard: hardStreak
                    }
                });
            });

            // Convert to array and filter out topics with no user progress
            const topics = Object.values(topicsData).filter(topic =>
                topic.patterns.some(p => p.hasProgress)
            );

            return NextResponse.json({ topics });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching certificate progress:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
