import client from "@/lib/db";

export async function POST(request) {
    try {
        const { userId, topicId, patternId } = await request.json();

        if (!userId || !topicId || !patternId) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get unlocked difficulties for this user/topic/pattern
        const res = await client.query(
            `SELECT difficulty FROM difficulty_unlocks 
       WHERE user_id = $1 AND topic_id = $2 AND pattern_id = $3`,
            [userId, topicId, patternId]
        );

        const unlocked = res.rows.map(r => r.difficulty);

        // If no unlocks found, ensure Easy is unlocked
        if (unlocked.length === 0) {
            await client.query(
                `INSERT INTO difficulty_unlocks (user_id, topic_id, pattern_id, difficulty)
         VALUES ($1, $2, $3, 'Easy')
         ON CONFLICT DO NOTHING`,
                [userId, topicId, patternId]
            );
            unlocked.push('Easy');
        }

        return Response.json({ unlocked });

    } catch (err) {
        console.error("Get Unlocked Difficulties Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
