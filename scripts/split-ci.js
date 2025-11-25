const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const PATTERNS_CI_MEAN = [
    {
        pattern: "Understanding CI for the Mean (Concept)",
        approach: "Decode: Given sample mean (x_bar), sample size (n), and either sigma or s. Goal: Find the interval that likely contains the true population mean (mu). Restate CLT for Mean: The sampling distribution of x_bar is Normal with mean = mu and SE = sigma/sqrt(n). This is why we can use the Normal/t curve to build intervals. Formula: CI = x_bar ± (critical value × SE)."
    },
    {
        pattern: "CI for Mean - Large Sample (n >= 30), sigma Known",
        approach: "Decode: Given x_bar, n >= 30, sigma, confidence level. Why Z? Large sample + sigma known -> Use Z. Formula: CI = x_bar ± Z_(alpha/2) × (sigma/sqrt(n)). Step 1: Find Z_(alpha/2) using `stats.norm.ppf(1 - alpha/2)`. Step 2: Calculate SE = sigma/sqrt(n). Step 3: Calculate margin of error = Z_(alpha/2) × SE. Step 4: CI = [x_bar - ME, x_bar + ME]."
    },
    {
        pattern: "CI for Mean - Large Sample (n >= 30), sigma Unknown",
        approach: "Decode: Given x_bar, n >= 30, s (sample std dev), confidence level. Why t (technically)? sigma unknown -> Use t with df = n-1. Academic Note: Since n >= 30, t approx Z, so results are nearly identical. Demonstrate: Calculate using both t and Z to show the minimal difference. Formula: CI = x_bar ± t_(alpha/2, df) × (s/sqrt(n)). Use `stats.t.ppf(1 - alpha/2, df)`."
    },
    {
        pattern: "CI for Mean - Small Sample (n < 30), sigma Unknown",
        approach: "Decode: Given x_bar, n < 30, s, confidence level. Why t (critical)? Small sample + sigma unknown -> Must use t with df = n-1. This is where Z vs t makes a real difference. Assumption: Population is approximately Normal. Formula: CI = x_bar ± t_(alpha/2, df) × (s/sqrt(n)). Emphasize: df = n-1."
    },
    {
        pattern: "Interpreting CI for the Mean",
        approach: "Decode: Given a calculated CI like [45.2, 52.8]. Correct interpretation: 'We are 95% confident that the true population mean mu lies between 45.2 and 52.8.' Common mistake: Do NOT say 'There is a 95% probability that mu is in this interval' (mu is fixed, not random)."
    }
];

const PATTERNS_CI_PROP = [
    {
        pattern: "Understanding CI for Proportion (Concept)",
        approach: "Decode: Given sample proportion (p_hat), sample size (n). Goal: Find interval for true population proportion (p). Restate CLT for Proportion: The sampling distribution of p_hat is Normal with mean = p and SE = sqrt(p(1-p)/n). Formula: CI = p_hat ± (critical value × SE). Note: We use p_hat to estimate SE since p is unknown."
    },
    {
        pattern: "CI for Proportion - Large Sample",
        approach: "Decode: Given p_hat, n, confidence level. Check assumption: n*p_hat >= 10 and n*(1-p_hat) >= 10 (ensures Normal approximation). Why Z? Proportions always use Z (no t-distribution for proportions). Formula: CI = p_hat ± Z_(alpha/2) × sqrt(p_hat*(1-p_hat)/n). Step 1: Calculate SE = sqrt(p_hat*(1-p_hat)/n). Step 2: Find Z_(alpha/2). Step 3: Calculate CI."
    },
    {
        pattern: "CI for Proportion - Small Sample (Wilson Score)",
        approach: "Decode: Given p_hat, n < 30 or assumption violated. Why different? Standard formula fails for small samples. Use Wilson Score Interval (more advanced, optional). Note: In practice, ensure large enough sample to use standard formula."
    },
    {
        pattern: "Interpreting CI for Proportion",
        approach: "Decode: Given CI like [0.42, 0.58]. Interpretation: 'We are 95% confident that the true population proportion p lies between 0.42 and 0.58' or '42% to 58%'. Can also express as percentage."
    }
];

// Original patterns for shifted topics
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

async function splitCI() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Delete ALL patterns for affected topics (10, 11, 12) to avoid FK violations
        console.log("Deleting patterns for topics 10, 11, 12...");
        await client.query("DELETE FROM patterns WHERE topic_id IN (10, 11, 12)");

        // 2. Shift Topics 11, 12 -> 12, 13
        console.log("Shifting topics...");
        await client.query("UPDATE topics SET name = '13. Regression Analysis', id = 13 WHERE id = 12");
        await client.query("UPDATE topics SET name = '12. Hypothesis Testing', id = 12 WHERE id = 11");

        // 3. Update Topic 10 and Insert Topic 11
        console.log("Updating Topic 10 and inserting Topic 11...");
        await client.query("UPDATE topics SET name = '10. Confidence Intervals for the Mean' WHERE id = 10");

        const check11 = await client.query("SELECT id FROM topics WHERE id = 11");
        if (check11.rows.length === 0) {
            await client.query("INSERT INTO topics (id, name) VALUES (11, '11. Confidence Intervals for the Proportion')");
        } else {
            await client.query("UPDATE topics SET name = '11. Confidence Intervals for the Proportion' WHERE id = 11");
        }

        // 4. Re-seed Patterns

        // Topic 10: CI for Mean
        console.log("Seeding Topic 10 (CI for Mean)...");
        for (const p of PATTERNS_CI_MEAN) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [10, p.pattern, p.approach]
            );
        }

        // Topic 11: CI for Proportion
        console.log("Seeding Topic 11 (CI for Proportion)...");
        for (const p of PATTERNS_CI_PROP) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [11, p.pattern, p.approach]
            );
        }

        // Topic 12: Hypothesis Testing (shifted from 11)
        console.log("Seeding Topic 12 (Hypothesis Testing)...");
        for (const p of PATTERNS_HYPOTHESIS) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [12, p]
            );
        }

        // Topic 13: Regression Analysis (shifted from 12)
        console.log("Seeding Topic 13 (Regression Analysis)...");
        for (const p of PATTERNS_REGRESSION) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [13, p]
            );
        }

        console.log("✅ CI split and re-seeding completed successfully!");
    } catch (err) {
        console.error("Split failed:", err);
    } finally {
        await client.end();
    }
}

splitCI();
