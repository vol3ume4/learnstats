const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const DATA = [
    {
        name: "1. Introduction to Data",
        patterns: [
            "Types of Data (Nominal, Ordinal, Interval, Ratio)",
            "Discrete vs Continuous Variables",
            "Structured vs Unstructured Data",
            "Populations vs Samples"
        ]
    },
    {
        name: "2. Descriptive Statistics",
        patterns: [
            "Measures of Central Tendency (Mean, Median, Mode)",
            "Measures of Variability (Range, Variance, Std Dev)",
            "Quartiles and IQR",
            "Skewness and Kurtosis"
        ]
    },
    {
        name: "3. Probability Basics",
        patterns: [
            "Independent vs Dependent Events",
            "Conditional Probability",
            "Bayes' Theorem",
            "Random Variables"
        ]
    },
    {
        name: "4. Binomial Distribution",
        patterns: [
            "Bernoulli Trials",
            "Binomial Probability Formula",
            "Mean and Variance of Binomial Distribution",
            "Real-world Applications"
        ]
    },
    {
        name: "5. Poisson Distribution",
        patterns: [
            "Poisson Process Assumptions",
            "Poisson Probability Formula",
            "Mean and Variance (Lambda)",
            "Modeling Rare Events"
        ]
    },
    {
        name: "6. Normal Distribution",
        patterns: [
            "Properties of the Bell Curve",
            "Standard Normal Distribution (Z-Scores)",
            "Empirical Rule (68-95-99.7)",
            "Reading Z-Tables"
        ]
    },
    {
        name: "7. Central Limit Theorem",
        patterns: [
            "Sampling Distributions",
            "Standard Error",
            "Law of Large Numbers",
            "Applications of CLT"
        ]
    },
    {
        name: "8. Confidence Intervals",
        patterns: [
            "Calculating Confidence Intervals",
            "Margin of Error",
            "Confidence Levels (95%, 99%)",
            "Interpreting Confidence Intervals"
        ]
    },
    {
        name: "9. Hypothesis Testing",
        patterns: [
            "Null and Alternative Hypotheses",
            "Type I and Type II Errors",
            "P-Values and Significance Levels",
            "One-Sample and Two-Sample T-Tests",
            "ANOVA (Analysis of Variance)"
        ]
    },
    {
        name: "10. Regression Analysis",
        patterns: [
            "Simple Linear Regression",
            "Correlation Coefficients (Pearson, Spearman)",
            "Coefficient of Determination (R-Squared)",
            "Residual Analysis"
        ]
    }
];

async function seed() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        for (const topic of DATA) {
            // 1. Insert Topic
            let topicId;
            const topicRes = await client.query("SELECT id FROM topics WHERE name = $1", [topic.name]);

            if (topicRes.rows.length > 0) {
                topicId = topicRes.rows[0].id;
                console.log(`Topic exists: ${topic.name} (ID: ${topicId})`);
            } else {
                const insertRes = await client.query(
                    "INSERT INTO topics (name) VALUES ($1) RETURNING id",
                    [topic.name]
                );
                topicId = insertRes.rows[0].id;
                console.log(`Created Topic: ${topic.name} (ID: ${topicId})`);
            }

            // 2. Insert Patterns
            for (const pattern of topic.patterns) {
                await client.query(
                    `INSERT INTO patterns (topic_id, pattern) 
           VALUES ($1, $2) 
           ON CONFLICT (topic_id, pattern) DO NOTHING`,
                    [topicId, pattern]
                );
            }
            console.log(`  - Seeded ${topic.patterns.length} patterns.`);
        }

        console.log("\nSeeding Complete! 🌱");
    } catch (err) {
        console.error("Seeding Failed:", err);
    } finally {
        await client.end();
    }
}

seed();
