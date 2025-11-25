const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const PATTERNS = [
    {
        pattern: "Properties of the Bell Curve",
        approach: "Decode: Identify key properties (Symmetry, Mean=Median=Mode, Total Area=1, Asymptotic). No Python needed."
    },
    {
        pattern: "Standard Normal Distribution (Z-Scores)",
        approach: "Decode: Given x, mu, sigma. Stats Formula: Z = (x - mu) / sigma. Explain that Z represents the number of standard deviations from the mean."
    },
    {
        pattern: "Empirical Rule (68-95-99.7)",
        approach: "Decode: Check if the range corresponds to exactly 1, 2, or 3 standard deviations. Stats: Apply the 68%, 95%, 99.7% rule for quick estimation without calculation."
    },
    {
        pattern: "Reading Z-Tables (Manual Lookup)",
        approach: "Decode: Given a Z-score, find the probability (or vice versa). Stats: Explain how to look up the value in a standard Z-table. Python Equivalent: `stats.norm.cdf(z)`."
    },
    {
        pattern: "Normal Distribution Calculations (CDF, SF, PPF, ISF)",
        approach: "Step 1: Decode the problem. Identify the Mean (mu), Std Dev (sigma), and what is asked. Step 2: Map the question to the correct function: 'Prob < x' -> CDF, 'Prob > x' -> SF (Survival Function), 'Value with prob p to the left' -> PPF (Percent Point Function), 'Value with prob p to the right' -> ISF (Inverse Survival Function). Step 3 (Python): Solve using ONLY `from scipy import stats` and `stats.norm.cdf`, `ppf`, `isf`, or `sf`. Do not use other libraries."
    }
];

async function updateNormalFull() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Get Topic ID
        const res = await client.query("SELECT id FROM topics WHERE name ILIKE '%Normal%'");
        if (res.rows.length === 0) {
            console.error("Topic 'Normal Distribution' not found.");
            return;
        }
        const topicId = res.rows[0].id;
        console.log(`Found Topic ID: ${topicId}`);

        // 2. Delete existing patterns for this topic
        console.log("Deleting old patterns...");
        await client.query("DELETE FROM patterns WHERE topic_id = $1", [topicId]);

        // 3. Insert new patterns
        console.log("Inserting new patterns...");
        for (const p of PATTERNS) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [topicId, p.pattern, p.approach]
            );
        }

        console.log("✅ Normal curriculum fully updated successfully!");
    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        await client.end();
    }
}

updateNormalFull();
