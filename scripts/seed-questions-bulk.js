const { Client } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const TARGET_COUNT = 5;
const BATCH_SIZE = 5;
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

async function generateBatch(topicName, patternText, difficulty, approach) {
    const prompt = `
Generate ${BATCH_SIZE} STATISTICS practice questions that strictly follow the pattern,
match the difficulty level, and follow the teacher's preferred approaches.

TOPIC: "${topicName}"
PATTERN: "${patternText}"
DIFFICULTY: ${difficulty}

${approach ? `TEACHER GUIDANCE:\n${approach}\n` : ""}

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
OUTPUT FORMAT (STRICT)
====================================================
Return ONLY a JSON array of ${BATCH_SIZE} objects:

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

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.startsWith("```")) {
            text = text.replace(/```json/i, "").replace(/```/g, "").trim();
        }
        return JSON.parse(text);
    } catch (err) {
        console.error("Generation failed:", err.message);
        return [];
    }
}

async function seedQuestions() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Get all patterns with their topics
        const res = await client.query(`
      SELECT p.id as pattern_id, p.pattern, p.teacher_preferred_approach as p_approach,
             t.id as topic_id, t.name as topic_name, t.teacher_preferred_approach as t_approach
      FROM patterns p
      JOIN topics t ON p.topic_id = t.id
    `);

        const patterns = res.rows;
        console.log(`Found ${patterns.length} patterns.`);

        for (const p of patterns) {
            const combinedApproach = (p.t_approach || "") + "\n" + (p.p_approach || "");

            for (const diff of DIFFICULTIES) {
                // Check count
                const countRes = await client.query(
                    "SELECT COUNT(*) FROM questions WHERE pattern_id = $1 AND difficulty = $2",
                    [p.pattern_id, diff]
                );
                const currentCount = parseInt(countRes.rows[0].count);

                if (currentCount >= TARGET_COUNT) {
                    console.log(`✅ ${p.topic_name} -> ${p.pattern} [${diff}]: ${currentCount}/${TARGET_COUNT} (Skipping)`);
                    continue;
                }

                const needed = TARGET_COUNT - currentCount;
                console.log(`🔄 ${p.topic_name} -> ${p.pattern} [${diff}]: ${currentCount}/${TARGET_COUNT} (Need ${needed})`);

                let added = 0;
                while (added < needed) {
                    console.log(`   Generating batch for ${diff}...`);
                    const questions = await generateBatch(p.topic_name, p.pattern, diff, combinedApproach);

                    if (questions.length === 0) {
                        console.log("   ⚠️ Generation failed or empty. Retrying...");
                        continue;
                    }

                    for (const q of questions) {
                        // Sanitize
                        const ans = typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : String(q.correct_answer);

                        await client.query(
                            `INSERT INTO questions 
               (topic_id, pattern_id, difficulty, question_text, correct_answer, hint_stats, hint_python, solution_stats, solution_python, created_by, source)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ai_seed')`,
                            [
                                p.topic_id,
                                p.pattern_id,
                                diff,
                                q.question_text,
                                ans,
                                q.hint_stats || "",
                                q.hint_python || "",
                                q.solution_stats || "",
                                q.solution_python || "",
                                "00000000-0000-0000-0000-000000000000" // System ID
                            ]
                        );
                    }
                    added += questions.length;
                    console.log(`   +${questions.length} saved. Total added: ${added}`);
                }
            }
        }

        console.log("Seeding complete!");
    } catch (err) {
        console.error("Seeding error:", err);
    } finally {
        await client.end();
    }
}

seedQuestions();
