import client from "@/lib/db";

export async function POST(request) {
    try {
        const { userId, questionId, reactionType } = await request.json();

        if (!userId || !questionId || !reactionType) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!['like', 'flag'].includes(reactionType)) {
            return Response.json({ error: "Invalid reaction type" }, { status: 400 });
        }

        // Insert or update reaction (UPSERT)
        await client.query(
            `INSERT INTO question_reactions (question_id, user_id, reaction_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (question_id, user_id, reaction_type) DO NOTHING`,
            [questionId, userId, reactionType]
        );

        // Update question counts
        if (reactionType === 'like') {
            await client.query(
                `UPDATE questions 
         SET likes_count = (SELECT COUNT(*) FROM question_reactions WHERE question_id = $1 AND reaction_type = 'like'),
             quality_score = (SELECT COUNT(*) FROM question_reactions WHERE question_id = $1 AND reaction_type = 'like') 
                           - (SELECT COUNT(*) FROM question_reactions WHERE question_id = $1 AND reaction_type = 'flag') * 2
         WHERE id = $1`,
                [questionId]
            );
        } else {
            await client.query(
                `UPDATE questions 
         SET flags_count = (SELECT COUNT(*) FROM question_reactions WHERE question_id = $1 AND reaction_type = 'flag'),
             quality_score = (SELECT COUNT(*) FROM question_reactions WHERE question_id = $1 AND reaction_type = 'like') 
                           - (SELECT COUNT(*) FROM question_reactions WHERE question_id = $1 AND reaction_type = 'flag') * 2
         WHERE id = $1`,
                [questionId]
            );
        }

        return Response.json({ success: true });

    } catch (err) {
        console.error("Add Reaction Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
