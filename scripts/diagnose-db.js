const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const url = process.env.DATABASE_URL || "";
const maskedUrl = url.replace(/:([^:@]+)@/, ":****@");

console.log("Attempting to connect to:", maskedUrl);

const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 5000, // 5s timeout
});

async function diagnose() {
    try {
        console.log("Connecting...");
        await client.connect();
        console.log("✅ Connection Successful!");

        const res = await client.query("SELECT version();");
        console.log("Database Version:", res.rows[0].version);

        const topics = await client.query("SELECT count(*) FROM topics;");
        console.log("Topics Count:", topics.rows[0].count);

    } catch (err) {
        console.error("❌ Connection Failed!");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
        if (err.code === 'XX000') {
            console.error("⚠️  XX000 often means the Supabase project is PAUSED or undergoing maintenance.");
        }
    } finally {
        await client.end();
    }
}

diagnose();
