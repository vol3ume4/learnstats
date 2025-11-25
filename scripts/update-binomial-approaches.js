const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const UPDATES = [
    {
        pattern: "Identify Binomial Scenarios (Bernoulli Trials)",
        approach: "First, decode the problem text to identify the experiment. Then, explicitly check the 4 Rules of Binomial: 1) Finite number of trials (n), 2) Only two outcomes (Success/Failure), 3) Constant probability of success (p), 4) Independent trials. Introduce the symbols x, n, p, q. Note: This is a conceptual check, so provide a detailed Statistical reasoning. No Python code is needed for this pattern."
    },
    {
        pattern: "Calculate Exact Probability (PMF) given n, p, x",
        approach: "Step 1: Decode the problem. Explicitly list what is given (n, p, x) and what is asked (P(X=x)). Step 2 (Stats): State the Binomial PMF formula: P(X=x) = nCx * p^x * q^(n-x). Step 3 (Python): Show how to use `scipy.stats.binom.pmf(k, n, p)` to get the result."
    },
    {
        pattern: "Calculate Cumulative Probability (CDF) given n, p, x",
        approach: "Step 1: Decode the problem. Identify if it asks for 'at most' (P(X <= x)) or 'at least' (P(X >= x)). Step 2 (Stats): Explain that 'at most' is CDF and 'at least' is Survival Function (SF) or 1 - CDF. Step 3 (Python): Demonstrate both `binom.cdf(k, n, p)` for cumulative and `binom.sf(k, n, p)` for survival function calculations."
    },
    {
        pattern: "Inverse Problems: Find n, p, or x given Probability",
        approach: "Step 1: Decode the problem to find the missing parameter (n, p, or x) given a probability. Step 2: Explain that since n and x are discrete, we often cannot solve algebraically. Step 3 (Python): Explain that we use a loop or search method (trial and error) to find the value that satisfies the condition (e.g., 'Find minimum n such that P(X >= 1) > 0.9')."
    }
];

async function updateBinomialApproaches() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Get Topic ID
        const res = await client.query("SELECT id FROM topics WHERE name ILIKE '%Binomial%'");
        if (res.rows.length === 0) {
            console.error("Topic 'Binomial Distribution' not found.");
            return;
        }
        const topicId = res.rows[0].id;
        console.log(`Found Topic ID: ${topicId}`);

        // 2. Update approaches for each pattern
        console.log("Updating preferred approaches...");
        for (const item of UPDATES) {
            const updateRes = await client.query(
                `UPDATE patterns 
         SET teacher_preferred_approach = $1 
         WHERE topic_id = $2 AND pattern = $3`,
                [item.approach, topicId, item.pattern]
            );

            if (updateRes.rowCount > 0) {
                console.log(`✅ Updated: ${item.pattern}`);
            } else {
                console.log(`⚠️  Pattern not found: ${item.pattern}`);
            }
        }

        console.log("Binomial approaches updated successfully!");
    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        await client.end();
    }
}

updateBinomialApproaches();
