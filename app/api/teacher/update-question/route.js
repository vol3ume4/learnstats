import client from "@/lib/db";

export async function POST(request) {
    try {
        const { id, question_text, correct_answer, hint_stats, hint_python, solution_stats, solution_python } = await request.json();

        if (!id) {
            return Response.json({ error: "Missing question ID" }, { status: 400 });
        }

        const res = await client.query(
            `UPDATE questions 
       SET question_text = $1, 
           correct_answer = $2, 
           hint_stats = $3, 
           hint_python = $4, 
           solution_stats = $5, 
           solution_python = $6
       WHERE id = $7
       RETURNING *`,
            [question_text, correct_answer, hint_stats, hint_python, solution_stats, solution_python, id]
        );

        if (res.rowCount === 0) {
            return Response.json({ error: "Question not found" }, { status: 404 });
        }

        return Response.json({ success: true, question: res.rows[0] });
    } catch (err) {
        console.error("Update Question Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
