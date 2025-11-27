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

        // Check if streak goal is met and unlock next difficulty
        const STREAK_GOALS = { 'Easy': 3, 'Medium': 4, 'Hard': 5 };
        const NEXT_DIFFICULTY = { 'Easy': 'Medium', 'Medium': 'Hard', 'Hard': null };

        let unlockedDifficulty = null;

        if (newStreak >= STREAK_GOALS[difficulty]) {
            const nextDiff = NEXT_DIFFICULTY[difficulty];
            if (nextDiff) {
                // Check if already unlocked
                const checkRes = await client.query(
                    `SELECT 1 FROM difficulty_unlocks 
               WHERE user_id = $1 AND topic_id = $2 AND pattern_id = $3 AND difficulty = $4`,
                    [userId, topicId, patternId, nextDiff]
                );

                if (checkRes.rows.length === 0) {
                    // Unlock next difficulty
                    await client.query(
                        `INSERT INTO difficulty_unlocks (user_id, topic_id, pattern_id, difficulty)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                        [userId, topicId, patternId, nextDiff]
                    );
                    unlockedDifficulty = nextDiff;
                }
            }
        }

        return Response.json({
            streak: newStreak,
            unlockedDifficulty
        });

    } catch (err) {
        console.error("Update Streak Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
