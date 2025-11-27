import client from "@/lib/db";

export async function POST(request) {
    try {
        const { userId, topicId, patternId, difficulty, isCorrect, usedHints } = await request.json();

        if (!userId || !topicId || !patternId || !difficulty || isCorrect === undefined) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        let newStreak = 0;

        if (isCorrect && !usedHints) {
            // Increment streak
            const res = await client.query(
                `INSERT INTO streaks (user_id, topic_id, pattern_id, difficulty, current_streak, last_updated)
         VALUES ($1, $2, $3, $4, 1, NOW())
         ON CONFLICT (user_id, topic_id, pattern_id, difficulty)
         DO UPDATE SET 
           current_streak = streaks.current_streak + 1,
           last_updated = NOW()
         RETURNING current_streak`,
                [userId, topicId, patternId, difficulty]
            );
            newStreak = res.rows[0].current_streak;
        } else {
            // Reset streak
            await client.query(
                `INSERT INTO streaks (user_id, topic_id, pattern_id, difficulty, current_streak, last_updated)
         VALUES ($1, $2, $3, $4, 0, NOW())
         ON CONFLICT (user_id, topic_id, pattern_id, difficulty)
         DO UPDATE SET 
           current_streak = 0,
           last_updated = NOW()`,
                [userId, topicId, patternId, difficulty]
            );
            newStreak = 0;
        }

        return Response.json({ streak: newStreak });

    } catch (err) {
        console.error("Update Streak Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
