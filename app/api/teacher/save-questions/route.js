import client from "@/lib/db";

function cleanText(x) {
  if (!x) return "";
  return String(x)
    .normalize("NFKC")
    .replace(/\u0000/g, "")
    .replace(/[\uFFFD]/g, "")
    .replace(/[^\t\n\r\x20-\x7E]+/g, " ");
}

export async function POST(request) {
  try {
    const { topicId, patternId, difficulty, questions, source, created_by, is_verified } = await request.json();

    if (!topicId || !questions || questions.length === 0) {
      return Response.json(
        { error: "Missing topicId or questions" },
        { status: 400 }
      );
    }

    for (const q of questions) {
      console.log("Attempting to save question:", {
        topicId,
        patternId,
        question_text: q.question_text.substring(0, 50),
        source
      });

      const result = await client.query(
        `
        INSERT INTO questions 
        (topic_id, pattern_id, difficulty,
         question_text, correct_answer,
         hint_stats, hint_python,
         solution_stats, solution_python,
         solution,
         source, created_by, is_verified)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (topic_id, pattern_id, question_text) 
        DO NOTHING
        RETURNING id
        `,
        [
          topicId,
          patternId || null,
          difficulty,

          cleanText(q.question_text),
          cleanText(q.correct_answer),

          cleanText(q.hint_stats),
          cleanText(q.hint_python),

          cleanText(q.solution_stats),
          cleanText(q.solution_python),

          cleanText(q.solution),

          source || 'ai_generated',
          created_by || null,
          is_verified !== undefined ? is_verified : true
        ]
      );

      if (result.rowCount === 0) {
        console.log("Question was a duplicate, skipped");
      } else {
        console.log("Question saved successfully with ID:", result.rows[0]?.id);
      }
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("Save Questions Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
