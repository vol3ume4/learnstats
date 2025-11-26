import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    try {
        const { text, image, topicName, patternName, difficulty } = await request.json();

        if (!text && !image) {
            return NextResponse.json(
                { error: "Please provide either text or an image." },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";
        let imagePart = null;

        if (image) {
            // Image processing prompt
            prompt = `
        You are an expert statistics tutor. 
        1. Extract the statistics question text from this image.
        2. Then, solve it and provide the following details in JSON format.
        
        Context:
        Topic: ${topicName || "General Statistics"}
        Pattern: ${patternName || "General"}
        Difficulty: ${difficulty || "Medium"}

        Output JSON format:
        {
          "question_text": "The extracted question text...",
          "correct_answer": "The final numeric or categorical answer",
          "hint_stats": "A conceptual hint without giving the answer",
          "hint_python": "A hint on which Python libraries or functions to use",
          "solution_stats": "Step-by-step statistical derivation",
          "solution_python": "Complete Python code to solve the problem"
        }
      `;

            // Remove header if present (e.g., "data:image/png;base64,")
            const base64Data = image.split(",")[1] || image;

            imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png", // Assuming PNG or JPEG, Gemini handles standard types
                },
            };

        } else {
            // Text processing prompt
            prompt = `
        You are an expert statistics tutor.
        1. Refine the following question text to be clear and professional.
        2. Solve it and provide the details in JSON format.

        Raw Question: "${text}"

        Context:
        Topic: ${topicName || "General Statistics"}
        Pattern: ${patternName || "General"}
        Difficulty: ${difficulty || "Medium"}

        Output JSON format:
        {
          "question_text": "The refined question text...",
          "correct_answer": "The final numeric or categorical answer",
          "hint_stats": "A conceptual hint without giving the answer",
          "hint_python": "A hint on which Python libraries or functions to use",
          "solution_stats": "Step-by-step statistical derivation",
          "solution_python": "Complete Python code to solve the problem"
        }
      `;
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
