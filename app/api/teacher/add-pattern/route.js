import client from "@/lib/db";

export async function POST(request) {
    try {
        const { topicId, pattern, userId } = await request.json();

        if (!topicId || !pattern) {
            return new Response(JSON.stringify({ error: "Missing topicId or pattern" }), {
                status: 400,
            });
        }

        const res = await client.query(
            `INSERT INTO patterns (topic_id, pattern, created_by, gemini_generated) 
       VALUES ($1, $2, $3, false) 
       ON CONFLICT (topic_id, pattern) DO NOTHING
       RETURNING id, pattern`,
            [topicId, pattern, userId]
        );

        if (res.rows.length === 0) {
            // Pattern likely existed
            return new Response(JSON.stringify({ message: "Pattern already exists" }), { status: 200 });
        }

        return new Response(JSON.stringify(res.rows[0]), { status: 200 });
    } catch (err) {
        console.error("Error adding pattern:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
