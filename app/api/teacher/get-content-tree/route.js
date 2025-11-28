import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = getSupabaseServerClient();

        // Fetch topics
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('*')
            .order('id');

        if (topicsError) throw topicsError;

        // Fetch patterns
        const { data: patterns, error: patternsError } = await supabase
            .from('patterns')
            .select('*')
            .order('id');

        if (patternsError) throw patternsError;

        // Combine them
        const contentTree = topics.map(topic => ({
            ...topic,
            patterns: patterns.filter(p => p.topic_id === topic.id)
        }));

        return Response.json({ contentTree });
    } catch (error) {
        console.error('Error fetching content tree:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
