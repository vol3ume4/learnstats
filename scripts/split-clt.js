const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const PATTERNS_MEAN = [
    {
        pattern: "Identify Sampling Distribution Scenarios",
        approach: "Decode: Distinguish between 'Population' (X) and 'Sample Mean' (x_bar). Look for 'sample of size n'. Key Concept: The distribution of sample means is Normal if n > 30 (CLT) or if population is Normal."
    },
    {
        pattern: "Calculate Standard Error of the Mean",
        approach: "Decode: Given sigma (population std dev) and n. Formula: SE = sigma / sqrt(n). Explain that SE measures how much the sample mean varies from the true mean."
    },
    {
        pattern: "Calculate Probability for the Mean (Z-score)",
        approach: "Decode: Find P(X_bar < x). Formula: Z = (x_bar - mu) / SE. Step 1: Calculate SE. Step 2: Calculate Z. Step 3 (Python): Use `stats.norm.cdf(z)`."
    },
    {
        pattern: "Find Sample Size (n) for Desired Precision",
        approach: "Decode: Given Margin of Error (E) and Confidence Level. Formula: n = (Z * sigma / E)^2. Step 1 (Python): Find Z using `stats.norm.ppf`. Step 2: Solve for n and round up."
    }
];

const PATTERNS_PROP = [
    {
        pattern: "Identify Proportion Scenarios",
        approach: "Decode: Look for categorical data (Yes/No, Success/Failure) and 'sample proportion' (p_hat). Contrast with Means (numerical data)."
    },
    {
        pattern: "Calculate Standard Error of the Proportion",
        approach: "Decode: Given p (population proportion) and n. Formula: SE = sqrt(p * (1 - p) / n). Check assumption: np >= 10 and n(1-p) >= 10."
    },
    {
        pattern: "Calculate Probability for the Proportion (Z-score)",
        approach: "Decode: Find P(p_hat < x). Formula: Z = (p_hat - p) / SE. Step 1: Calculate SE. Step 2: Calculate Z. Step 3 (Python): Use `stats.norm.cdf(z)`."
    },
    {
        pattern: "Find Sample Size (n) for Desired Precision",
        approach: "Decode: Given Margin of Error (E). Formula: n = p * (1 - p) * (Z / E)^2. If p is unknown, use p=0.5 for conservative estimate."
    }
];

// Original patterns for shifted topics (from seed-data.js)
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

async function splitCLT() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Delete ALL patterns for affected topics (7, 8, 9, 10) to avoid FK violations
        console.log("Deleting patterns for topics 7, 8, 9, 10...");
        await client.query("DELETE FROM patterns WHERE topic_id IN (7, 8, 9, 10)");

        // 2. Rename Topic 7
        console.log("Renaming Topic 7...");
        await client.query("UPDATE topics SET name = '7. Sampling Distribution of the Mean (CLT)' WHERE id = 7");

        // 3. Shift Topics 8, 9, 10 -> 9, 10, 11
        console.log("Shifting topics...");
        // Check if 11 exists, if not insert it as a placeholder or update 10 to 11
        // Safe way: Update IDs directly since patterns are gone
        await client.query("UPDATE topics SET name = '11. Regression Analysis', id = 11 WHERE id = 10");
        await client.query("UPDATE topics SET name = '10. Hypothesis Testing', id = 10 WHERE id = 9");
        await client.query("UPDATE topics SET name = '9. Confidence Intervals', id = 9 WHERE id = 8");

        // 4. Insert New Topic 8
        console.log("Inserting Topic 8...");
        const check8 = await client.query("SELECT id FROM topics WHERE id = 8");
        if (check8.rows.length === 0) {
            await client.query("INSERT INTO topics (id, name) VALUES (8, '8. Sampling Distribution of the Proportion (CLT)')");
        } else {
            await client.query("UPDATE topics SET name = '8. Sampling Distribution of the Proportion (CLT)' WHERE id = 8");
        }

        // 5. Re-seed Patterns

        // Topic 7: Means
        console.log("Seeding Topic 7 (Means)...");
        for (const p of PATTERNS_MEAN) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [7, p.pattern, p.approach]
            );
        }

        // Topic 8: Proportions
        console.log("Seeding Topic 8 (Proportions)...");
        for (const p of PATTERNS_PROP) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [8, p.pattern, p.approach]
            );
        }

        // Topic 9: Confidence Intervals (shifted from 8)
        console.log("Seeding Topic 9 (Confidence Intervals)...");
        for (const p of PATTERNS_CI) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [9, p]
            );
        }

        // Topic 10: Hypothesis Testing (shifted from 9)
        console.log("Seeding Topic 10 (Hypothesis Testing)...");
        for (const p of PATTERNS_HYPOTHESIS) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [10, p]
            );
        }

        // Topic 11: Regression Analysis (shifted from 10)
        console.log("Seeding Topic 11 (Regression Analysis)...");
        for (const p of PATTERNS_REGRESSION) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [11, p]
            );
        }

        console.log("✅ CLT split and re-seeding completed successfully!");
    } catch (err) {
        console.error("Split failed:", err);
    } finally {
        await client.end();
    }
}

splitCLT();
