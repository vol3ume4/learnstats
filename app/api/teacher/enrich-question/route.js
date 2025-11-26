import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    try {
        const { text, image, topicName, patternName, difficulty, existingPatterns, existingTopics, mode } = await request.json();

        if (!text && !image) {
            return NextResponse.json(
                { error: "Please provide either text or an image." },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";
        let imagePart = null;

        const isStudentMode = mode === "student";

        if (isStudentMode) {
            // Student mode: Full classification - NO DEFAULTS, only exact patterns
            if (!existingTopics || !existingPatterns || existingTopics.length === 0 || existingPatterns.length === 0) {
                return NextResponse.json(
                    { error: "Topic and pattern lists are required for student mode" },
                    { status: 400 }
                );
            }

            const topicsList = existingTopics.join("\n- ");
            const patternsList = existingPatterns.join("\n- ");

            if (image) {
                prompt = `
You are an expert statistics tutor with strict quality standards.

STEP 1: VALIDATE - Check if this image contains a valid, logically consistent statistics question.

REJECT if:
- Not a statistics question
- Logically inconsistent (e.g., "probability of heads when rolling a die" - dice don't have heads!)
- Incomplete or unclear
- Contains contradictions

If invalid, return:
{
  "is_valid_question": false,
  "message": "A polite, constructive explanation of why this is invalid (e.g., 'It seems there might be a mix-up - dice don't have heads. Did you mean a coin?'). Be helpful, not harsh."
}

STEP 2: If valid, extract and classify.

CRITICAL INSTRUCTIONS:
1. Select detected_topic from this EXACT list:
- ${topicsList}

2. Select detected_pattern from this EXACT list (DO NOT use "General"):
- ${patternsList}

3. Refine the question to fix typos and improve clarity, but ONLY if the logic is sound.

Output JSON:
{
  "is_valid_question": true,
  "question_text": "...",
  "detected_topic": "EXACT topic name from list",
  "detected_pattern": "EXACT pattern name from list",
  "correct_answer": "...",
  "hint_stats": "...",
  "hint_python": "...",
  "solution_stats": "...",
  "solution_python": "..."
}
                `;

                const base64Data = image.split(",")[1] || image;
                imagePart = {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png",
                    },
                };

            } else {
                prompt = `
You are an expert statistics tutor with strict quality standards.

STEP 1: VALIDATE - Check if this is a valid, logically consistent statistics question: "${text}"

REJECT if:
- Not a statistics question
- Logically inconsistent (e.g., "probability of heads when rolling a die" - dice don't have heads!)
- Incomplete or unclear
- Contains contradictions

If invalid, return:
{
  "is_valid_question": false,
  "message": "A polite, constructive explanation of why this is invalid (e.g., 'It seems there might be a mix-up - dice don't have heads. Did you mean a coin?'). Be helpful, not harsh."
}

STEP 2: If valid, refine and classify.

CRITICAL INSTRUCTIONS:
1. Select detected_topic from this EXACT list:
- ${topicsList}

2. Select detected_pattern from this EXACT list (DO NOT use "General"):
- ${patternsList}

3. Refine the question to fix typos and improve clarity, but ONLY if the logic is sound.

Output JSON:
{
  "is_valid_question": true,
  "question_text": "...",
  "detected_topic": "EXACT topic name from list",
  "detected_pattern": "EXACT pattern name from list",
  "correct_answer": "...",
  "hint_stats": "...",
  "hint_python": "...",
  "solution_stats": "...",
  "solution_python": "..."
}
                `;
            }

        } else {
            // Teacher mode: Validate and enrich with given topic/pattern
            if (image) {
                prompt = `
You are an expert statistics tutor with strict quality standards.

STEP 1: VALIDATE - Check if this image contains a valid, logically consistent statistics question.

REJECT if:
- Not a statistics question
- Logically inconsistent (e.g., "drawing a card from a die")
- Incomplete or unclear
- Contains contradictions
- DOES NOT MATCH the selected topic: "${topicName || "General Statistics"}" (e.g., asking about ANOVA when topic is Probability)

If invalid, return:
{
  "is_valid_question": false,
  "message": "A polite, professional explanation. If logic is wrong, gently point it out. If topic is wrong, say 'This question appears to be about [Actual Topic], but the selected topic is ${topicName}. Please switch topics or update the question.'"
}

STEP 2: If valid, extract and solve.

Context:
Topic: ${topicName || "General Statistics"}
Pattern: ${patternName || "General"}
Difficulty: ${difficulty || "Medium"}

Refine the question to fix typos and improve clarity, but ONLY if the logic is sound.

Output JSON:
{
  "is_valid_question": true,
  "question_text": "...",
  "correct_answer": "...",
  "hint_stats": "...",
  "hint_python": "...",
  "solution_stats": "...",
  "solution_python": "..."
}
                `;

                const base64Data = image.split(",")[1] || image;
                imagePart = {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png",
                    },
                };

            } else {
                prompt = `
You are an expert statistics tutor with strict quality standards.

STEP 1: VALIDATE - Check if this is a valid, logically consistent statistics question: "${text}"

REJECT if:
- Not a statistics question
- Logically inconsistent (e.g., "drawing a card from a die")
- Incomplete or unclear
- Contains contradictions
- DOES NOT MATCH the selected topic: "${topicName || "General Statistics"}" (e.g., asking about ANOVA when topic is Probability)

If invalid, return:
{
  "is_valid_question": false,
  "message": "A polite, professional explanation. If logic is wrong, gently point it out. If topic is wrong, say 'This question appears to be about [Actual Topic], but the selected topic is ${topicName}. Please switch topics or update the question.'"
}

STEP 2: If valid, refine and solve.

Context:
Topic: ${topicName || "General Statistics"}
Pattern: ${patternName || "General"}
Difficulty: ${difficulty || "Medium"}

Refine the question to fix typos and improve clarity, but ONLY if the logic is sound.

Output JSON:
{
  "is_valid_question": true,
  "question_text": "...",
  "correct_answer": "...",
  "hint_stats": "...",
  "hint_python": "...",
  "solution_stats": "...",
  "solution_python": "..."
}
                `;
            }
        }

        const result = await model.generateContent(
            image ? [prompt, imagePart] : [prompt]
        );

        const response = await result.response;
        const textResponse = response.text();

        // Extract JSON from response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse Gemini response");
        }

        const enrichedData = JSON.parse(jsonMatch[0]);

        return NextResponse.json(enrichedData);

    } catch (error) {
        console.error("Enrichment Error:", error);
        return NextResponse.json(
            { error: "Failed to process question. Please try again." },
            { status: 500 }
        );
    }
}
