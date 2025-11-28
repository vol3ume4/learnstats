import { getSupabaseServerClient } from '@/lib/supabase';
import client from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('assignmentId');
        const studentId = searchParams.get('studentId');

        if (!assignmentId || !studentId) {
            return Response.json({ error: 'Assignment ID and Student ID required' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Get assignment patterns
        const { data: assignmentPatterns, error: patternsError } = await supabase
            .from('assignment_patterns')
            .select('*')
            .eq('assignment_id', assignmentId);

        if (patternsError) throw patternsError;

        // Get assignment start time
        const { data: progress } = await supabase
            .from('assignment_student_progress')
            .select('started_at')
            .eq('assignment_id', assignmentId)
            .eq('student_id', studentId)
            .single();

        const startedAt = progress?.started_at || new Date(0).toISOString();

        // Calculate progress for each pattern/difficulty
        const progressDetails = await Promise.all(
            assignmentPatterns.map(async (ap) => {
                const difficulty = ap.difficulty;
                const requiredCount = ap.required_questions;

                // Count correct answers since assignment started
                const query = `
                    SELECT COUNT(*) as completed_count
                    FROM practice_history
                    WHERE user_id = $1
                    AND pattern_id = $2
                    AND difficulty = $3
                    AND is_correct = true
                    AND created_at > $4
                `;

                const result = await client.query(query, [
                    studentId,
                    ap.pattern_id,
                    difficulty,
                    startedAt
                ]);

                let completedCount = parseInt(result.rows[0]?.completed_count || 0);

                // Cap at required count
                if (completedCount > requiredCount) completedCount = requiredCount;

                const isComplete = completedCount >= requiredCount;

                return {
                    pattern_id: ap.pattern_id,
                    topic_id: ap.topic_id,
                    difficulty,
                    required: requiredCount,
                    completed: completedCount,
                    isComplete
                };
            })
        );

        // Calculate overall progress
        const totalRequired = progressDetails.length;
        const totalCompleted = progressDetails.filter(p => p.isComplete).length;
        const progressPercentage = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
        const isFullyComplete = totalCompleted === totalRequired;

        return Response.json({
            progressDetails,
            summary: {
                totalRequired,
                totalCompleted,
                progressPercentage,
                isFullyComplete
            }
        });

    } catch (error) {
        console.error('Error calculating assignment progress:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { assignmentId, studentId, action } = await request.json();

        if (!assignmentId || !studentId || !action) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        if (action === 'start') {
            // Mark assignment as started
            const { data, error } = await supabase
                .from('assignment_student_progress')
                .upsert({
                    assignment_id: assignmentId,
                    student_id: studentId,
                    started_at: new Date().toISOString()
                }, {
                    onConflict: 'assignment_id,student_id',
                    ignoreDuplicates: false
                })
                .select()
                .single();

            if (error) throw error;
            return Response.json({ success: true, progress: data });

        } else if (action === 'complete') {
            // Get assignment due date
            const { data: assignment } = await supabase
                .from('assignments')
                .select('due_date')
                .eq('id', assignmentId)
                .single();

            const now = new Date();
            const isLate = assignment?.due_date && now > new Date(assignment.due_date);

            // Mark assignment as completed
            const { data, error } = await supabase
                .from('assignment_student_progress')
                .upsert({
                    assignment_id: assignmentId,
                    student_id: studentId,
                    completed_at: now.toISOString(),
                    is_complete: true,
                    is_late: isLate
                }, {
                    onConflict: 'assignment_id,student_id',
                    ignoreDuplicates: false
                })
                .select()
                .single();

            if (error) throw error;
            return Response.json({ success: true, progress: data, isLate });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error updating assignment progress:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
