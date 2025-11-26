const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const originalUrl = process.env.DATABASE_URL || "";

// Construct Direct URL
// Replace pooler host with direct host
// Usually: db.[project-ref].supabase.co
const projectRef = "jzmetlmwsjgkvheohqyh";
const directHost = `db.${projectRef}.supabase.co`;

// Replace the host part of the URL
// The URL format is postgresql://user:pass@host:port/db
// We want to replace 'aws-1-ap-south-1.pooler.supabase.com' with 'db.jzmetlmwsjgkvheohqyh.supabase.co'

let directUrl = originalUrl.replace("aws-1-ap-south-1.pooler.supabase.com", directHost);

// Also, direct connection usually works better on port 5432 (which is already there)
// But sometimes pooler is on 6543. Your URL has 5432.
// Let's just try the host swap.

console.log("Original Host:", originalUrl.split('@')[1].split(':')[0]);
console.log("Target Host:  ", directHost);

const client = new Client({
    connectionString: directUrl,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false } // Direct connections often need this
});

async function testDirect() {
    try {
        console.log("Connecting via Direct URL...");
        await client.connect();
        console.log("✅ Direct Connection Successful!");

        const res = await client.query("SELECT count(*) FROM topics;");
        console.log("Topics Count:", res.rows[0].count);

    } catch (err) {
        console.error("❌ Direct Connection Failed!");
        console.error(err.message);
    } finally {
        await client.end();
    }
}

testDirect();
