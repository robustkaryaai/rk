'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, ID, client, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '@/lib/appwrite';
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
                    let userId = incomingUrl.searchParams.get('userId');
                    let secret = incomingUrl.searchParams.get('secret');
                    const route = incomingUrl.searchParams.get('route') || 'home';

                    if ((!userId || !secret) && incomingUrl.searchParams.get('url')) {
                        const full = new URL(incomingUrl.searchParams.get('url'));
                        userId = full.searchParams.get('userId');
                        secret = full.searchParams.get('secret');
                        const inner = full.searchParams.get('url');
                        if ((!userId || !secret) && inner) {
                            const innerUrl = new URL(inner);
                            if (innerUrl.protocol === 'https:' || innerUrl.protocol === 'http:') {
                                window.location.href = innerUrl.href;
                                return;
                            }
                        }
                    }

                    alert(
                        '🧾 Params:\n' +
                        'userId: ' + (userId ? '✅ Present' : '❌ Missing') + '\n' +
                        'secret: ' + (secret ? '✅ Present' : '❌ Missing') + '\n' +
                        'route: ' + route
                    );

                    if (!userId || !secret) {
                        try {
                            const origin = window.location.origin;
                            const target = `${origin}/auth/callback?url=${encodeURIComponent(event.url)}&route=${route}`;
                            try { localStorage.setItem('rk_last_oauth_error', 'missing_params'); } catch (_) { }
                            window.location.href = target;
                            return;
                        } catch (_) {
                            try { localStorage.setItem('rk_last_oauth_error', 'missing_params'); } catch (_) { }
                            router.push('/login?error=missing_params');
                            return;
                        }
                    }

                    alert('🔐 Creating session...');

                    try {
                        await account.createSession(
                            userId,
                            secret
                        );

                        alert('✅ createSession success');

                        await checkUser();
                        alert('✅ checkUser done');

                        router.push(`/${route}`);
                        alert('➡️ Navigated to /' + route);

                    } catch (sessionErr) {
                        console.error('SESSION ERROR:', sessionErr);
                        alert(
                            '❌ createSession failed:\n' +
                            (sessionErr.message || JSON.stringify(sessionErr))
                        );
                        try { localStorage.setItem('rk_last_oauth_error', 'session_failed'); } catch (_) { }
                        router.push('/login?error=session_failed');
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

            const callbackUrl = 'https://rk-alpha-nine.vercel.app/auth/callback';
            const failureUrl = 'https://rk-alpha-nine.vercel.app/login?error=oauth_failed';

            console.log('[Google Login] Starting OAuth with callbacks:', { callbackUrl, failureUrl });

            // Use createOAuth2Session for all platforms
            // Appwrite SDK will handle opening in browser/WebView appropriately
            account.createOAuth2Session(
                'google',
                callbackUrl,
                failureUrl,
                ['https://www.googleapis.com/auth/drive.file']
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
