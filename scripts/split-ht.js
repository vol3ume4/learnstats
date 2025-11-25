const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Topic-level approach for HT
const TOPIC_APPROACH_HT = `Six-Step Hypothesis Testing Framework: Use this structured approach for all tests. (1) State Hypotheses: Write H0 and H1. H0 always contains equality (=, <=, >=) because we assume no change until proven otherwise. (2) Set Decision Criteria: Choose Z or t test with rationale. Find critical value using stats.norm.ppf() or stats.t.ppf(). (3) Calculate Test Statistic: Compute Z or t from sample data. (4) Calculate p-value: Area in direction of nearest rejection zone using cdf() or sf(). For two-tailed, multiply by 2. (5) Make Decision: Compare using both critical value method and p-value method (both always agree). (6) State Conclusion: Translate to plain language in problem context.`;

const PATTERNS_HT_MEAN = [
    {
        pattern: "Understanding HT for the Mean (Concepts)",
        approach: "Introduce the 6-step framework. Explain H0 vs H1, Type I/II errors, alpha, p-value. Use only cdf/sf/ppf functions, no hypothesis testing libraries."
    },
    {
        pattern: "One-Sample Z-Test (Large sample, sigma known)",
        approach: "Apply 6-step framework. Step 2: Use Z because n >= 30 and sigma known. Formula: Z = (x_bar - mu_0)/(sigma/sqrt(n)). Assumption: Random sample from population."
    },
    {
        pattern: "One-Sample t-Test (Small sample or sigma unknown)",
        approach: "Apply 6-step framework. Step 2: Use t because n < 30 or sigma unknown, df = n-1. Formula: t = (x_bar - mu_0)/(s/sqrt(n)). Critical Assumption: Population must be approximately Normal (check with histogram/Q-Q plot). Pragmatic Note: For large samples (n >= 30) with unknown sigma, purists prefer t, but Z gives nearly identical results. Demonstrate both to show the minimal difference, but acknowledge t is technically correct."
    },
    {
        pattern: "Two-Sample t-Test (Independent samples)",
        approach: "Apply 6-step framework. Step 2: Use t-test for difference in means. Assumptions: (1) Independent samples, (2) Both populations approximately Normal (especially important if n < 30), (3) Equal variances (homogeneity). Variance Check: Use F-test or Levene's test. If equal: Use pooled variance formula: t = (x_bar_1 - x_bar_2)/sqrt(s^2_pooled(1/n_1 + 1/n_2)), df = n_1 + n_2 - 2. If unequal: Use Welch's t-test (unpooled): t = (x_bar_1 - x_bar_2)/sqrt(s_1^2/n_1 + s_2^2/n_2), df = Satterthwaite approximation. Pragmatic Unscary Approach: Use unpooled (Welch's) formula for all cases—it's more conservative. Demonstrate: Calculate both pooled and unpooled to show they often give similar results. Acknowledge purists prefer checking assumptions first, but Welch's is safer default."
    },
    {
        pattern: "Paired t-Test (Dependent samples)",
        approach: "Apply 6-step framework. Step 2: Use paired t-test when samples are related (before/after, matched pairs). Work with differences: d_bar = mean of differences, s_d = std dev of differences. Formula: t = d_bar/(s_d/sqrt(n)), df = n-1. Assumption: Differences are approximately Normal."
    }
];

const PATTERNS_HT_PROP = [
    {
        pattern: "Understanding HT for Proportions",
        approach: "Introduce the 6-step framework for proportions. Proportions always use Z-test (no t-distribution for proportions). Assumption Check: np_0 >= 10 and n(1-p_0) >= 10 ensures Normal approximation is valid."
    },
    {
        pattern: "One-Sample Z-Test for Proportion",
        approach: "Apply 6-step framework. Formula: Z = (p_hat - p_0)/sqrt(p_0(1-p_0)/n). Use stats.norm.cdf/sf. Assumption: Large sample (check np_0 >= 10 and n(1-p_0) >= 10)."
    },
    {
        pattern: "Two-Sample Z-Test for Proportions",
        approach: "Apply 6-step framework. Test if two population proportions are different. Pooled Proportion: p_hat_pooled = (x_1 + x_2)/(n_1 + n_2). Formula: Z = (p_hat_1 - p_hat_2)/sqrt(p_hat_pooled(1-p_hat_pooled)(1/n_1 + 1/n_2)). Assumption: Both samples satisfy large sample condition."
    },
    {
        pattern: "Interpreting Results and Common Pitfalls",
        approach: "Emphasize Step 6. Common mistakes: confusing 'fail to reject H0' with 'accept H0' (we never prove H0 true), misinterpreting p-values as 'probability H0 is true', ignoring practical vs statistical significance (a tiny p-value doesn't mean a meaningful real-world effect)."
    }
];

const PATTERNS_REGRESSION = [
    "Simple Linear Regression",
    "Correlation Coefficients (Pearson, Spearman)",
    "Coefficient of Determination (R-Squared)",
    "Residual Analysis"
];

async function splitHT() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Delete ALL patterns for affected topics (12, 13) to avoid FK violations
        console.log("Deleting patterns for topics 12, 13...");
        await client.query("DELETE FROM patterns WHERE topic_id IN (12, 13)");

        // 2. Shift Topic 13 -> 14
        console.log("Shifting topics...");
        await client.query("UPDATE topics SET name = '14. Regression Analysis', id = 14 WHERE id = 13");

        // 3. Update Topic 12 and Insert Topic 13
        console.log("Updating Topic 12 and inserting Topic 13...");
        await client.query("UPDATE topics SET name = '12. Hypothesis Testing for the Mean', teacher_preferred_approach = $1 WHERE id = 12", [TOPIC_APPROACH_HT]);

        const check13 = await client.query("SELECT id FROM topics WHERE id = 13");
        if (check13.rows.length === 0) {
            await client.query("INSERT INTO topics (id, name, teacher_preferred_approach) VALUES (13, '13. Hypothesis Testing for the Proportion', $1)", [TOPIC_APPROACH_HT]);
        } else {
            await client.query("UPDATE topics SET name = '13. Hypothesis Testing for the Proportion', teacher_preferred_approach = $1 WHERE id = 13", [TOPIC_APPROACH_HT]);
        }

        // 4. Re-seed Patterns

        // Topic 12: HT for Mean
        console.log("Seeding Topic 12 (HT for Mean)...");
        for (const p of PATTERNS_HT_MEAN) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [12, p.pattern, p.approach]
            );
        }

        // Topic 13: HT for Proportion
        console.log("Seeding Topic 13 (HT for Proportion)...");
        for (const p of PATTERNS_HT_PROP) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [13, p.pattern, p.approach]
            );
        }

        // Topic 14: Regression Analysis (shifted from 13)
        console.log("Seeding Topic 14 (Regression Analysis)...");
        for (const p of PATTERNS_REGRESSION) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, gemini_generated) VALUES ($1, $2, false)",
                [14, p]
            );
        }

        console.log("✅ HT split and re-seeding completed successfully!");
    } catch (err) {
        console.error("Split failed:", err);
    } finally {
        await client.end();
    }
}

splitHT();
