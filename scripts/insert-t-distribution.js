const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const PATTERNS_T = [
    {
        pattern: "Properties of the t-Distribution",
        approach: "Decode: Explain that t has 'heavier tails' (more uncertainty) than Z. Key Concept: Degrees of Freedom (df = n - 1). Emphasize: There is a different t-curve for each df (unlike the single Z curve). As n >= 30, t approx Z (this is why n=30 is the large sample threshold)."
    },
    {
        pattern: "t-Distribution Calculations (CDF, PPF)",
        approach: "Decode: Similar to Normal but requires df parameter. Step 1: Calculate df = n - 1. Step 2 (Python): Use `stats.t.cdf(x, df)` for probabilities and `stats.t.ppf(p, df)` for critical values. Always specify df."
    },
    {
        pattern: "Decision: When to use Z vs t?",
        approach: "Decode: The 'Sigma Rule'. Check if Population Std Dev (sigma) is known. Known sigma -> Use Z. Unknown sigma (only Sample Std Dev s available) -> Use t. Note: Even if n >= 30, if sigma is unknown, t is technically correct (though Z is a close approximation). Remind: df = n - 1."
    },
    {
        pattern: "Finding Critical t-values",
        approach: "Decode: Given Confidence Level and sample size n. Step 1: Calculate df = n - 1. Step 2: Convert confidence level to tail probability (e.g., 95% CI -> alpha/2 = 0.025 in each tail). Step 3 (Python): Use `stats.t.ppf(1 - alpha/2, df)` to find the critical value."
    }
];

// Original patterns for shifted topics
const PATTERNS_CI = [
    "Calculating Confidence Intervals",
    "Margin of Error",
    "Confidence Levels (95%, 99%)",
    "Interpreting Confidence Intervals"
];

const PATTERNS_HYPOTHESIS = [
    "Null and Alternative Hypotheses",
    "Type I and Type II Errors",
    "P-Values and Significance Levels",
    "One-Sample and Two-Sample T-Tests",
    "ANOVA (Analysis of Variance)"
];

const PATTERNS_REGRESSION = [
    "Simple Linear Regression",
    "Correlation Coefficients (Pearson, Spearman)",
    "Coefficient of Determination (R-Squared)",
    "Residual Analysis"
];

async function insertTDistribution() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Delete ALL patterns for affected topics (9, 10, 11) to avoid FK violations
        console.log("Deleting patterns for topics 9, 10, 11...");
        await client.query("DELETE FROM patterns WHERE topic_id IN (9, 10, 11)");

        // 2. Shift Topics 9, 10, 11 -> 10, 11, 12
        console.log("Shifting topics...");
        await client.query("UPDATE topics SET name = '12. Regression Analysis', id = 12 WHERE id = 11");
        await client.query("UPDATE topics SET name = '11. Hypothesis Testing', id = 11 WHERE id = 10");
        await client.query("UPDATE topics SET name = '10. Confidence Intervals', id = 10 WHERE id = 9");

        // 3. Insert New Topic 9
        console.log("Inserting Topic 9...");
        const check9 = await client.query("SELECT id FROM topics WHERE id = 9");
        if (check9.rows.length === 0) {
            await client.query("INSERT INTO topics (id, name) VALUES (9, '9. Student''s t-Distribution')");
        } else {
            await client.query("UPDATE topics SET name = '9. Student''s t-Distribution' WHERE id = 9");
        }

        // 4. Re-seed Patterns

        // Topic 9: t-Distribution
        console.log("Seeding Topic 9 (t-Distribution)...");
        for (const p of PATTERNS_T) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [9, p.pattern, p.approach]
            );
        }

        // Topic 10: Confidence Intervals (shifted from 9)
        console.log("Seeding Topic 10 (Confidence Intervals)...");
        for (const p of PATTERNS_CI) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [10, p]
            );
        }

        // Topic 11: Hypothesis Testing (shifted from 10)
        console.log("Seeding Topic 11 (Hypothesis Testing)...");
        for (const p of PATTERNS_HYPOTHESIS) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [11, p]
            );
        }

        // Topic 12: Regression Analysis (shifted from 11)
        console.log("Seeding Topic 12 (Regression Analysis)...");
        for (const p of PATTERNS_REGRESSION) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [12, p]
            );
        }

        console.log("✅ t-Distribution insertion and re-seeding completed successfully!");
    } catch (err) {
        console.error("Insertion failed:", err);
    } finally {
        await client.end();
    }
}

insertTDistribution();
