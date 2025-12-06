import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current user's Clerk ID (from localStorage or session)
export const getCurrentClerkId = () => {
    if (typeof window !== 'undefined') {
        // This would be set by Clerk - you may need to adjust based on your Clerk setup
        return localStorage.getItem('clerk_user_id');
    }
    return null;
};
