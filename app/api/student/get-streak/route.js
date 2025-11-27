import client from "@/lib/db";

export async function POST(request) {
    try {
        const { userId, topicId, patternId, difficulty } = await request.json();

        if (!userId || !topicId || !patternId || !difficulty) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const res = await client.query(
            `SELECT current_streak FROM streaks 
       WHERE user_id = $1 AND topic_id = $2 AND pattern_id = $3 AND difficulty = $4`,
            [userId, topicId, patternId, difficulty]
        );

        const streak = res.rows.length > 0 ? res.rows[0].current_streak : 0;

        return Response.json({ streak });

    } catch (err) {
        console.error("Get Streak Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
