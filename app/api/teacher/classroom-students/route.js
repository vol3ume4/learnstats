import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const classroomId = searchParams.get('classroomId');

        if (!classroomId) {
            return Response.json({ error: 'Classroom ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Use raw SQL to join with auth.users
        const { data, error } = await supabase.rpc('get_classroom_students', {
            p_classroom_id: classroomId
        });

        if (error) throw error;

        return Response.json({ students: data || [] });

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
