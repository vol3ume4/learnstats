const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const PATTERNS = [
    {
        pattern: "Identify Poisson Scenarios (vs. Binomial)",
        approach: "First, decode the problem text to identify the experiment. Look for a **Rate** (events per time/space) rather than a fixed number of trials (n). Contrast with Binomial: Binomial counts successes in n trials; Poisson counts events in an interval. Check assumptions: Events occur independently and at a constant average rate (lambda). Introduce symbols lambda and x. Note: This is a conceptual check, so provide a detailed Statistical reasoning. No Python code is needed for this pattern."
    },
    {
        pattern: "Calculate Exact Probability (PMF) given lambda, x",
        approach: "Step 1: Decode the problem. Explicitly list what is given (lambda, x) and what is asked (P(X=x)). Step 2 (Stats): State the Poisson PMF formula: P(X=x) = (e^-lambda * lambda^x) / x!. Step 3 (Python): Show how to use `scipy.stats.poisson.pmf(k, mu)` to get the result."
    },
    {
        pattern: "Calculate Cumulative Probability (CDF) given lambda, x",
        approach: "Step 1: Decode the problem. Identify if it asks for 'at most' (P(X <= x)) or 'at least' (P(X >= x)). Step 2 (Stats): Explain that 'at most' is CDF and 'at least' is Survival Function (SF) or 1 - CDF. Step 3 (Python): Demonstrate both `poisson.cdf(k, mu)` for cumulative and `poisson.sf(k, mu)` for survival function calculations."
    },
    {
        pattern: "Inverse Problems: Find lambda or x given Probability",
        approach: "Step 1: Decode the problem to find the missing parameter (lambda or x) given a probability. Step 2: Explain that since x is discrete, we often cannot solve algebraically. Step 3 (Python): Explain that we use a loop or search method (trial and error) to find the value that satisfies the condition."
    },
    {
        pattern: "Calculate Mean and Variance",
        approach: "Step 1: Decode the problem. Identify what is given (lambda). Step 2: State the unique property of Poisson: Mean = Variance = lambda. So mu = lambda and sigma = sqrt(lambda). Step 3: Substitute the values and calculate the solution."
    },
    {
        pattern: "Poisson Approximation to Binomial",
        approach: "Step 1: Explain the 'Why': When n is large and p is very small (rare event), Binomial approx Poisson. Step 2: Test Assumption: n > 20 and p < 0.05 (or np < 5). Step 3: Calculate lambda = np. Step 4: Solve using Poisson formula instead of Binomial."
    }
];

async function updatePoissonFull() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Get Topic ID
        const res = await client.query("SELECT id FROM topics WHERE name ILIKE '%Poisson%'");
        if (res.rows.length === 0) {
            console.error("Topic 'Poisson Distribution' not found.");
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

        console.log("✅ Poisson curriculum fully updated successfully!");
    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        await client.end();
    }
}

updatePoissonFull();
