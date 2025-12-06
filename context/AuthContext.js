'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, ID, client } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { signInWithGoogleNative } from '@/lib/nativeGoogle';

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
                const slug = event.url.split('.app').pop();
                
                // Check if this is an auth callback
                if (slug && slug.includes('/auth/callback')) {
                    console.log('[Deep Link] OAuth callback detected:', event.url);
                    // Wait a moment for the session to be established
                    setTimeout(() => {
                        console.log('[Deep Link] Checking user session...');
                        checkUser();
                    }, 500);
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
            return { success: false, error: error.message };
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
            return { success: false, error: error.message };
        }
    };

    const loginWithGoogle = async () => {
        try {
            const origin = window.location.origin;
            
            // Redirect to our callback page which will:
            // 1. Establish the session
            // 2. Redirect to /home
            // 3. (On Android) Deep link will bring app to foreground
            const callbackUrl = `${origin}/auth/callback`;
            const failureUrl = `${origin}/login?error=oauth_failed`;

            // Detect native (Capacitor) environment
            const isNative = () => {
                try {
                    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
                } catch (e) {
                    return false;
                }
            };

            if (isNative()) {
                // Attempt native Google Sign-In first (in-app experience)
                try {
                    const res = await signInWithGoogleNative();
                    // res expected to contain idToken and accessToken
                    const idToken = res.idToken || res.id_token || res.serverAuthCode;
                    const accessToken = res.accessToken || res.access_token;

                    // Send tokens to server for verification/linking
                    const exchangeRes = await fetch('/api/auth/google/native-exchange', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken, accessToken })
                    });

                    const data = await exchangeRes.json();
                    if (data && data.success) {
                        // If server returned a short-lived Appwrite JWT, set it so client is authenticated
                        if (data.userJwt) {
                            try {
                                client.setJWT(data.userJwt);
                            } catch (e) {
                                console.warn('Failed to set Appwrite JWT on client:', e.message || e);
                            }
                        }

                        // After verifying, attempt to refresh client-side session state
                        setTimeout(() => checkUser(), 500);
                        return;
                    } else {
                        console.warn('Native exchange failed, falling back to browser OAuth', data);
                        const oauthStart = `${origin}/login?start_oauth=google`;
                        await Browser.open({ url: oauthStart });
                        return;
                    }
                } catch (nativeErr) {
                    console.warn('Native Google sign-in failed, falling back to browser OAuth', nativeErr.message || nativeErr);
                    const oauthStart = `${origin}/login?start_oauth=google`;
                    try { await Browser.open({ url: oauthStart }); } catch(e) { console.error(e); }
                    return;
                }
            }

            // Web: start OAuth directly from this page
            account.createOAuth2Session(
                'google',
                callbackUrl,  // Our callback page handles the redirect
                failureUrl,
                ['https://www.googleapis.com/auth/drive.file']
            );
        } catch (error) {
            console.error('Google login failed:', error);
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
