import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
    try {
        const { draftId } = await request.json();

        if (!draftId) {
            return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const query = "DELETE FROM saved_questions WHERE id = $1";
            await client.query(query, [draftId]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error deleting draft:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
