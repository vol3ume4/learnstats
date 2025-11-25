const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const DATA = [
    {
        "name": "1. Introduction to Data",
        "patterns": [
            "Types of Data (Nominal, Ordinal, Interval, Ratio)",
            "Discrete vs Continuous Variables",
            "Structured vs Unstructured Data",
            "Populations vs Samples"
        ]
    },
    {
        "name": "2. Descriptive Statistics",
        "patterns": [
            "Measures of Central Tendency (Mean, Median, Mode)",
            "Measures of Variability (Range, Variance, Std Dev)",
            "Quartiles and IQR",
            "Skewness and Kurtosis"
        ]
    },
    {
        "name": "3. Probability Basics",
        "patterns": [
            "Definitions: Experiment, Sample Space, & Events",
            "Simple Probability (Classical Approach)",
            "Probability vs. Odds",
            "Union of Events (Addition Rule)",
            "Intersection of Independent Events (Multiplication Rule)",
            "Conditional Probability & Dependent Events",
            "Bayes' Theorem & Inverse Probability"
        ]
    },
    {
        "name": "4. Binomial Distribution",
        "patterns": [
            "Identify Binomial Scenarios (Bernoulli Trials)",
            "Calculate Exact Probability (PMF) given n, p, x",
            "Calculate Cumulative Probability (CDF) given n, p, x",
            "Inverse Problems: Find n, p, or x given Probability",
            "Calculate Mean and Variance",
            "Normal Approximation to Binomial"
        ]
    },
    {
        "name": "5. Poisson Distribution",
        "patterns": [
            "Identify Poisson Scenarios (vs. Binomial)",
            "Calculate Exact Probability (PMF) given lambda, x",
            "Calculate Cumulative Probability (CDF) given lambda, x",
            "Inverse Problems: Find lambda or x given Probability",
            "Calculate Mean and Variance",
            "Poisson Approximation to Binomial"
        ]
    },
    {
        "name": "6. Normal Distribution",
        "patterns": [
            "Properties of the Bell Curve",
            "Standard Normal Distribution (Z-Scores)",
            "Empirical Rule (68-95-99.7)",
            "Reading Z-Tables (Manual Lookup)",
            "Normal Distribution Calculations (CDF, SF, PPF, ISF)"
        ]
    },
    {
        "name": "7. Sampling Distribution of the Mean (CLT)",
        "patterns": [
            "Identify Sampling Distribution Scenarios",
            "Calculate Standard Error of the Mean",
            "Calculate Probability for the Mean (Z-score)",
            "Find Sample Size (n) for Desired Precision"
        ]
    },
    {
        "name": "8. Sampling Distribution of the Proportion (CLT)",
        "patterns": [
            "Identify Proportion Scenarios",
            "Calculate Standard Error of the Proportion",
            "Calculate Probability for the Proportion (Z-score)",
            "Find Sample Size (n) for Desired Precision"
        ]
    },
    {
        "name": "9. Student's t-Distribution",
        "patterns": [
            "Properties of the t-Distribution",
            "t-Distribution Calculations (CDF, PPF)",
            "Decision: When to use Z vs t?",
            "Finding Critical t-values"
        ]
    },
    {
        "name": "10. Confidence Intervals for the Mean",
        "patterns": [
            "Understanding CI for the Mean (Concept)",
            "CI for Mean - Large Sample (n >= 30), sigma Known",
            "CI for Mean - Large Sample (n >= 30), sigma Unknown",
            "CI for Mean - Small Sample (n < 30), sigma Unknown",
            "Interpreting CI for the Mean"
        ]
    },
    {
        "name": "11. Confidence Intervals for the Proportion",
        "patterns": [
            "Understanding CI for Proportion (Concept)",
            "CI for Proportion - Large Sample",
            "CI for Proportion - Small Sample (Wilson Score)",
            "Interpreting CI for Proportion"
        ]
    },
    {
        "name": "12. Hypothesis Testing for the Mean",
        "patterns": [
            "Understanding HT for the Mean (Concepts)",
            "One-Sample Z-Test (Large sample, sigma known)",
            "One-Sample t-Test (Small sample or sigma unknown)",
            "Two-Sample t-Test (Independent samples)",
            "Paired t-Test (Dependent samples)"
        ]
    },
    {
        "name": "13. Hypothesis Testing for the Proportion",
        "patterns": [
            "Understanding HT for Proportions",
            "One-Sample Z-Test for Proportion",
            "Two-Sample Z-Test for Proportions",
            "Interpreting Results and Common Pitfalls"
        ]
    },
    {
        "name": "14. Regression Analysis",
        "patterns": [
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
