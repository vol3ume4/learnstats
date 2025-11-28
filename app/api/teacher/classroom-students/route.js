import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const classroomId = searchParams.get('classroomId');

        if (!classroomId) {
            return Response.json({ error: 'Classroom ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const { data, error } = await supabase
            .from('classroom_enrollments')
            .select('id, student_id, is_active, enrolled_at')
            .eq('classroom_id', classroomId)
            .order('enrolled_at', { ascending: false });

        if (error) throw error;

        // Get emails from auth.users
        const students = await Promise.all(data.map(async (s) => {
            const { data: userData } = await supabase.auth.admin.getUserById(s.student_id);
            return {
                id: s.id,
                studentId: s.student_id,
                email: userData?.user?.email || 'Unknown',
                isActive: s.is_active,
                joinedAt: s.enrolled_at
            };
        }));

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
