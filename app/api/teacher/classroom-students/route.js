import { getSupabaseServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const classroomId = searchParams.get('classroomId');

        if (!classroomId) {
            return Response.json({ error: 'Classroom ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Direct SQL query to join with auth.users
        const { data, error } = await supabase
            .from('classroom_enrollments')
            .select(`
                id,
                student_id,
                is_active,
                enrolled_at
            `)
            .eq('classroom_id', classroomId)
            .order('enrolled_at', { ascending: false });

        if (error) throw error;

        // Create Admin Client for fetching emails (requires Service Role Key)
        let adminClient = null;
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            adminClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
        } else {
            console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Emails will not be fetched.");
        }

        // Fetch emails separately using service role
        const students = [];
        for (const enrollment of data) {
            let email = 'Unknown';

            if (adminClient) {
                try {
                    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(enrollment.student_id);
                    if (!userError && user) {
                        email = user.email;
                    }
                } catch (err) {
                    console.error(`Failed to fetch user ${enrollment.student_id}:`, err);
                }
            } else {
                email = 'Email Hidden (Config Error)';
            }

            students.push({
                id: enrollment.id,
                student_id: enrollment.student_id,
                email: email,
                is_active: enrollment.is_active,
                joined_at: enrollment.enrolled_at
            });
        }

        return Response.json({ students });

    } catch (error) {
        console.error('Error fetching students:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { studentId, classroomId, isActive } = await request.json();

        const supabase = getSupabaseServerClient();

        const { error } = await supabase
            .from('classroom_enrollments')
            .update({ is_active: isActive })
            .eq('student_id', studentId)
            .eq('classroom_id', classroomId);

        if (error) throw error;

        return Response.json({ success: true });

    } catch (error) {
        console.error('Error updating student:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
