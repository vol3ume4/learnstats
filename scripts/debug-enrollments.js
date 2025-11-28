const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkEnrollments() {
    const client = await pool.connect();
    try {
        // Find the classroom
        const classroom = await client.query(`
            SELECT id, name, invite_code FROM classrooms WHERE invite_code = '2HEYKJ6W'
        `);
        console.log('Classroom:');
        console.table(classroom.rows);

        if (classroom.rows.length > 0) {
            const classroomId = classroom.rows[0].id;

            // Get enrollments
            const enrollments = await client.query(`
                SELECT * FROM classroom_enrollments WHERE classroom_id = $1
            `, [classroomId]);
            console.log('\nEnrollments:');
            console.table(enrollments.rows);

            // Get profiles for those students
            if (enrollments.rows.length > 0) {
                const studentIds = enrollments.rows.map(e => e.student_id);
                const profiles = await client.query(`
                    SELECT id, email FROM profiles WHERE id = ANY($1)
                `, [studentIds]);
                console.log('\nProfiles:');
                console.table(profiles.rows);
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
}

checkEnrollments();
