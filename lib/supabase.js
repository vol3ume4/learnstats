import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

/**
 * Get or create a singleton Supabase client for browser use
 * This prevents multiple GoTrueClient instances
 */
export function getSupabaseBrowserClient() {
    if (!supabaseClient) {
        supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
    }
    return supabaseClient;
}

/**
 * Create a new Supabase client with service role key for server-side operations
 * Should only be used in API routes or server components
 */
export function getSupabaseServerClient() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!key) {
        throw new Error('Supabase key is missing. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        key
    );
}
