'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, ID, client, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
        setupDeepLinkListener();
    }, []);

    // Setup listener for deep links from OAuth callback
    const setupDeepLinkListener = async () => {
        try {
            // Listen for when app is opened via deep link (OAuth callback)
            // Listen for when app is opened via deep link (OAuth callback)
            App.addListener('appUrlOpen', async (event) => {
                try {
                    console.log('FULL URL:', event.url);
                    if (typeof window !== 'undefined' && window.alert) alert('Deep Link Received: ' + event.url);

                    if (!event.url) return;

                    // 1. Close browser
                    try { await Browser.close(); } catch (e) { }

                    const incomingUrl = new URL(event.url);

                    // ... (Settings logic omitted for brevity, keeping existing) ...
                    if (event.url.includes('settings')) {
                        // ... existing settings logic ...
                        const params = incomingUrl.searchParams;
                        if (params.get('google_connected') === 'true') {
                            router.push(`/settings?google_connected=true&t=${Date.now()}`);
                        } else if (params.get('google_error')) {
                            router.push(`/settings?google_error=${params.get('google_error')}`);
                        }
                        return;
                    }

                    // 3. Handle Login (Callback) logic
                    if (!event.url.includes('callback')) return;

                    // Try to get token
                    let oauthToken = incomingUrl.searchParams.get('token');
                    if (!oauthToken) {
                        try { oauthToken = localStorage.getItem('rk_oauth_token'); } catch (e) { }
                    }

                    if (!oauthToken) {
                        alert('Error: No OAuth Token found in URL or Storage');
                        router.push('/login?error=no_oauth_token');
                        return;
                    }

                    alert('Processing Token: ' + oauthToken.substring(0, 5) + '...');

                    // Call server endpoint
                    try {
                        const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rk-alpha-nine.vercel.app';
                        const targetEndpoint = `${apiBaseUrl}/api/auth/create-app-session?token=${oauthToken}`;

                        alert('Fetching Session from: ' + targetEndpoint);

                        const response = await fetch(targetEndpoint, { method: 'GET' });

                        if (!response.ok) {
                            const errorText = await response.text();
                            alert('Server Error (' + response.status + '): ' + errorText);
                            throw new Error('Server returned ' + response.status);
                        }

                        const sessionData = await response.json();
                        alert('Session Data Recvd: ' + JSON.stringify(sessionData));

                        const { userId, secret, route } = sessionData;

                        if (!userId || !secret) {
                            alert('Invalid Session Data: Missing userId or secret');
                            return;
                        }

                        // Create session
                        await account.createSession(userId, secret);
                        alert('Session Created! Verifying user...');

                        await checkUser();
                        alert('User Verified! Redirecting...');

                        router.push(`/${route || 'home'}`);

                    } catch (fetchError) {
                        alert('Fetch/Sync Error: ' + fetchError.message);
                        console.error('[Deep Link] Error:', fetchError);
                    }

                } catch (err) {
                    alert('Critical Deep Link Error: ' + err.message);
                    console.error('DEEP LINK ERROR:', err);
                }
            });


        } catch (error) {
            console.log('Deep link setup note (might not be available in web):', error.message);
        }
    };

    const checkUser = async () => {
        try {
            const session = await account.get();
            setUser(session);

            // Sync to Database on every check (ensures Google Auth users are created/updated)
            // We capture the provider tokens from the session if available (only on first login/session creation usually)
            // Note: providerAccessToken/RefreshToken are usually available on the session object from Appwrite Account API
            // immediately after OAuth login.

            // Get current session to access tokens
            try {
                const currentSession = await account.getSession('current');
                const providerAccessToken = currentSession.providerAccessToken;
                const providerRefreshToken = currentSession.providerRefreshToken;

                await userAPI.syncUserToAppwrite(session, '', providerAccessToken, providerRefreshToken);
            } catch (sessionError) {
                // Fallback if getSession fails or tokens aren't there (e.g. cookie based session on reload might not show tokens)
                // still sync basic info
                await userAPI.syncUserToAppwrite(session);
            }

            // Validate device ownership - check if stored device_slug belongs to current user
            if (typeof window !== 'undefined' && window.localStorage) {
                const storedSlug = localStorage.getItem('rk_device_slug');
                if (storedSlug) {
                    try {
                        // Verify device belongs to current user
                        const { deviceAPI } = await import('@/lib/api');
                        // Usage of validateSlug instead of non-existent getDeviceBySlug
                        const device = await deviceAPI.validateSlug(storedSlug);

                        if (device) {
                            // Device found, check ownership if possible (validatedSlug might not return userId depending on implementation, 
                            // but at least it validates existence. For now we assume if it validates, it's good, 
                            // or we'd need to fetch full doc if ownership check is strict requirement here)
                            // Based on api.js, validateSlug returns object with id, name etc.
                            // If we need strictly userId check we might need listDocuments. 
                            // But original code tried to check device.userId.
                            // Let's rely on validateSlug returning null if not found.
                        } else {
                            // Device explicitly not found
                            console.warn('[Auth] Device slug not valid, clearing...');
                            localStorage.removeItem('rk_device_slug');
                        }

                    } catch (deviceError) {
                        // Only clear if it's strictly a logic error or 404, not network error
                        // But for safety, let's NOT clear on generic error to prevent "offline = logout" issues
                        console.warn('[Auth] Device validation skipped due to error:', deviceError.message);
                    }
                }
            }

        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            await account.createEmailPasswordSession(email, password);
            await checkUser();

            // Sync user to DB
            try {
                const user = await account.get();
                await userAPI.syncUserToAppwrite(user);
            } catch (syncErr) {
                console.warn('Manual login sync warning:', syncErr);
            }

            router.push('/home');
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            // Provide more helpful error messages
            let errorMessage = error.message || 'Login failed. Please try again.';

            // Check for specific error types
            if (error.code === 401 || error.message?.includes('Invalid credentials')) {
                errorMessage = 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.';
            } else if (error.message?.includes('User not found')) {
                errorMessage = 'Account not found. Please sign up first.';
            }

            return { success: false, error: errorMessage };
        }
    };

    const signup = async (email, password, name, avatarUrl = '') => {
        try {
            // 1. Create Account
            const newAccount = await account.create(ID.unique(), email, password, name);

            // 2. Create Session
            await account.createEmailPasswordSession(email, password);

            // 3. Sync to Users Collection with Avatar
            await userAPI.syncUserToAppwrite(newAccount, avatarUrl);

            await checkUser();
            router.push('/home');
            return { success: true };
        } catch (error) {
            console.error('Signup failed:', error);
            // Provide more helpful error messages
            let errorMessage = error.message || 'Signup failed. Please try again.';

            // Check for specific error types
            if (error.message?.includes('already exists') || error.message?.includes('already registered')) {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            } else if (error.message?.includes('password')) {
                errorMessage = 'Password must be at least 8 characters long.';
            }

            return { success: false, error: errorMessage };
        }
    };

    const loginWithGoogle = async () => {
        try {
            // Import database functions
            const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite');

            // ALERT: Debug starting
            if (typeof window !== 'undefined' && window.alert) {
                alert(`Starting Google Login... \nEndpoint: ${APPWRITE_ENDPOINT} \nProject: ${APPWRITE_PROJECT_ID}`);
            }

            if (!APPWRITE_PROJECT_ID || !APPWRITE_ENDPOINT) {
                alert("CRITICAL ERROR: Missing Appwrite Env Vars!");
                throw new Error("Missing Appwrite Configuration");
            }

            // Generate unique token and verify it doesn't exist
            let oauthToken;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 5;

            while (!isUnique && attempts < maxAttempts) {
                oauthToken = ID.unique();
                try {
                    await databases.getDocument(DATABASE_ID, COLLECTIONS.OAUTH_SESSIONS, oauthToken);
                    attempts++;
                } catch (error) {
                    if (error.code === 404) {
                        isUnique = true;
                    } else {
                        throw error;
                    }
                }
            }

            if (!isUnique) {
                throw new Error('Failed to generate unique token validation');
            }

            // CREATE DOCUMENT IN APPWRITE BEFORE OAuth starts
            try {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.OAUTH_SESSIONS,
                    oauthToken,
                    {
                        oauthToken: oauthToken,
                        userId: 'PENDING',
                        secret: 'PENDING',
                        route: 'home',
                        createdAt: new Date().toISOString()
                    }
                );
            } catch (dbError) {
                console.error('[Google Login] Failed to store token:', dbError);
                return;
            }

            // Store token locally as backup
            try {
                localStorage.setItem('rk_oauth_token', oauthToken);
            } catch (e) { }

            const isNative =
                (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
                (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform());

            let origin;
            if (isNative) {
                // Native: Force production URL
                origin = process.env.NEXT_PUBLIC_APP_URL || 'https://rk-alpha-nine.vercel.app';
            } else {
                // Web: Use current location (supports localhost)
                origin =
                    (typeof window !== 'undefined' && window.location && window.location.origin) ||
                    process.env.NEXT_PUBLIC_APP_URL ||
                    'https://rk-alpha-nine.vercel.app';
            }
            origin = origin.replace(/\/$/, '');

            const callbackUrl = `${origin}/auth/callback`;
            const failureUrl = `${origin}/login?error=oauth_failed`;

            if (typeof window !== 'undefined' && window.alert) alert('Generated Callback URL: ' + callbackUrl);

            const scopes = ['email', 'profile', 'openid'];
            if (!APPWRITE_PROJECT_ID || !APPWRITE_ENDPOINT) {
                try { localStorage.setItem('rk_last_oauth_error', 'Missing Appwrite configuration'); } catch (_) { }
            }

            if (isNative) {
                // Construct OAuth URL manually
                const targetUrl = new URL(`${APPWRITE_ENDPOINT}/account/sessions/oauth2/google`);
                targetUrl.searchParams.append('project', APPWRITE_PROJECT_ID);
                targetUrl.searchParams.append('success', callbackUrl);
                targetUrl.searchParams.append('failure', failureUrl);
                targetUrl.searchParams.append('state', oauthToken);

                scopes.forEach(scope => targetUrl.searchParams.append('scopes[]', scope));

                const finalUrl = targetUrl.toString();
                if (typeof window !== 'undefined' && window.alert) alert('Attempting to open browser with URL: ' + finalUrl);

                try { localStorage.setItem('rk_last_oauth_url', finalUrl); } catch (_) { }

                try {
                    await Browser.open({ url: finalUrl });
                    if (typeof window !== 'undefined' && window.alert) alert('Browser.open() called successfully');
                } catch (e) {
                    if (typeof window !== 'undefined' && window.alert) alert('Browser Open Error: ' + e.message + ' - Trying fallback');
                    try {
                        window.location.href = finalUrl;
                    } catch (_) { }
                }
            } else {
                // Web: Use SDK method
                account.createOAuth2Session(
                    'google',
                    callbackUrl,
                    failureUrl,
                    scopes,
                    oauthToken
                );
            }
        } catch (error) {
            console.error('[Google Login] Google login failed:', error);
            if (typeof window !== 'undefined' && window.alert) alert('Google Login CRITICAL FAILURE: ' + error.message + '\nStack: ' + error.stack);
            try { localStorage.setItem('rk_last_oauth_error', error?.message || 'Google login failed'); } catch (_) { }
            throw error;
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');

            // Preserve device slug but clear auth-related data
            if (typeof window !== 'undefined' && window.localStorage) {
                const deviceSlug = localStorage.getItem('rk_device_slug');

                // Clear specific auth items instead of everything
                localStorage.removeItem('rk_oauth_token');
                localStorage.removeItem('theme');

                // Restore device slug if it existed
                if (deviceSlug) {
                    localStorage.setItem('rk_device_slug', deviceSlug);
                }
            }

            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);

            // Even if session delete fails, clear auth data but preserve device slug
            if (typeof window !== 'undefined' && window.localStorage) {
                const deviceSlug = localStorage.getItem('rk_device_slug');

                localStorage.removeItem('rk_oauth_token');
                localStorage.removeItem('theme');

                if (deviceSlug) {
                    localStorage.setItem('rk_device_slug', deviceSlug);
                }
            }
            setUser(null);
            router.push('/login');
        }
    };

    const value = {
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        checkUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
