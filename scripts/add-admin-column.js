const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function addAdminColumn() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Add is_admin column to profiles table
        const alterQuery = `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
    `;

        await client.query(alterQuery);
        console.log('✓ Added is_admin column to profiles table');

        // Check if you want to set a specific user as admin
        // You'll need to run a separate query with your user_id
        console.log('\nTo set yourself as admin, run:');
        console.log('UPDATE profiles SET is_admin = TRUE WHERE user_id = \'your-user-id\';');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

addAdminColumn();
