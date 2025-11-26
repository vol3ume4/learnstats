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
You are an expert statistics tutor.

STEP 1: Check if this image contains a valid statistics question. If not (e.g., random text, doodles), return:
{
  "is_valid_question": false,
  "message": "This doesn't appear to be a statistics question. Please upload a clear question."
}

STEP 2: If valid, extract and classify the question.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Select detected_topic by copying ONE EXACT string from this list:
- ${topicsList}

2. Select detected_pattern by copying ONE EXACT string from this list (DO NOT use "General" or any other value):
- ${patternsList}

3. If you cannot confidently match, choose the closest one from the lists above.

Output JSON:
{
  "is_valid_question": true,
  "question_text": "...",
  "detected_topic": "EXACT topic name from the list above",
  "detected_pattern": "EXACT pattern name from the list above",
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
You are an expert statistics tutor.

STEP 1: Check if this is a valid statistics question: "${text}"
If not (e.g., "test", "hello", random text), return:
{
  "is_valid_question": false,
  "message": "This doesn't appear to be a statistics question. Please enter a proper question."
}

STEP 2: If valid, refine and classify.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Select detected_topic by copying ONE EXACT string from this list:
- ${topicsList}

2. Select detected_pattern by copying ONE EXACT string from this list (DO NOT use "General" or any other value):
- ${patternsList}

3. If you cannot confidently match, choose the closest one from the lists above.

Output JSON:
{
  "is_valid_question": true,
  "question_text": "...",
  "detected_topic": "EXACT topic name from the list above",
  "detected_pattern": "EXACT pattern name from the list above",
  "correct_answer": "...",
  "hint_stats": "...",
  "hint_python": "...",
  "solution_stats": "...",
  "solution_python": "..."
}
                `;
            }

        } else {
            // Teacher mode: Just enrich with given topic/pattern
            if (image) {
                prompt = `
You are an expert statistics tutor.
Extract the statistics question from this image and solve it.

Context:
Topic: ${topicName || "General Statistics"}
Pattern: ${patternName || "General"}
Difficulty: ${difficulty || "Medium"}

Output JSON:
{
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
You are an expert statistics tutor.
Refine this question and solve it: "${text}"

Context:
Topic: ${topicName || "General Statistics"}
Pattern: ${patternName || "General"}
Difficulty: ${difficulty || "Medium"}

Output JSON:
{
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
