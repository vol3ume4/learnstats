const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function setAdmin() {
    try {
        await client.connect();
        console.log('Connected to database\n');

        // First, show all users
        const usersQuery = 'SELECT id, is_admin, created_at FROM profiles ORDER BY created_at DESC LIMIT 10';
        const users = await client.query(usersQuery);

        console.log('=== Recent Users ===');
        users.rows.forEach((user, index) => {
            console.log(`${index + 1}. User ID: ${user.id}`);
            console.log(`   Created: ${user.created_at}`);
            console.log(`   Is Admin: ${user.is_admin || false}`);
            console.log('');
        });

        console.log('\nTo set a user as admin, run this command in your database:');
        console.log('UPDATE profiles SET is_admin = TRUE WHERE id = \'paste-user-id-here\';');
        console.log('\nOr uncomment and modify the code in this script.');

        // UNCOMMENT AND MODIFY THIS TO SET YOURSELF AS ADMIN:
        // const YOUR_USER_ID = 'paste-your-user-id-here';
        // await client.query('UPDATE profiles SET is_admin = TRUE WHERE id = $1', [YOUR_USER_ID]);
        // console.log(`✓ Set user ${YOUR_USER_ID} as admin`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

setAdmin();
