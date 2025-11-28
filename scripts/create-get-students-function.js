const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createFunction() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE OR REPLACE FUNCTION get_classroom_students(p_classroom_id INTEGER)
            RETURNS TABLE (
                id INTEGER,
                student_id UUID,
                email TEXT,
                is_active BOOLEAN,
                joined_at TIMESTAMPTZ
            )
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    ce.id,
                    ce.student_id,
                    au.email,
                    ce.is_active,
                    ce.enrolled_at as joined_at
                FROM classroom_enrollments ce
                JOIN auth.users au ON ce.student_id = au.id
                WHERE ce.classroom_id = p_classroom_id
                ORDER BY ce.enrolled_at DESC;
            END;
            $$;
        `);
        console.log('✅ Function created successfully');
    } finally {
        client.release();
        await pool.end();
    }
}

createFunction();
