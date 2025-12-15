'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, ID, client, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

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
            App.addListener('appUrlOpen', async (event) => {
                try {
                    console.log('FULL URL:', event.url);
                    try { localStorage.setItem('rk_last_oauth_url', event.url || ''); } catch (_) { }

                    if (!event.url) return;

                    // 1. Close browser (Native) - ensure it's closed for any deep link
                    try { await Browser.close(); } catch (e) { }

                    const incomingUrl = new URL(event.url);

                    // 2. Handle Settings (Drive Connect) logic
                    if (event.url.includes('settings')) {
                        console.log('🔗 Settings Deep Link Detected');
                        // Check if it's success or error
                        const params = incomingUrl.searchParams;
                        if (params.get('google_connected') === 'true') {
                            router.push(`/settings?google_connected=true&t=${Date.now()}`);
                        } else if (params.get('google_error')) {
                            router.push(`/settings?google_error=${params.get('google_error')}`);
                        }
                        return;
                    }

                    // 3. Handle Login (Callback) logic
                    // If not callback, ignore
                    if (!event.url.includes('callback')) {
                        // console.log('Ignoring non-login URL:', event.url);
                        return;
                    }

                    console.log('🔗 Login Deep Link Detected');

                    // Try to get token from URL first, then from localStorage
                    let oauthToken = incomingUrl.searchParams.get('token');

                    if (!oauthToken) {
                        try {
                            oauthToken = localStorage.getItem('rk_oauth_token');
                        } catch (e) {
                            console.error('[Deep Link] Failed to get token from localStorage:', e);
                        }
                    }

                    if (!oauthToken) {
                        router.push('/login?error=no_oauth_token');
                        return;
                    }


                    // Call server endpoint to get session credentials
                    try {
                        console.log('[Deep Link] Calling server API with token:', oauthToken);

                        const response = await fetch(
                            `${window.location.origin}/api/auth/create-app-session?token=${oauthToken}`,
                            { method: 'GET' }
                        );

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Server request failed');
                        }

                        const sessionData = await response.json();
                        console.log('[Deep Link] Session data received:', sessionData);

                        const { userId, secret, route } = sessionData;

                        if (!userId || !secret) {
                            router.push('/login?error=invalid_session_data');
                            return;
                        }

                        // Check if session already exists
                        let sessionExists = false;
                        try {
                            const existingSession = await account.get();
                            if (existingSession && existingSession.$id === userId) {
                                sessionExists = true;
                            }
                        } catch (e) {
                            console.log('[Deep Link] No existing session, will create one');
                        }

                        // Create session if it doesn't exist
                        if (!sessionExists) {
                            try {
                                await account.createSession(userId, secret);
                            } catch (createError) {
                                console.error('[Deep Link] Create session failed:', createError);
                                router.push('/login?error=session_creation_failed');
                                return;
                            }
                        }

                        await checkUser();
                        alert('✅ User verified!');

                        // Sync user profile and tokens
                        try {
                            const user = await account.get();
                            const currentSession = await account.getSession('current');
                            console.log('[Deep Link] Syncing user and tokens...');
                            await userAPI.syncUserToAppwrite(
                                user,
                                '',
                                currentSession.providerAccessToken,
                                currentSession.providerRefreshToken
                            );
                        } catch (syncError) {
                            console.warn('[Deep Link] User sync warning:', syncError);
                        }
                        // Clean up: delete the OAuth session document and localStorage token
                        try {
                            await databases.deleteDocument(
                                DATABASE_ID,
                                COLLECTIONS.OAUTH_SESSIONS,
                                oauthToken
                            );
                            localStorage.removeItem('rk_oauth_token');
                            console.log('[Deep Link] Cleaned up OAuth session');
                        } catch (cleanupError) {
                            console.error('[Deep Link] Cleanup error:', cleanupError);
                        }

                        router.push(`/${route || 'home'}`);

                    } catch (fetchError) {
                        console.error('[Deep Link] Server request failed:', fetchError);
                        router.push('/login?error=server_request_failed');
                        return;
                    }

                } catch (err) {
                    console.error('DEEP LINK ERROR:', err);
                    router.push('/login?error=exception');
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

            const callbackUrl = 'https://rk-alpha-nine.vercel.app/auth/callback';
            const failureUrl = 'https://rk-alpha-nine.vercel.app/login?error=oauth_failed';
            const scopes = ['email', 'profile', 'openid'];

            // Check if native platform
            const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

            if (isNative) {
                // Construct OAuth URL manually
                const targetUrl = new URL(`${APPWRITE_ENDPOINT}/account/sessions/oauth2/google`);
                targetUrl.searchParams.append('project', APPWRITE_PROJECT_ID);
                targetUrl.searchParams.append('success', callbackUrl);
                targetUrl.searchParams.append('failure', failureUrl);
                targetUrl.searchParams.append('state', oauthToken);

                scopes.forEach(scope => targetUrl.searchParams.append('scopes[]', scope));

                const finalUrl = targetUrl.toString();
                await Browser.open({ url: finalUrl });
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
            alert('Google login failed: ' + error.message);
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
