const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Topic-level approach for Chi-Square Tests
const TOPIC_APPROACH_CHI2_TESTS = `Use the 6-step hypothesis testing framework for all chi-square tests. Use 'from scipy import stats' and 'stats.chi2' for calculations. For test statistics, use 'stats.chisquare()' for goodness of fit.`;

const PATTERNS_CHI2_DIST = [
    {
        pattern: "Understanding the Chi-Square Distribution",
        approach: "Decode: Chi-square (χ²) is created by summing squared standard normal variables: χ² = Z₁² + Z₂² + ... + Z_df². Key Properties: (1) Always positive (squared values), (2) Right-skewed shape (becomes more symmetric as df increases), (3) Mean = df, (4) Variance = 2×df. As df increases, shape approaches Normal distribution."
    },
    {
        pattern: "Chi-Square Calculations (CDF, PPF)",
        approach: "Decode: Similar to t-distribution but requires df parameter. Use 'from scipy import stats' then 'stats.chi2.cdf(x, df)' for probabilities and 'stats.chi2.ppf(p, df)' for critical values. Always specify df."
    },
    {
        pattern: "Finding Critical Chi-Square Values",
        approach: "Decode: Given significance level (alpha) and df. For right-tailed test (most common in chi-square tests): use 'stats.chi2.ppf(1 - alpha, df)'. Note: Chi-square tests are typically right-tailed because we're testing if observed differences are too large."
    }
];

const PATTERNS_CHI2_TESTS = [
    {
        pattern: "Understanding Chi-Square Tests (Concepts)",
        approach: "Decode: Chi-square tests are for categorical data. Two main types: (1) Goodness of Fit - does observed frequency match expected? (2) Test of Independence - are two categorical variables related? Formula: χ² = Σ[(O - E)²/E] where O = observed, E = expected. Always right-tailed test."
    },
    {
        pattern: "Chi-Square Goodness of Fit Test",
        approach: "Apply 6-step framework. H0: Observed frequencies match expected distribution. H1: They don't match. Step 2: Use chi-square test. Calculate df = (number of categories - 1). Step 3: Use 'stats.chisquare(observed, expected)' to get test statistic. Step 4: Calculate p-value using 'stats.chi2.sf(test_stat, df)' (right-tail). Assumption: All expected frequencies >= 5."
    },
    {
        pattern: "Chi-Square Test of Independence",
        approach: "Apply 6-step framework. H0: Two categorical variables are independent. H1: They are related. Step 2: Use chi-square test. Calculate df = (rows - 1) × (columns - 1). Step 3: Calculate expected frequencies: E = (row total × column total)/grand total. Then χ² = Σ[(O - E)²/E]. Step 4: Use 'stats.chi2.sf(test_stat, df)'. Create contingency table first. Assumption: All expected frequencies >= 5."
    },
    {
        pattern: "Interpreting Chi-Square Test Results",
        approach: "Emphasize Step 6. For Goodness of Fit: State whether observed data fits the expected distribution. For Independence: State whether variables are related or independent. Common mistake: Confusing 'fail to reject independence' with 'proving independence'. Chi-square only tells if there's a relationship, not the strength or direction."
    }
];

async function addChiSquare() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Delete Regression Analysis (Topic 14)
        console.log("Deleting Regression Analysis patterns...");
        await client.query("DELETE FROM patterns WHERE topic_id = 14");
        await client.query("DELETE FROM topics WHERE id = 14");

        // 2. Insert Topic 14: Chi-Square Distribution
        console.log("Inserting Topic 14 (Chi-Square Distribution)...");
        await client.query("INSERT INTO topics (id, name) VALUES (14, '14. Chi-Square Distribution')");

        // 3. Insert Topic 15: Chi-Square Tests
        console.log("Inserting Topic 15 (Chi-Square Tests)...");
        await client.query("INSERT INTO topics (id, name, teacher_preferred_approach) VALUES (15, '15. Chi-Square Tests', $1)", [TOPIC_APPROACH_CHI2_TESTS]);

        // 4. Seed Patterns

        // Topic 14: Chi-Square Distribution
        console.log("Seeding Topic 14 (Chi-Square Distribution)...");
        for (const p of PATTERNS_CHI2_DIST) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [14, p.pattern, p.approach]
            );
        }

        // Topic 15: Chi-Square Tests
        console.log("Seeding Topic 15 (Chi-Square Tests)...");
        for (const p of PATTERNS_CHI2_TESTS) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [15, p.pattern, p.approach]
            );
        }

        console.log("✅ Chi-Square topics added successfully!");
    } catch (err) {
        console.error("Addition failed:", err);
    } finally {
        await client.end();
    }
}

addChiSquare();
