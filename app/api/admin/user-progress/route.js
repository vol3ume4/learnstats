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
                "SELECT is_admin FROM profiles WHERE id = $1",
                [userId]
            );

            if (!adminCheck.rows[0]?.is_admin) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }

            // 1. Get all users
            // Note: email might not be in profiles table depending on setup
            const usersQuery = `
                SELECT id, created_at 
                FROM profiles 
                ORDER BY created_at DESC
            `;
            const usersRes = await client.query(usersQuery);
            const users = usersRes.rows;

            // 2. Get all streaks
            const streaksQuery = `
                SELECT user_id, topic_id, pattern_id, difficulty, current_streak
                FROM streaks
            `;
            const streaksRes = await client.query(streaksQuery);

            // 3. Get topic and pattern info
            const metadataQuery = `
                SELECT t.id as topic_id, t.name as topic_name, p.id as pattern_id
                FROM topics t
                LEFT JOIN patterns p ON p.topic_id = t.id
            `;
            const metadataRes = await client.query(metadataQuery);

            // Process metadata
            const topicMap = {}; // topicId -> { name, patternIds: Set }
            metadataRes.rows.forEach(row => {
                if (!topicMap[row.topic_id]) {
                    topicMap[row.topic_id] = { name: row.topic_name, patternIds: new Set() };
                }
                if (row.pattern_id) {
                    topicMap[row.topic_id].patternIds.add(row.pattern_id);
                }
            });

            // Process streaks per user
            const userProgress = {}; // userId -> { patternKey: { Easy: X, Medium: Y, Hard: Z } }

            streaksRes.rows.forEach(row => {
                if (!userProgress[row.user_id]) userProgress[row.user_id] = {};
                const key = `${row.topic_id}-${row.pattern_id}`;
                if (!userProgress[row.user_id][key]) userProgress[row.user_id][key] = {};
                userProgress[row.user_id][key][row.difficulty] = row.current_streak;
            });

            // Build final response
            const results = users.map(user => {
                const progress = userProgress[user.id] || {};
                const topicStats = [];
                let totalCompletedPatterns = 0;

                Object.keys(topicMap).forEach(topicId => {
                    const topic = topicMap[topicId];
                    let completedInTopic = 0;
                    const totalInTopic = topic.patternIds.size;

                    if (totalInTopic === 0) return;

                    topic.patternIds.forEach(patternId => {
                        const key = `${topicId}-${patternId}`;
                        const p = progress[key] || {};
                        const isCompleted = (p['Easy'] || 0) >= 3 && (p['Medium'] || 0) >= 4 && (p['Hard'] || 0) >= 5;
                        if (isCompleted) completedInTopic++;
                    });

                    if (completedInTopic > 0) {
                        topicStats.push({
                            name: topic.name,
                            completed: completedInTopic,
                            total: totalInTopic
                        });
                        totalCompletedPatterns += completedInTopic;
                    }
                });

                return {
                    id: user.id,
                    email: user.email || "User " + user.id.substring(0, 6),
                    joinedAt: user.created_at,
                    completedPatternsCount: totalCompletedPatterns,
                    topics: topicStats
                };
            });

            return NextResponse.json(results);

        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching user progress:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
