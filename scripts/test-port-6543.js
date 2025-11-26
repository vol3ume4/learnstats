const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const originalUrl = process.env.DATABASE_URL || "";

// Try switching port to 6543 (Transaction Mode)
// Note: Transaction mode doesn't support prepared statements by default, 
// but 'pg' library often uses them. We might need 'no_prepare' or similar if we use this.
// But first let's just see if we can CONNECT.

let transactionUrl = originalUrl.replace(":5432", ":6543");

console.log("Testing Port 6543...");

const client = new Client({
    connectionString: transactionUrl,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
});

async function testPort6543() {
    try {
        await client.connect();
        console.log("✅ Connection Successful on Port 6543!");

        // Simple query without parameters (safe for transaction mode)
        const res = await client.query("SELECT count(*) FROM topics;");
        console.log("Topics Count:", res.rows[0].count);

    } catch (err) {
        console.error("❌ Connection Failed on Port 6543!");
        console.error(err.message);
    } finally {
        await client.end();
    }
}

testPort6543();
