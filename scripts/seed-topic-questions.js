const { Client } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

// --- CONFIGURATION ---
const TARGET_COUNT = 30;
const BATCH_SIZE = 5; // Generate 5 at a time to maintain quality context
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

// Get Topic Name from command line argument
const targetTopicName = process.argv[2];

if (!targetTopicName) {
    console.error("❌ Error: Please provide a topic name (or partial name) as an argument.");
    console.error("Usage: node scripts/seed-topic-questions.js \"Binomial\"");
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        temperature: 0.7, // Slightly creative but focused
        maxOutputTokens: 8192,
    }
});

async function generateBatch(topicName, patternText, difficulty, approach) {
    const prompt = `
You are an expert Statistics Professor creating exam-quality questions for a university-level course.
Your task is to generate ${BATCH_SIZE} distinct practice questions.

CONTEXT:
- TOPIC: "${topicName}"
- PATTERN: "${patternText}"
- DIFFICULTY: ${difficulty}

${approach ? `TEACHER'S PREFERRED APPROACH:\n${approach}\n` : ""}

================================================================================
STRICT DIFFICULTY DEFINITIONS (MUST BE RESPECTED)
================================================================================
🟢 EASY (Beginner / Drill):
- **Structure:** Direct, explicit, "plug-and-chug".
- **Content:** All parameters (n, p, mean, sd, etc.) are explicitly stated in the text.
- **Task:** Student simply identifies the numbers and applies the formula.
- **Ambiguity:** None.
- **Example:** "Given a Binomial distribution with n=10 and p=0.5, calculate P(X=5)."

🟡 MEDIUM (Standard Exam Question):
- **Structure:** Classic textbook word problem.
- **Content:** Parameters are embedded in a real-world scenario (e.g., coin flips, quality control, surveys).
- **Task:** Student must translate the story into statistical terms (e.g., "70% of people..." -> p=0.7) and then solve.
- **Ambiguity:** Low. The mapping to the concept should be straightforward.

🔴 HARD (Advanced / Challenge):
- **Structure:** Complex, multi-step, or ambiguous scenario.
- **Content:** Real-world messiness. Parameters might need to be derived or inferred.
- **Task:** Student must first figure out *which* method applies, or handle conditional logic (e.g., "at least 2 but fewer than 5").
- **Ambiguity:** Moderate. Requires deep conceptual understanding, not just formula memorization.

================================================================================
QUALITY STANDARDS
================================================================================
1. **Realism:** Use varied contexts (Business, Medicine, Sports, Engineering, Social Science). Do not repeat the same "coin flip" or "dice roll" context for every question.
2. **Clarity:** Wording must be precise and unambiguous.
3. **Numeric Answers:** All questions MUST result in a specific numerical answer.
4. **Valid Parameters:** Ensure probabilities are between 0-1, standard deviations are positive, sample sizes are integers, etc.

================================================================================
OUTPUT FORMAT (JSON ONLY)
================================================================================
Return a JSON array of ${BATCH_SIZE} objects. 
Do not include any markdown formatting, code fences, or explanation outside the JSON.

[
  {
    "question_text": "The full text of the question...",
    "correct_answer": "The specific numeric answer (e.g., '0.25', '14.5'). Do not include units or variable names here.",
    "hint_stats": "A conceptual hint explaining the statistical principle (e.g., 'Recall that for independent events...').",
    "hint_python": "A hint on which Python/SciPy function to use (e.g., 'Use binom.pmf(k, n, p)').",
    "solution_stats": "Step-by-step mathematical derivation.",
    "solution_python": "Complete Python code snippet to solve the problem."
  }
]
`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        // Clean up markdown if present
        if (text.startsWith("```")) {
            text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
        }
        return JSON.parse(text);
    } catch (err) {
        console.error(`   ❌ Generation Error: ${err.message}`);
        return [];
    }
}

async function seedTopic() {
    try {
        await client.connect();
        console.log("🔌 Connected to DB.");

        // 1. Find the specific topic
        const topicRes = await client.query(
            "SELECT id, name, teacher_preferred_approach FROM topics WHERE name ILIKE $1",
            [`%${targetTopicName}%`]
        );

        if (topicRes.rows.length === 0) {
            console.error(`❌ Topic matching "${targetTopicName}" not found.`);
            return;
        }

        const topic = topicRes.rows[0];
        console.log(`\n🎯 TARGET TOPIC: ${topic.name} (ID: ${topic.id})`);
        console.log(`   Goal: ${TARGET_COUNT} questions per Pattern/Difficulty`);

        // 2. Get patterns for this topic
        const patternRes = await client.query(
            "SELECT id, pattern, teacher_preferred_approach FROM patterns WHERE topic_id = $1 ORDER BY id",
            [topic.id]
        );

        const patterns = patternRes.rows;
        if (patterns.length === 0) {
            console.log("⚠️ No patterns found for this topic.");
            return;
        }

        console.log(`   Found ${patterns.length} patterns.`);

        // 3. Iterate Patterns & Difficulties
        for (const p of patterns) {
            console.log(`\n🔹 PATTERN: ${p.pattern}`);
            const combinedApproach = (topic.teacher_preferred_approach || "") + "\n" + (p.teacher_preferred_approach || "");

            for (const diff of DIFFICULTIES) {
                // Check current count
                const countRes = await client.query(
                    "SELECT COUNT(*) FROM questions WHERE pattern_id = $1 AND difficulty = $2",
                    [p.id, diff]
                );
                const currentCount = parseInt(countRes.rows[0].count);
                const needed = Math.max(0, TARGET_COUNT - currentCount);

                if (needed === 0) {
                    console.log(`   ✅ [${diff}] Complete (${currentCount}/${TARGET_COUNT})`);
                    continue;
                }

                console.log(`   🔄 [${diff}] Has ${currentCount}. Generating ${needed} more...`);

                let added = 0;
                let failures = 0;

                while (added < needed) {
                    if (failures > 3) {
                        console.error("   ❌ Too many failures. Skipping this batch.");
                        break;
                    }

                    // Generate
                    const questions = await generateBatch(topic.name, p.pattern, diff, combinedApproach);

                    if (!questions || questions.length === 0) {
                        failures++;
                        continue;
                    }

                    // Save
                    for (const q of questions) {
                        // Safety check for empty fields
                        if (!q.question_text || !q.correct_answer) continue;

                        const ans = typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : String(q.correct_answer);

                        await client.query(
                            `INSERT INTO questions 
               (topic_id, pattern_id, difficulty, question_text, correct_answer, hint_stats, hint_python, solution_stats, solution_python, created_by, source)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ai_seed_v2')`,
                            [
                                topic.id,
                                p.id,
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
                    process.stdout.write(`      +${questions.length} saved (` + (currentCount + added) + `/${TARGET_COUNT})\r`);
                }
                console.log(""); // New line after batch
            }
        }

        console.log("\n✨ Seeding complete for topic: " + topic.name);

    } catch (err) {
        console.error("❌ Fatal Error:", err);
    } finally {
        await client.end();
    }
}

seedTopic();
