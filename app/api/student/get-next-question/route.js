import client from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { userId, topicId, patternId, difficulty } = await request.json();

    // ---------------------------------------------------------
    // 1. Try to fetch an unattempted question
    // ---------------------------------------------------------
    const unattempted = await client.query(
      `
      SELECT q.*
      FROM questions q
      WHERE q.pattern_id = $1
        AND q.difficulty = $2
        AND q.id NOT IN (
          SELECT question_id FROM practice_history
          WHERE user_id = $3
        )
      ORDER BY RANDOM()
      LIMIT 1
      `,
      [patternId, difficulty, userId]
    );

    if (unattempted.rows.length > 0) {
      return Response.json(unattempted.rows[0]);
    }

    // ---------------------------------------------------------
    // 2. No unattempted → Generate NEW questions using Gemini
    // ---------------------------------------------------------

    // Load pattern + teacher approach
    const patternRes = await client.query(
      "SELECT pattern, teacher_preferred_approach FROM patterns WHERE id=$1",
      [patternId]
    );
    const patternText = patternRes.rows[0].pattern;
    const patternApproach = patternRes.rows[0].teacher_preferred_approach || "";

    // Load topic-level preferred approach
    const topicRes = await client.query(
      "SELECT teacher_preferred_approach FROM topics WHERE id=$1",
      [topicId]
    );
    const topicApproach = topicRes.rows[0].teacher_preferred_approach || "";

    const combinedApproach = [topicApproach, patternApproach]
      .filter(Boolean)
      .join("\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert statistics instructor and Python tutor.

Generate 5 STATISTICS questions that follow the PATTERN, TOPIC APPROACH, and DIFFICULTY.

PATTERN: "${patternText}"

PREFERRED APPROACH:
${combinedApproach}

DIFFICULTY: ${difficulty}

====================================================
OUTPUT FORMAT (array of 5 objects)
====================================================
[
  {
    "question_text": "...",
    "correct_answer": "...",
    "hint_stats": "...",
    "hint_python": "...",
    "solution_stats": "...",
    "solution_python": "...",
    "solution": "..."
  }
]

STRICT RULES:
- No code fences
- No commentary
- No JSON inside strings
- Python uses ONLY scipy.stats
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Remove accidental fences
    if (text.startsWith("```")) {
      text = text.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    const questions = JSON.parse(text);

    // Normalize answers
    for (const q of questions) {
      if (typeof q.correct_answer !== "string") {
        q.correct_answer = String(q.correct_answer);
      }
    }

    // ---------------------------------------------------------
    // 3. Save generated questions into DB
    // ---------------------------------------------------------
    for (const q of questions) {
      await client.query(
        `
        INSERT INTO questions 
        (topic_id, pattern_id, difficulty,
         question_text, correct_answer,
         hint_stats, hint_python,
         solution_stats, solution_python,
         solution)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (topic_id, pattern_id, question_text)
        DO NOTHING
        `,
        [
          topicId,
          patternId,
          difficulty,
          q.question_text,
          q.correct_answer,
          q.hint_stats || "",
          q.hint_python || "",
          q.solution_stats || "",
          q.solution_python || "",
          q.solution || ""
        ]
      );
    }

    // ---------------------------------------------------------
    // 4. Return one of the newly saved questions
    // ---------------------------------------------------------
    const saved = await client.query(
      `
      SELECT *
      FROM questions
      WHERE pattern_id=$1 AND difficulty=$2
      ORDER BY id DESC
      LIMIT 1
      `,
      [patternId, difficulty]
    );

    return Response.json(saved.rows[0]);

  } catch (err) {
    console.error("get-next-question error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
