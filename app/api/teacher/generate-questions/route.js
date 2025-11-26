import { GoogleGenerativeAI } from "@google/generative-ai";
import client from "@/lib/db";

export async function POST(request) {
  try {
    const { patternId, patternText, difficulty, topicId } = await request.json();

    if (!patternId || !patternText) {
      return Response.json(
        { error: "Missing patternId or patternText" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 1. Load topic + pattern preferred approaches
    // ---------------------------------------------------------
    const topicRes = await client.query(
      "SELECT teacher_preferred_approach FROM topics WHERE id=$1",
      [topicId]
    );
    const patternRes = await client.query(
      "SELECT teacher_preferred_approach FROM patterns WHERE id=$1",
      [patternId]
    );

    const topicApproach = topicRes.rows[0]?.teacher_preferred_approach || "";
    const patternApproach = patternRes.rows[0]?.teacher_preferred_approach || "";

    // ---------------------------------------------------------
    // 2. Build combined preferred approach (only if provided)
    // ---------------------------------------------------------
    let combinedApproach = "";

    if (topicApproach || patternApproach) {
      combinedApproach = "TEACHER GUIDANCE:\n";

      if (topicApproach) {
        combinedApproach += `\nTopic-level approach:\n${topicApproach}\n`;
      }

      if (patternApproach) {
        combinedApproach += `\nPattern-specific approach:\n${patternApproach}\n`;
      }

      combinedApproach += "\nPlease incorporate this guidance when generating questions.\n";
    }

    // ---------------------------------------------------------
    // 3. Prepare Gemini model
    // ---------------------------------------------------------
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ---------------------------------------------------------
    // 4. The prompt
    // ---------------------------------------------------------
    const prompt = `
Generate 5 STATISTICS practice questions that strictly follow the pattern,
match the difficulty level, and follow the teacher's preferred approaches.

PATTERN: "${patternText}"
DIFFICULTY: ${difficulty}

${combinedApproach}

====================================================
DIFFICULTY GUIDELINES (STRICT)
====================================================
EASY:
- Direct statistical computation (plug-and-chug).
- All numbers explicitly provided in the text.
- One-step calculation.
- No interpretation required.

MEDIUM:
- Real-world scenario context.
- Student must identify the correct statistical concept/formula.
- May involve 1–2 steps.
- Still results in a numeric answer.

HARD:
- Complex real-world context with few hints.
- Student must infer the correct statistical method from ambiguity.
- Multi-step calculation.
- Requires deep understanding of the concept.
- Final answer must still be numeric.

====================================================
QUESTION RULES
====================================================
1. Only generate STATISTICS questions.
2. The question must strictly match the PATTERN.
3. Use valid statistical parameters (n, p, k, μ, σ, etc.).
4. Provide NUMERICAL final answers.
5. Provide TWO types of hints:
   - hint_stats  → natural-language stat hint
   - hint_python → python/scipy hint using the preferred approach
6. Provide TWO types of solutions:
   - solution_stats  → step-by-step stat reasoning
   - solution_python → python code using scipy or the teacher's preferred approach
7. Do NOT output JSON or objects anywhere inside question_text, hints, or solutions.
8. correct_answer MUST be a plain string.

====================================================
STUDENT ANSWER FORMAT
====================================================
At the END of each question_text, append a simple format explaining how students
should type the answer.

Examples:
- "Submit answer as: Mean = ___, SD = ___"
- "Answer format: mean ___ and variance ___"
- "Provide: p = ___"

No JSON.
No braces.
No quotes.

====================================================
OUTPUT FORMAT (STRICT)
====================================================
Return ONLY a JSON array of 5 objects:

[
  {
    "question_text": "...",
    "correct_answer": "... plain numeric string ...",
    "hint_stats": "...",
    "hint_python": "...",
    "solution_stats": "...",
    "solution_python": "..."
  }
]

Rules:
- No code fences
- No commentary
- No extra text
`;

    // ---------------------------------------------------------
    // 5. Gemini call
    // ---------------------------------------------------------
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    if (text.startsWith("```")) {
      text = text.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    const questions = JSON.parse(text);

    // ---------------------------------------------------------
    // 6. Sanitize fields
    // ---------------------------------------------------------
    for (const q of questions) {
      // Ensure correct_answer is ALWAYS a plain string
      if (typeof q.correct_answer === "object")
        q.correct_answer = JSON.stringify(q.correct_answer);

      if (typeof q.correct_answer !== "string")
        q.correct_answer = String(q.correct_answer);

      // Ensure blanks exist
      q.hint_stats = q.hint_stats || "";
      q.hint_python = q.hint_python || "";
      q.solution_stats = q.solution_stats || "";
      q.solution_python = q.solution_python || "";
    }

    return Response.json(questions);

  } catch (err) {
    console.error("Teacher Generate Questions Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
