const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testEmailFetch() {
    const client = await pool.connect();
    try {
        // Get a student ID
        const enrollment = await client.query(`
            SELECT student_id FROM classroom_enrollments LIMIT 1
        `);

        if (enrollment.rows.length > 0) {
            const studentId = enrollment.rows[0].student_id;
            console.log('Student ID:', studentId);

            // Try to get email from auth.users
            const authUser = await client.query(`
                SELECT email FROM auth.users WHERE id = $1
            `, [studentId]);

            console.log('Email from auth.users:');
            console.table(authUser.rows);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

testEmailFetch();
