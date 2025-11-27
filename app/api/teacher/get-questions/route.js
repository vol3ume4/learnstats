import client from "@/lib/db";

export async function POST(request) {
    try {
        const { topicId, patternId, difficulty } = await request.json();
        console.log(`[get-questions] Request: Topic=${topicId}, Pattern=${patternId}, Diff=${difficulty}`);

        if (!topicId || !patternId || !difficulty) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const res = await client.query(
            `SELECT * FROM questions 
       WHERE topic_id = $1 AND pattern_id = $2 AND difficulty = $3
       ORDER BY id DESC`,
            [topicId, patternId, difficulty]
        );

        return Response.json(res.rows);
    } catch (err) {
        console.error("Get Questions Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
