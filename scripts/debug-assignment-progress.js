const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function debugAssignmentProgress() {
    try {
        await client.connect();

        // 1. Get a sample assignment and student
        const assignmentRes = await client.query(`
            SELECT id, title FROM assignments LIMIT 1
        `);
        if (assignmentRes.rows.length === 0) {
            console.log('No assignments found');
            return;
        }
        const assignmentId = assignmentRes.rows[0].id;
        console.log(`Testing with Assignment ID: ${assignmentId}`);

        const studentRes = await client.query(`
            SELECT student_id FROM classroom_enrollments LIMIT 1
        `);
        if (studentRes.rows.length === 0) {
            console.log('No students found');
            return;
        }
        const studentId = studentRes.rows[0].student_id;
        console.log(`Testing with Student ID: ${studentId}`);

        // 2. Mock the API logic
        // Get assignment patterns
        const patternsRes = await client.query(`
            SELECT * FROM assignment_patterns WHERE assignment_id = $1
        `, [assignmentId]);

        console.log(`Found ${patternsRes.rows.length} patterns`);

        // Get start time
        const progressRes = await client.query(`
            SELECT started_at FROM assignment_student_progress 
            WHERE assignment_id = $1 AND student_id = $2
        `, [assignmentId, studentId]);

        const startedAt = progressRes.rows[0]?.started_at || new Date(0).toISOString();
        console.log(`Started At: ${startedAt}`);

        // Run the problematic query for the first pattern
        if (patternsRes.rows.length > 0) {
            const ap = patternsRes.rows[0];
            console.log(`Checking pattern ${ap.pattern_id}, difficulty ${ap.difficulty}`);

            const query = `
                SELECT COUNT(*) as completed_count
                FROM practice_history
                WHERE user_id = $1
                AND pattern_id = $2
                AND difficulty = $3
                AND correct = true
                AND created_at > $4
            `;

            console.log('Running query:', query);
            console.log('Params:', [studentId, ap.pattern_id, ap.difficulty, startedAt]);

            const result = await client.query(query, [
                studentId,
                ap.pattern_id,
                ap.difficulty,
                startedAt
            ]);

            console.log('Result:', result.rows[0]);
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

debugAssignmentProgress();
