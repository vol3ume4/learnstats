const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function cleanup() {
  try {
    await client.connect();
    console.log("Connected to DB.");

    // 1. Drop legacy table
    console.log("Dropping allowed_emails table...");
    await client.query("DROP TABLE IF EXISTS allowed_emails");
    console.log(" - Dropped.");

    // 2. Truncate curriculum tables (Cascade to questions)
    console.log("Resetting curriculum (topics, patterns, questions)...");
    await client.query("TRUNCATE TABLE topics, patterns, questions RESTART IDENTITY CASCADE");
    console.log(" - Reset complete.");

    console.log("\nCleanup Successful! 🧹");
  } catch (err) {
    console.error("Cleanup Failed:", err);
  } finally {
    await client.end();
  }
}

cleanup();
