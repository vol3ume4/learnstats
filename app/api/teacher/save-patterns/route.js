import client from "@/lib/db";

export async function POST(request) {
  try {
    const { topicId, patterns, userId } = await request.json();

    console.log("### RAW RECEIVED PATTERNS:", patterns);

    if (
      !topicId ||
      !patterns ||
      !Array.isArray(patterns) ||
      patterns.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid topicId or patterns" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // -----------------------------------------------------
    // FIX: Convert simple string array → structured pattern objects
    // UI sends: ["pattern1", "pattern2"]
    // Expected format internally: [{ pattern: "...", teacher_preferred_approach: null }]
    // -----------------------------------------------------
    const cleaned = patterns
      .map((item) => {
        const text =
          typeof item === "string"
            ? item
            : item?.pattern || "";

        const normalized = text.replace(/\s+/g, " ").trim();
        if (!normalized) return null;

        return {
          pattern: normalized,
          teacher_preferred_approach: null, // set null on creation
        };
      })
      .filter(Boolean);

    console.log("### CLEANED PATTERNS (after normalization):", cleaned);

    // -----------------------------------------------------
    // INSERT OR IGNORE (unique: topic_id + pattern)
    // -----------------------------------------------------
    for (const entry of cleaned) {
      const { pattern, teacher_preferred_approach } = entry;

      try {
        await client.query(
          `
          INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, created_by, gemini_generated)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (topic_id, pattern)
          DO NOTHING
          `,
          [topicId, pattern, teacher_preferred_approach, userId]
        );
      } catch (err) {
        console.error("Insert failed for pattern:", pattern, err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Save Patterns Error (outer):", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
