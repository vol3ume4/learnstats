import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return Response.json({ error: 'Student ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Get classrooms the student is enrolled in
        const { data: enrollments, error: enrollError } = await supabase
            .from('classroom_students')
            .select(`
                classroom_id,
                classrooms (
                    id,
                    name,
                    description,
                    teacher_id,
                    invite_code,
                    created_at
                )
            `)
            .eq('student_id', studentId);

        if (enrollError) throw enrollError;

        // Get teacher info and assignment counts for each classroom
        const classroomsWithDetails = await Promise.all(
            enrollments.map(async (enrollment) => {
                const classroom = enrollment.classrooms;

                // Get teacher info
                const { data: teacher } = await supabase
                    .from('profiles')
                    .select('id, email')
                    .eq('id', classroom.teacher_id)
                    .single();

                // Get student count
                const { count: studentCount } = await supabase
                    .from('classroom_students')
                    .select('*', { count: 'exact', head: true })
                    .eq('classroom_id', classroom.id);

                // Get assignment count
                const { count: assignmentCount } = await supabase
                    .from('assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('classroom_id', classroom.id)
                    .eq('is_active', true);

                return {
                    ...classroom,
                    teacher: teacher || { email: 'Unknown' },
                    studentCount: studentCount || 0,
                    assignmentCount: assignmentCount || 0
                };
            })
        );

        return Response.json({ classrooms: classroomsWithDetails });

    } catch (error) {
        console.error('Error fetching classrooms:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
