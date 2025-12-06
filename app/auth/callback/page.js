'use client';

import { useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

/**
 * OAuth Callback Handler Page
 * 
 * This page is where Appwrite redirects after Google OAuth is complete.
 * 
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google login
 * 3. Google redirects back to this page (Appwrite OAuth callback)
 * 4. This page establishes the session
 * 5. This page redirects to /home
 * 6. (On Android) Deep link will intercept and bring app to foreground
 * 
 * URL: https://rk-alpha-nine.vercel.app/auth/callback
 */

export default function OAuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('[OAuth Callback] Page loaded');
                console.log('[OAuth Callback] Current URL:', window.location.href);

                // Small delay to ensure Appwrite has set the session cookie
                await new Promise(resolve => setTimeout(resolve, 500));

                // Try to get the user - this will confirm session is established
                try {
                    const user = await account.get();
                    console.log('[OAuth Callback] Session established! User:', user.email);
                    
                    // Session is good, redirect to home
                    console.log('[OAuth Callback] Redirecting to /home');
                    router.push('/home');
                } catch (sessionError) {
                    console.error('[OAuth Callback] Failed to get session:', sessionError.message);
                    // Session not established, go back to login
                    router.push('/login?error=session_failed');
                }
            } catch (error) {
                console.error('[OAuth Callback] Error:', error);
                router.push('/login?error=callback_error');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#0a0e27',
            color: '#fff',
            fontSize: '18px'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid #4f46e5',
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }}></div>
                <p>Signing you in...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
