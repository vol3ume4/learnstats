const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function inspectAssignmentPatterns() {
    try {
        await client.connect();

        // Get all assignments
        const assignmentsRes = await client.query(`
            SELECT id, title, classroom_id FROM assignments
        `);

        for (const assignment of assignmentsRes.rows) {
            console.log(`\n=== Assignment: ${assignment.title} (ID: ${assignment.id}) ===`);

            // Count rows in assignment_patterns
            const countRes = await client.query(`
                SELECT COUNT(*) as total FROM assignment_patterns WHERE assignment_id = $1
            `, [assignment.id]);
            console.log(`Total rows in assignment_patterns: ${countRes.rows[0].total}`);

            // Get unique patterns
            const uniquePatternsRes = await client.query(`
                SELECT COUNT(DISTINCT pattern_id) as unique_patterns 
                FROM assignment_patterns 
                WHERE assignment_id = $1
            `, [assignment.id]);
            console.log(`Unique Pattern IDs: ${uniquePatternsRes.rows[0].unique_patterns}`);

            // List details
            const detailsRes = await client.query(`
                SELECT ap.id, t.name as topic, p.pattern, ap.difficulty
                FROM assignment_patterns ap
                JOIN topics t ON ap.topic_id = t.id
                JOIN patterns p ON ap.pattern_id = p.id
                WHERE ap.assignment_id = $1
                ORDER BY t.name, p.pattern, ap.difficulty
            `, [assignment.id]);

            console.table(detailsRes.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

inspectAssignmentPatterns();
