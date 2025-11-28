import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { inviteCode, studentId } = await request.json();

        if (!inviteCode || !studentId) {
            return Response.json({ error: 'Invite code and student ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // 1. Find the classroom by invite code
        const { data: classroom, error: classroomError } = await supabase
            .from('classrooms')
            .select('id, name, teacher_id')
            .eq('invite_code', inviteCode)
            .eq('is_active', true)
            .single();

        if (classroomError || !classroom) {
            return Response.json({ error: 'Invalid invite code' }, { status: 404 });
        }

        // 2. Check if already enrolled
        const { data: existingEnrollment } = await supabase
            .from('classroom_enrollments')
            .select('id')
            .eq('classroom_id', classroom.id)
            .eq('student_id', studentId)
            .single();

        if (existingEnrollment) {
            return Response.json({
                message: 'Already enrolled',
                classroom
            }, { status: 200 });
        }

        // 3. Enroll the student
        const { error: enrollError } = await supabase
            .from('classroom_enrollments')
            .insert({
                classroom_id: classroom.id,
                student_id: studentId
            });

        if (enrollError) {
            console.error('Enrollment error:', enrollError);
            return Response.json({ error: 'Failed to enroll' }, { status: 500 });
        }

        return Response.json({
            success: true,
            classroom
        }, { status: 200 });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
