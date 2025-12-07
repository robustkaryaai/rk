"use client";
// OAuth Callback Handler Page
import { useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

export default function OAuthCallbackPage() {
    const router = useRouter();
    useEffect(() => {
        const handleCallback = async () => {
            try {
                const url = new URL(window.location.href);
                // Declare once, reuse everywhere
                const isAndroidApp = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
                console.log('[OAuth Callback] Page loaded. Is Android App:', isAndroidApp);
                console.log('[OAuth Callback] Full URL:', window.location.href);
                console.log('[OAuth Callback] All URL params:', Object.fromEntries(url.searchParams.entries()));
                // IMPORTANT: Capture userId and secret IMMEDIATELY before Appwrite processes them
                // Store them in sessionStorage so we can use them later if needed
                const initialUserId = url.searchParams.get('userId');
                const initialSecret = url.searchParams.get('secret');
                if (initialUserId && initialSecret) {
                    sessionStorage.setItem('oauth_userId', initialUserId);
                    sessionStorage.setItem('oauth_secret', initialSecret);
                    console.log('[OAuth Callback] ✅ Stored OAuth params in sessionStorage');
                } else {
                    console.log('[OAuth Callback] ⚠️ No userId/secret in URL - Appwrite using cookies');
                }
                if (isAndroidApp && !initialUserId && !initialSecret) {
                    console.log('[OAuth Callback] In app WebView with no URL params - waiting for Appwrite to process...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                // ... rest of your function's logic ...
            } catch (error) {
                console.error('[OAuth Callback] Unhandled error:', error);
                router.push('/login?error=callback_error');
            }
        };
        handleCallback();
    }, [router]);
    return (
        <div>Processing OAuth Callback...</div>
    );
}
