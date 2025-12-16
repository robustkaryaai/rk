import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase;
try {
    if (supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else {
        const notConfigured = () => ({ message: 'Supabase not configured' });
        supabase = {
            storage: {
                from: () => ({
                    list: async () => ({ data: [], error: notConfigured() }),
                    upload: async () => ({ data: null, error: notConfigured() }),
                    getPublicUrl: () => ({ data: { publicUrl: '' } }),
                    remove: async () => ({ data: null, error: notConfigured() })
                })
            }
        };
    }
} catch {
    supabase = {
        storage: {
            from: () => ({
                list: async () => ({ data: [], error: { message: 'Supabase init failed' } }),
                upload: async () => ({ data: null, error: { message: 'Supabase init failed' } }),
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
                remove: async () => ({ data: null, error: { message: 'Supabase init failed' } })
            })
        }
    };
}

export { supabase };

// Helper to get current user's Auth ID (from session or Appwrite)
// Note: This needs to be passed in from AuthContext usually, but if stored in localStorage:
export const getCurrentUserId = () => {
    // Implementation depends on how we persist ID, or just return null and rely on Context
    if (typeof window !== 'undefined') {
        const session = localStorage.getItem('cookieFallback'); // Appwrite stores generic fallback 
        // Ideally we don't access localStorage directly for ID but rely on AuthContext hooks
    }
    return null;
};
