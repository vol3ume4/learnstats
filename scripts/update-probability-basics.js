const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const PATTERNS = [
    {
        pattern: "Definitions: Experiment, Sample Space, & Events",
        approach: "Start by defining the terms in plain English. An 'Experiment' is just an action with an uncertain result. The 'Sample Space' is the list of ALL possible outcomes. Crucial Nuance: Remind the student that outcomes in a Sample Space must be unique (mutually exclusive) and cover all possibilities (exhaustive), but they do NOT have to be equally likely. An 'Event' is the specific result we are looking for. Solve the problem by explicitly listing the Sample Space first, then identifying the Event."
    },
    {
        pattern: "Simple Probability (Classical Approach)",
        approach: "Refresh the core concept: Probability is just the ratio of 'Favorable Outcomes' to 'Total Possible Outcomes'. State the formula P(E) = n(E)/n(S). Solve by counting the total possibilities first, then counting the specific ones we want."
    },
    {
        pattern: "Probability vs. Odds",
        approach: "Remind the student that Odds are different from Probability. Probability compares 'Winners' to 'Total', while Odds compare 'Winners' to 'Losers'. Use the formula: Odds = P(E) / (1 - P(E)). Explain that if probability is '1 in 5', odds are '1 to 4'."
    },
    {
        pattern: "Union of Events (Addition Rule)",
        approach: "Start with the Addition Rule: P(A U B) = P(A) + P(B) - P(A n B). Explain that we subtract the intersection so we don't count it twice. Explicitly define 'Mutually Exclusive' as events that cannot happen at the same time (so the intersection is zero)."
    },
    {
        pattern: "Intersection of Independent Events (Multiplication Rule)",
        approach: "Start with the Multiplication Rule for Independent Events: P(A n B) = P(A) * P(B). Explain that 'Independent' means the first event does not change the probability of the second event (like flipping a coin twice)."
    },
    {
        pattern: "Conditional Probability & Dependent Events",
        approach: "Introduce the notation P(A|B) as 'Probability of A GIVEN that B has already happened'. Remind them that for dependent events, the second probability changes. Use the formula: P(A n B) = P(A) * P(B|A)."
    },
    {
        pattern: "Bayes' Theorem & Inverse Probability",
        approach: "Solve this using a 'Hypothetical 1000' table or a Tree Diagram instead of just plugging into the complex formula. Create a table with rows for the conditions and columns for the test results to visualize the True Positives and False Positives clearly."
    }
];

async function updateProbabilityBasics() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Get Topic ID
        const res = await client.query("SELECT id FROM topics WHERE name ILIKE '%Probability Basics%'");
        if (res.rows.length === 0) {
            console.error("Topic 'Probability Basics' not found.");
            return;
        }
        const topicId = res.rows[0].id;
        console.log(`Found Topic ID: ${topicId}`);

        // 2. Delete existing patterns for this topic
        console.log("Deleting old patterns...");
        await client.query("DELETE FROM patterns WHERE topic_id = $1", [topicId]);

        // 3. Insert new patterns with approaches
        console.log("Inserting new patterns...");
        for (const p of PATTERNS) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [topicId, p.pattern, p.approach]
            );
        }

        console.log("✅ Probability Basics curriculum updated successfully!");
    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        await client.end();
    }
}

updateProbabilityBasics();
