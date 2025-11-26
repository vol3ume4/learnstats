const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const YOUR_USER_ID = '07472991-e2d9-40ba-aed9-c90f5d652032';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function testAdminCheck() {
    try {
        await client.connect();
        console.log('Connected to database\n');

        // Test the exact query the API uses
        const query = "SELECT is_admin FROM profiles WHERE id = $1";
        const result = await client.query(query, [YOUR_USER_ID]);

        console.log('=== Admin Check Result ===');
        console.log('User ID:', YOUR_USER_ID);
        console.log('Query result:', result.rows);

        if (result.rows.length === 0) {
            console.log('\n❌ ERROR: No user found with this ID');
        } else if (result.rows[0].is_admin) {
            console.log('\n✅ SUCCESS: User is admin!');
            console.log('The API should work correctly.');
        } else {
            console.log('\n❌ ERROR: User is NOT admin');
            console.log('is_admin value:', result.rows[0].is_admin);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

testAdminCheck();
