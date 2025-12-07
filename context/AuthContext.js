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
                console.log('FULL URL:', event.url);
                try { localStorage.setItem('rk_last_oauth_url', event.url || ''); } catch (_) { }

                if (!event.url) {
                    return;
                }

                const incomingUrl = new URL(event.url);
                const isCustomScheme = incomingUrl.protocol === 'rkai:' && incomingUrl.host === 'callback';
                const isHttpsCallback = (incomingUrl.protocol === 'https:' || incomingUrl.protocol === 'http:') && incomingUrl.pathname.startsWith('/auth/callback');

                if (!isCustomScheme && !isHttpsCallback) {
                    return;
                }

                // Check if it's the OAuth callback
                // Covers: rkai://callback OR https://.../auth/callback
                if (!event.url.includes('callback')) {
                    console.log('Ignoring non-callback URL:', event.url);
                    return;
                }

                // Close the browser if it was opened for OAuth (Android/iOS)
                try {
                    await Browser.close();
                } catch (e) {
                    // Ignore error if browser wasn't open
                }


                try {
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
            console.log('[Google Login] Button clicked, starting OAuth flow...');

            // Import database functions
            const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite');

            // Generate unique token and verify it doesn't exist
            let oauthToken;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 5;

            while (!isUnique && attempts < maxAttempts) {
                oauthToken = ID.unique();
                console.log('[Google Login] Generated token:', oauthToken);

                try {
                    // Try to get document with this token ID
                    await databases.getDocument(
                        DATABASE_ID,
                        COLLECTIONS.OAUTH_SESSIONS,
                        oauthToken
                    );
                    // If we get here, document exists - need to regenerate
                    console.log('[Google Login] Token already exists, regenerating...');
                    attempts++;
                } catch (error) {
                    // Document doesn't exist (404 error) - token is unique!
                    if (error.code === 404) {
                        isUnique = true;
                        console.log('[Google Login] Token is unique!');
                    } else {
                        throw error; // Some other error occurred
                    }
                }
            }

            if (!isUnique) {
                throw new Error('Failed to generate unique token after ' + maxAttempts + ' attempts');
            }

            console.log('[Google Login] Using unique token:', oauthToken);

            // CREATE DOCUMENT IN APPWRITE BEFORE OAuth starts
            // This way callback can find and update it
            try {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.OAUTH_SESSIONS,
                    oauthToken,
                    {
                        oauthToken: oauthToken,
                        userId: 'PENDING', // Placeholder - will be updated by callback
                        secret: 'PENDING', // Placeholder - will be updated by callback
                        route: 'home',
                        createdAt: new Date().toISOString()
                    }
                );
                console.log('[Google Login] Token stored in Appwrite BEFORE OAuth');
            } catch (dbError) {
                console.error('[Google Login] Failed to store token:', dbError);
                return;
            }

            // Store token locally as backup
            try {
                localStorage.setItem('rk_oauth_token', oauthToken);
            } catch (e) {
                console.error('[Google Login] Failed to save token to localStorage:', e);
            }

            const callbackUrl = 'https://rk-alpha-nine.vercel.app/auth/callback';
            const failureUrl = 'https://rk-alpha-nine.vercel.app/login?error=oauth_failed';

            console.log('[Google Login] Starting OAuth with token:', oauthToken);

            // Use createOAuth2Session logic but handle native browser opening manually
            // to prevent "disallowed_useragent" error in WebViews

            // Temporary: Use basic scopes to debug "Access blocked"
            // const scopes = ['https://www.googleapis.com/auth/drive.file'];
            const scopes = ['email', 'profile', 'openid'];

            // Check if native platform
            const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

            if (isNative) {
                // Construct OAuth URL manually
                const targetUrl = new URL(`${APPWRITE_ENDPOINT}/account/sessions/oauth2/google`);
                targetUrl.searchParams.append('project', APPWRITE_PROJECT_ID);
                targetUrl.searchParams.append('success', callbackUrl);
                targetUrl.searchParams.append('failure', failureUrl);
                targetUrl.searchParams.append('state', oauthToken); // Pass token as state parameter

                scopes.forEach(scope => targetUrl.searchParams.append('scopes[]', scope));

                const finalUrl = targetUrl.toString();
                console.log('[Google Login] Opening native browser:', finalUrl);

                // DEBUG: Show URL to check project ID and format
                alert(`Opening Google Login...\nProject: ${APPWRITE_PROJECT_ID}\nURL: ${finalUrl}`);

                await Browser.open({ url: finalUrl });
            } else {
                // Web: Use SDK method
                account.createOAuth2Session(
                    'google',
                    callbackUrl,
                    failureUrl,
                    scopes,
                    oauthToken // Pass token as state parameter
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
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
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
