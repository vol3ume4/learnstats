const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkPracticeHistory() {
    try {
        await client.connect();

        // Check practice_history table
        const countQuery = 'SELECT COUNT(*) as total FROM practice_history';
        const countResult = await client.query(countQuery);
        console.log(`\n=== Total practice history records: ${countResult.rows[0].total} ===`);

        if (countResult.rows[0].total > 0) {
            // Show sample data
            const sampleQuery = `
        SELECT 
          ph.id,
          ph.user_id,
          ph.topic_id,
          ph.pattern_id,
          ph.difficulty,
          ph.correct,
          t.name as topic_name,
          p.pattern as pattern_name
        FROM practice_history ph
        LEFT JOIN topics t ON ph.topic_id = t.id
        LEFT JOIN patterns p ON ph.pattern_id = p.id
        LIMIT 10
      `;
            const sampleResult = await client.query(sampleQuery);

            console.log('\n=== Sample Practice History ===');
            sampleResult.rows.forEach(row => {
                console.log(`ID: ${row.id}, Topic: ${row.topic_name} (${row.topic_id}), Pattern: ${row.pattern_name} (${row.pattern_id}), Difficulty: ${row.difficulty}, Correct: ${row.correct}`);
            });

            // Check by topic and pattern
            const groupQuery = `
        SELECT 
          topic_id,
          pattern_id,
          difficulty,
          COUNT(*) as count
        FROM practice_history
        GROUP BY topic_id, pattern_id, difficulty
        ORDER BY topic_id, pattern_id, difficulty
      `;
            const groupResult = await client.query(groupQuery);

            console.log('\n=== Questions by Topic/Pattern/Difficulty ===');
            groupResult.rows.forEach(row => {
                console.log(`Topic ${row.topic_id}, Pattern ${row.pattern_id}, ${row.difficulty}: ${row.count} questions`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkPracticeHistory();
