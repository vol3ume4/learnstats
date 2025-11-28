import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const classroomId = searchParams.get('classroomId');
        const studentId = searchParams.get('studentId');

        if (!classroomId || !studentId) {
            return Response.json({ error: 'Classroom ID and Student ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Get assignments for this classroom
        const { data: assignments, error: assignmentsError } = await supabase
            .from('assignments')
            .select(`
                id,
                title,
                description,
                due_date,
                created_at,
                status
            `)
            .eq('classroom_id', classroomId)
            .eq('is_active', true)
            .order('due_date', { ascending: true, nullsLast: true });

        if (assignmentsError) throw assignmentsError;

        // Get student's progress for each assignment
        const assignmentsWithProgress = await Promise.all(
            assignments.map(async (assignment) => {
                // Get progress record
                const { data: progress } = await supabase
                    .from('assignment_student_progress')
                    .select('*')
                    .eq('assignment_id', assignment.id)
                    .eq('student_id', studentId)
                    .single();

                // Get unique pattern count
                const { data: patterns } = await supabase
                    .from('assignment_patterns')
                    .select('pattern_id')
                    .eq('assignment_id', assignment.id);

                const uniquePatterns = new Set(patterns?.map(p => p.pattern_id));
                const patternCount = uniquePatterns.size;

                // Calculate status
                let status = 'not_started';
                let isOverdue = false;

                if (assignment.due_date) {
                    const dueDate = new Date(assignment.due_date);
                    const now = new Date();
                    isOverdue = now > dueDate && !progress?.is_complete;
                }

                if (progress) {
                    if (progress.is_complete) {
                        status = progress.is_late ? 'completed_late' : 'completed';
                    } else if (progress.started_at) {
                        status = isOverdue ? 'overdue' : 'in_progress';
                    }
                } else if (isOverdue) {
                    status = 'overdue';
                }

                return {
                    ...assignment,
                    patternCount: patternCount || 0,
                    progress: progress || null,
                    status,
                    isOverdue
                };
            })
        );

        return Response.json({ assignments: assignmentsWithProgress });

    } catch (error) {
        console.error('Error fetching classroom assignments:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
