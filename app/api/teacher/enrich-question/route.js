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

        {
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
If not(e.g., "test", "hello", random text), return:
        {
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
        Topic: ${ topicName || "General Statistics" }
        Pattern: ${ patternName || "General" }
        Difficulty: ${ difficulty || "Medium" }

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
        Topic: ${ topicName || "General Statistics" }
        Pattern: ${ patternName || "General" }
        Difficulty: ${ difficulty || "Medium" }

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
