const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function addTwoSampleZ() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // Insert the new pattern after "One-Sample t-Test"
        const newPattern = {
            pattern: "Two-Sample Z-Test (Large samples, sigma1 and sigma2 known)",
            approach: "Apply 6-step framework. Step 2: Use Z because both n_1 >= 30 and n_2 >= 30, and both sigma_1 and sigma_2 are known. Formula: Z = (x_bar_1 - x_bar_2)/sqrt(sigma_1^2/n_1 + sigma_2^2/n_2). This is rare in practice (knowing both population std devs), but important conceptually. Assumption: Independent random samples."
        };

        await client.query(
            "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
            [12, newPattern.pattern, newPattern.approach]
        );

        console.log("✅ Two-Sample Z-Test pattern added successfully!");

        // Show all patterns for Topic 12
        const result = await client.query("SELECT pattern FROM patterns WHERE topic_id = 12 ORDER BY id");
        console.log("\nCurrent patterns for Topic 12:");
        result.rows.forEach((p, i) => console.log(`${i + 1}. ${p.pattern}`));

    } catch (err) {
        console.error("Addition failed:", err);
    } finally {
        await client.end();
    }
}

addTwoSampleZ();
