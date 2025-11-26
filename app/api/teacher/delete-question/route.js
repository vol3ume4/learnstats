import client from "@/lib/db";

export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return Response.json({ error: "Missing question ID" }, { status: 400 });
        }

        const res = await client.query(
            "DELETE FROM questions WHERE id = $1 RETURNING id",
            [id]
        );

        if (res.rowCount === 0) {
            return Response.json({ error: "Question not found" }, { status: 404 });
        }

        return Response.json({ success: true, id: res.rows[0].id });
    } catch (err) {
        console.error("Delete Question Error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
