import { GoogleGenerativeAI } from "@google/generative-ai";
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
