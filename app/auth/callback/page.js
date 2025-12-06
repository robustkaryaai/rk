'use client';

import { useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

/**
 * OAuth Callback Handler Page
 * Handles:
 *  - Web login via Appwrite OAuth
 *  - Mobile app login via deep link (rkai://callback)
 */
export default function OAuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('[OAuth Callback] Page loaded:', window.location.href);

                const url = new URL(window.location.href);

                // Check if coming via mobile deep link
                if (url.protocol === 'rkai:') {
                    // Example: rkai://callback?sessionId=...
                    const sessionId = url.searchParams.get('sessionId');
                    console.log('[OAuth Callback] Mobile deep link detected, sessionId:', sessionId);

                    if (sessionId) {
                        // Call your native-exchange API to finalize session
                        await fetch('/api/auth/google/native-exchange', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId })
                        });
                        // Send user back to your app via deep link (optional)
                        window.location.href = 'rkai://home';
                        return;
                    }
                }

                // Web flow: small delay to ensure Appwrite session cookie is set
                await new Promise(resolve => setTimeout(resolve, 500));

                // Confirm session
                const user = await account.get();
                console.log('[OAuth Callback] Session established! User:', user.email);

                // Redirect to home
                router.push('/home');
            } catch (err) {
                console.error('[OAuth Callback] Error handling callback:', err);
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
