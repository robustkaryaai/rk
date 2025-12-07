'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, ID, client, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { App } from '@capacitor/app';

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
                alert('✅ appUrlOpen fired');
                console.log('FULL URL:', event.url);
                try { localStorage.setItem('rk_last_oauth_url', event.url || ''); } catch (_) { }

                if (!event.url) {
                    alert('❌ No URL received');
                    return;
                }

                const incomingUrl = new URL(event.url);
                const isCustomScheme = incomingUrl.protocol === 'rkai:' && incomingUrl.host === 'callback';
                const isHttpsCallback = (incomingUrl.protocol === 'https:' || incomingUrl.protocol === 'http:') && incomingUrl.pathname.startsWith('/auth/callback');

                if (!isCustomScheme && !isHttpsCallback) {
                    alert('⚠️ Not OAuth callback\n' + event.url);
                    return;
                }

                alert('🔗 OAuth Deep Link Detected');

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
                        alert('❌ No OAuth token found');
                        router.push('/login?error=no_oauth_token');
                        return;
                    }

                    alert('🎫 OAuth Token: ' + oauthToken.substring(0, 8) + '...');

                    // Call server endpoint to get session credentials
                    try {
                        alert('📞 Calling server to create session...');
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
                        alert('✅ Got session data from server!');
                        console.log('[Deep Link] Session data received:', sessionData);

                        const { userId, secret, route } = sessionData;

                        if (!userId || !secret) {
                            alert('❌ Invalid session data from server');
                            router.push('/login?error=invalid_session_data');
                            return;
                        }

                        // Check if session already exists
                        let sessionExists = false;
                        try {
                            const existingSession = await account.get();
                            if (existingSession && existingSession.$id === userId) {
                                sessionExists = true;
                                alert('✅ Session already exists!');
                            }
                        } catch (e) {
                            console.log('[Deep Link] No existing session, will create one');
                        }

                        // Create session if it doesn't exist
                        if (!sessionExists) {
                            alert('🔐 Creating session with secret...');
                            try {
                                await account.createSession(userId, secret);
                                alert('✅ Session created!');
                            } catch (createError) {
                                console.error('[Deep Link] Create session failed:', createError);
                                alert('❌ Failed to create session: ' + createError.message);
                                router.push('/login?error=session_creation_failed');
                                return;
                            }
                        }

                        await checkUser();
                        alert('✅ User verified!');

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
                        alert('➡️ Navigated!');

                    } catch (fetchError) {
                        console.error('[Deep Link] Server request failed:', fetchError);
                        alert('❌ Server request failed:\n' + fetchError.message);
                        router.push('/login?error=server_request_failed');
                        return;
                    }

                } catch (err) {
                    console.error('DEEP LINK ERROR:', err);
                    alert('💥 Deep link crash:\n' + err.message);
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
            await checkUser(); // This triggers sync
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
                alert('✅ Token stored in DB: ' + oauthToken.substring(0, 8));
            } catch (dbError) {
                console.error('[Google Login] Failed to store token:', dbError);
                alert('❌ Failed to store token: ' + dbError.message);
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

            // Use createOAuth2Session with token as state parameter
            // This allows the callback to know which token to use for storing params
            account.createOAuth2Session(
                'google',
                callbackUrl,
                failureUrl,
                ['https://www.googleapis.com/auth/drive.file'],
                oauthToken // Pass token as state parameter
            );
        } catch (error) {
            console.error('[Google Login] Google login failed:', error);
            alert('Failed to start Google sign-in: ' + (error.message || 'Please try again.'));
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
