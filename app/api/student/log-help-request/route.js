import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
    try {
        const { userId, questionText, inputMode, detectedTopic, detectedPattern, wasSaved } = await request.json();

        if (!userId || !questionText || !inputMode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO student_help_requests 
                (user_id, question_text, input_mode, detected_topic, detected_pattern, was_saved) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, questionText, inputMode, detectedTopic, detectedPattern, wasSaved || false]
            );

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error logging help request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
