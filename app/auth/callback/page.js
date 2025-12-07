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
                try { localStorage.setItem('rk_last_oauth_url', url.href); } catch (_) { }

                const start = url.searchParams.get('start');
                if (start === 'google') {
                    const origin = window.location.origin.replace(/\/$/, '');
                    const callbackUrl = `${origin}/auth/callback`;
                    const failureUrl = `${origin}/login?error=oauth_failed`;
                    try {
                        account.createOAuth2Session(
                            'google',
                            callbackUrl,
                            failureUrl,
                            ['https://www.googleapis.com/auth/drive.file']
                        );
                        return;
                    } catch (e) {
                        console.error('[OAuth Callback] Failed to start OAuth in-app:', e);
                        try { localStorage.setItem('rk_last_oauth_error', 'start_oauth_failed'); } catch (_) { }
                        // Continue to normal handling
                    }
                }
                const nested = url.searchParams.get('url');
                if (nested) {
                    try {
                        const full = new URL(nested);
                        const nestedUserId = full.searchParams.get('userId');
                        const nestedSecret = full.searchParams.get('secret');
                        if (nestedUserId && nestedSecret) {
                            sessionStorage.setItem('oauth_userId', nestedUserId);
                            sessionStorage.setItem('oauth_secret', nestedSecret);
                            console.log('[OAuth Callback] Extracted nested params from url=...');
                        } else {
                            const inner = full.searchParams.get('url');
                            if (inner) {
                                const innerUrl = new URL(inner);
                                // If inner is an HTTPS callback, navigate there directly
                                if (innerUrl.protocol === 'https:' || innerUrl.protocol === 'http:') {
                                    window.location.href = innerUrl.href;
                                    return;
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[OAuth Callback] Failed to parse nested url param:', e);
                    }
                }

                // IMPORTANT: Capture userId and secret IMMEDIATELY before Appwrite processes them
                // Store them in sessionStorage so we can use them later if needed
                const initialUserId = url.searchParams.get('userId');
                const initialSecret = url.searchParams.get('secret');
                if (initialUserId && initialSecret) {
                    sessionStorage.setItem('oauth_userId', initialUserId);
                    sessionStorage.setItem('oauth_secret', initialSecret);
                    console.log('[OAuth Callback] Stored OAuth params in sessionStorage');
                }

                // Android deep link (rkai://callback)
                if (url.protocol === 'rkai:') {
                    const sessionId = url.searchParams.get('sessionId');
                    const userId = url.searchParams.get('userId');
                    const secret = url.searchParams.get('secret');

                    // If we have userId and secret from OAuth callback, establish session
                    if (userId && secret) {
                        console.log('[OAuth Callback] Deep link with session params, creating session...');
                        try {
                            // Create session directly using Appwrite SDK
                            await account.createSession(userId, secret);
                            console.log('[OAuth Callback] Session created successfully from deep link');

                            // Wait a moment for session to be fully established
                            await new Promise(resolve => setTimeout(resolve, 500));

                            // Verify session
                            const session = await account.get();
                            if (session && session.$id) {
                                console.log('[OAuth Callback] Session verified:', session.$id);
                                const hasDeviceSlug = typeof localStorage !== 'undefined' && localStorage.getItem('rk_device_slug');
                                const route = hasDeviceSlug ? 'home' : 'connect';
                                router.push(`/${route}`);
                                return;
                            } else {
                                console.error('[OAuth Callback] Session creation failed - no session after createSession');
                                router.push('/login?error=session_failed');
                                return;
                            }
                        } catch (error) {
                            console.error('[OAuth Callback] Session creation error:', error);
                            try { localStorage.setItem('rk_last_oauth_error', 'session_creation_failed'); } catch (_) { }
                            router.push('/login?error=session_creation_failed');
                            return;
                        }
                    }

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
                let userId = url.searchParams.get('userId');
                let secret = url.searchParams.get('secret');
                const code = url.searchParams.get('code'); // Google OAuth code (if direct OAuth)

                // If not in URL, try to get from sessionStorage (stored at page load)
                if (!userId) userId = sessionStorage.getItem('oauth_userId');
                if (!secret) secret = sessionStorage.getItem('oauth_secret');

                console.log('[OAuth Callback] URL params:', {
                    userId: userId ? 'present' : 'missing',
                    secret: secret ? 'present' : 'missing',
                    code: code ? 'present' : 'missing',
                    allParams: Object.fromEntries(url.searchParams.entries()),
                    fullUrl: url.href
                });

                // Appwrite OAuth callback with userId and secret
                if (userId && secret) {
                    // Check if we're in Android app (Capacitor) - if so, create session directly
                    const isAndroidApp = typeof window !== 'undefined' &&
                        window.Capacitor &&
                        window.Capacitor.isNativePlatform &&
                        window.Capacitor.isNativePlatform();

                    // If in app's WebView, create session directly (Real App Approach)
                    if (isAndroidApp) {
                        console.log('[OAuth Callback] ✅ In app WebView, creating session directly...');
                        console.log('[OAuth Callback] userId length:', userId?.length, 'secret length:', secret?.length);
                        try {
                            await account.createSession(userId, secret);
                            console.log('[OAuth Callback] createSession call completed');

                            // Wait for session to be fully established
                            await new Promise(resolve => setTimeout(resolve, 1000));

                            const session = await account.get();
                            console.log('[OAuth Callback] Session check - has session:', !!session?.$id);

                            if (session && session.$id) {
                                console.log('[OAuth Callback] ✅ Session created successfully in app WebView:', session.$id);
                                const hasDeviceSlug = typeof localStorage !== 'undefined' && localStorage.getItem('rk_device_slug');
                                const route = hasDeviceSlug ? 'home' : 'connect';
                                router.push(`/${route}`);
                                return;
                            } else {
                                console.error('[OAuth Callback] ❌ Session not found after createSession');
                            }
                        } catch (err) {
                            console.error('[OAuth Callback] ❌ Session creation failed in app:', err);
                            console.error('[OAuth Callback] Error details:', {
                                message: err.message,
                                code: err.code,
                                type: err.type
                            });
                            router.push('/login?error=session_creation_failed');
                            return;
                        }
                    }

                    // Appwrite OAuth callback - session should be automatically established
                    // Wait a moment for Appwrite SDK to process the callback
                    console.log('[OAuth Callback] Appwrite OAuth callback detected, waiting for session...');
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    try {
                        const session = await account.get();
                        if (session && session.$id) {
                            console.log('[OAuth Callback] Session established successfully:', session.$id);

                            // Check if we're in a mobile browser (likely opened from app)
                            const isMobileBrowser = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                            // If in mobile browser (opened from app), redirect to app
                            if (isMobileBrowser && !isAndroidApp) {
                                console.log('[OAuth Callback] Mobile browser detected, redirecting to app...');
                                // Check device slug first to decide route
                                const hasDeviceSlug = typeof localStorage !== 'undefined' && localStorage.getItem('rk_device_slug');
                                const route = hasDeviceSlug ? 'home' : 'connect';

                                // REAL APP APPROACH: Pass the full callback URL to app
                                // App's WebView will load this URL, and Appwrite will automatically process it
                                const fullCallbackUrl = window.location.href; // Contains userId/secret in URL
                                const deepLinkUrl = `rkai://callback?url=${encodeURIComponent(fullCallbackUrl)}&route=${route}`;

                                console.log('[OAuth Callback] Redirecting to app with full callback URL');
                                // Redirect to app
                                window.location.href = deepLinkUrl;

                                // Fallback: If redirect doesn't work (not in app context), navigate normally after timeout
                                setTimeout(() => {
                                    console.log('[OAuth Callback] Fallback: navigating to', route);
                                    router.push(`/${route}`);
                                }, 2000);
                                return;
                            }

                            // Web or already in app: normal navigation (check device slug first)
                            const hasDeviceSlug = typeof localStorage !== 'undefined' && localStorage.getItem('rk_device_slug');
                            const route = hasDeviceSlug ? 'home' : 'connect';
                            router.push(`/${route}`);
                            return;
                        }
                    } catch (sessionError) {
                        console.error('[OAuth Callback] Session check failed:', sessionError);
                        try { localStorage.setItem('rk_last_oauth_error', 'session_check_failed'); } catch (_) { }
                    }

                    // Session establishment failed
                    try { localStorage.setItem('rk_last_oauth_error', 'session_failed'); } catch (_) { }
                    router.push('/login?error=session_failed');
                    return;
                }

                // Note: If we have a Google OAuth code but no userId/secret,
                // it means Appwrite OAuth didn't complete properly.
                // This shouldn't happen if using Appwrite's getOAuth2Url()
                if (code && !userId && !secret) {
                    console.warn('[OAuth Callback] Google OAuth code present but no Appwrite params - OAuth flow may be incomplete');
                    try { localStorage.setItem('rk_last_oauth_error', 'oauth_incomplete'); } catch (_) { }
                    // This suggests the OAuth flow wasn't completed through Appwrite
                    // We should use Appwrite's OAuth, not direct Google OAuth
                    router.push('/login?error=oauth_incomplete');
                    return;
                }

                // No OAuth params in URL, but session might be established via cookies
                // This happens when Appwrite OAuth completes and sets cookies
                // OR when callback URL is loaded in app's WebView (from deep link)
                const isAndroidApp = typeof window !== 'undefined' &&
                    window.Capacitor &&
                    window.Capacitor.isNativePlatform &&
                    window.Capacitor.isNativePlatform();

                console.log('[OAuth Callback] No userId/secret in URL, checking for session via cookies...');
                console.log('[OAuth Callback] Is Android App:', isAndroidApp);

                try {
                    // Wait a bit for Appwrite to process cookies if any
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const session = await account.get();
                    if (session && session.$id) {
                        console.log('[OAuth Callback] ✅ Session found via cookies:', session.$id);

                        // Check device slug to decide route
                        const hasDeviceSlug = typeof localStorage !== 'undefined' && localStorage.getItem('rk_device_slug');
                        const route = hasDeviceSlug ? 'home' : 'connect';

                        // If in app's WebView, session is already established - just navigate
                        if (isAndroidApp) {
                            console.log('[OAuth Callback] In app WebView with session, navigating to', route);
                            router.push(`/${route}`);
                            return;
                        }

                        // Check if we're in mobile browser (opened from Android app)
                        const isMobileBrowser = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                        // If mobile browser (opened from Android app), pass session to app
                        if (isMobileBrowser && !isAndroidApp) {
                            console.log('[OAuth Callback] Mobile browser detected, passing session to app...');

                            // REAL APP APPROACH: Pass full callback URL (even if no params, session is in cookies)
                            // App's WebView will load this URL and Appwrite will process it
                            const fullCallbackUrl = window.location.href;
                            const deepLinkUrl = `rkai://callback?url=${encodeURIComponent(fullCallbackUrl)}&route=${route}`;

                            console.log('[OAuth Callback] Redirecting to app with callback URL');
                            window.location.href = deepLinkUrl;

                            // Clean up sessionStorage
                            sessionStorage.removeItem('oauth_userId');
                            sessionStorage.removeItem('oauth_secret');

                            // Fallback after timeout
                            setTimeout(() => {
                                router.push(`/${route}`);
                            }, 2000);
                            return;
                        }

                        // Already in app or web, just navigate
                        router.push(`/${route}`);
                        return;
                    } else {
                        console.error('[OAuth Callback] ❌ No session found via cookies either');
                        if (isAndroidApp) {
                            // In app but no session - this shouldn't happen
                            console.error('[OAuth Callback] In app WebView but no session - OAuth might have failed');
                            router.push('/login?error=no_session_in_app');
                            return;
                        }
                    }
                } catch (sessionError) {
                    console.error('[OAuth Callback] Error checking session:', sessionError);
                    if (isAndroidApp) {
                        router.push('/login?error=session_check_failed');
                        return;
                    }
                }

                // If we reach here, something went wrong
                router.push('/login?error=callback_error');
            } catch (err) {
                console.error('OAuth callback error:', err);
                try { localStorage.setItem('rk_last_oauth_error', 'callback_error'); } catch (_) { }
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
