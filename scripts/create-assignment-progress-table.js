require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createAssignmentProgressTable() {
    try {
        console.log('Creating assignment_student_progress table...');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_student_progress (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        is_complete BOOLEAN DEFAULT false,
        is_late BOOLEAN DEFAULT false,
        UNIQUE(assignment_id, student_id)
      );
    `);

        console.log('✅ Table created successfully');

        console.log('Creating indexes...');
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assignment_progress_student 
      ON assignment_student_progress(student_id);
    `);

        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assignment_progress_assignment 
      ON assignment_student_progress(assignment_id);
    `);

        console.log('✅ Indexes created successfully');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

createAssignmentProgressTable();
