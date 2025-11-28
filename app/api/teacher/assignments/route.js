import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const classroomId = searchParams.get('classroomId');

        if (!classroomId) {
            return Response.json({ error: 'Classroom ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        const { data: assignments, error } = await supabase
            .from('assignments')
            .select(`
                *,
                assignment_patterns (
                    count
                )
            `)
            .eq('classroom_id', classroomId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to get pattern count
        const formattedAssignments = assignments.map(a => ({
            ...a,
            patternCount: a.assignment_patterns?.length || 0
        }));

        return Response.json({ assignments: formattedAssignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { classroomId, title, description, dueDate, patterns, teacherId } = await request.json();

        if (!classroomId || !title || !patterns || patterns.length === 0) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // 1. Create Assignment
        const { data: assignment, error: assignmentError } = await supabase
            .from('assignments')
            .insert({
                classroom_id: classroomId,
                title,
                description,
                due_date: dueDate,
                created_by: teacherId
            })
            .select()
            .single();

        if (assignmentError) throw assignmentError;

        // 2. Create Assignment Patterns
        const patternInserts = patterns.map(p => ({
            assignment_id: assignment.id,
            topic_id: p.topicId,
            pattern_id: p.patternId,
            difficulty: p.difficulty,
            required_questions: p.count
        }));

        const { error: patternsError } = await supabase
            .from('assignment_patterns')
            .insert(patternInserts);

        if (patternsError) {
            // Rollback assignment if patterns fail
            await supabase.from('assignments').delete().eq('id', assignment.id);
            throw patternsError;
        }

        return Response.json({ success: true, assignment });

    } catch (error) {
        console.error('Error creating assignment:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
