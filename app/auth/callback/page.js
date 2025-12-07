'use client';

import { useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

/**
 * OAuth Callback Handler Page
 * Handles:
 *  - Web login via Appwrite OAuth (HTTP/HTTPS callback)
 *  - Mobile app login via deep link (rkai://callback)
 */
export default function OAuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const url = new URL(window.location.href);

                // Android deep link (rkai://callback)
                if (url.protocol === 'rkai:') {
                    const sessionId = url.searchParams.get('sessionId');
                    if (sessionId) {
                        await fetch('/api/auth/google/native-exchange', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId }),
                        });

                        // Navigate to home after successful login
                        router.push('/home');
                        return;
                    }
                }

                // Appwrite OAuth callback (HTTP/HTTPS)
                // Appwrite redirects here with query params to establish session
                // Check for Appwrite OAuth callback params
                const userId = url.searchParams.get('userId');
                const secret = url.searchParams.get('secret');
                const code = url.searchParams.get('code'); // Google OAuth code (if direct OAuth)
                
                console.log('[OAuth Callback] URL params:', { 
                    userId, 
                    secret, 
                    code: code ? 'present' : 'missing',
                    allParams: Object.fromEntries(url.searchParams.entries()),
                    fullUrl: url.href 
                });
                
                // Appwrite OAuth callback with userId and secret
                if (userId && secret) {
                    // Appwrite OAuth callback - session should be automatically established
                    // Wait a moment for Appwrite SDK to process the callback
                    console.log('[OAuth Callback] Appwrite OAuth callback detected, waiting for session...');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Check if we're in Android app (Capacitor)
                    const isAndroidApp = typeof window !== 'undefined' && 
                        window.Capacitor && 
                        window.Capacitor.isNativePlatform && 
                        window.Capacitor.isNativePlatform();
                    
                    try {
                        const session = await account.get();
                        if (session && session.$id) {
                            console.log('[OAuth Callback] Session established successfully:', session.$id);
                            
                            // If Android app, redirect to app using custom scheme
                            if (isAndroidApp) {
                                console.log('[OAuth Callback] Android app detected, redirecting to app...');
                                // Build deep link URL - app will check session on its own
                                const deepLinkUrl = `rkai://callback?success=true`;
                                // Small delay to ensure session is fully established
                                setTimeout(() => {
                                    window.location.href = deepLinkUrl;
                                }, 500);
                                return;
                            }
                            
                            // Web: normal navigation
                            router.push('/home');
                            return;
                        }
                    } catch (sessionError) {
                        console.error('[OAuth Callback] Session check failed:', sessionError);
                    }
                    
                    // Retry once more
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    try {
                        const session = await account.get();
                        if (session && session.$id) {
                            console.log('[OAuth Callback] Session established on retry');
                            
                            // If Android app, redirect to app using custom scheme
                            if (isAndroidApp) {
                                console.log('[OAuth Callback] Android app detected on retry, redirecting to app...');
                                const deepLinkUrl = `rkai://callback?success=true`;
                                setTimeout(() => {
                                    window.location.href = deepLinkUrl;
                                }, 500);
                                return;
                            }
                            
                            router.push('/home');
                            return;
                        }
                    } catch (retryError) {
                        console.error('[OAuth Callback] Retry failed:', retryError);
                    }
                    
                    router.push('/login?error=session_failed');
                    return;
                }
                
                // Note: If we have a Google OAuth code but no userId/secret,
                // it means Appwrite OAuth didn't complete properly.
                // This shouldn't happen if using Appwrite's getOAuth2Url()
                if (code && !userId && !secret) {
                    console.warn('[OAuth Callback] Google OAuth code present but no Appwrite params - OAuth flow may be incomplete');
                    // This suggests the OAuth flow wasn't completed through Appwrite
                    // We should use Appwrite's OAuth, not direct Google OAuth
                    router.push('/login?error=oauth_incomplete');
                    return;
                }
                
                // No OAuth params, check if session already exists
                try {
                    const session = await account.get();
                    if (session && session.$id) {
                        console.log('[OAuth Callback] Existing session found');
                        router.push('/home');
                        return;
                    }
                } catch (sessionError) {
                    console.error('[OAuth Callback] No session found:', sessionError);
                }

                // If we reach here, something went wrong
                router.push('/login?error=callback_error');
            } catch (err) {
                console.error('OAuth callback error:', err);
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
