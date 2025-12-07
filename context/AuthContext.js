'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, ID, client } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { Browser } from '@capacitor/browser';
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
                console.log('[Deep Link] App opened with URL:', event.url);
                
                // Check if this is an auth callback (rkai://callback)
                if (event.url.startsWith('rkai://callback')) {
                    console.log('[Deep Link] OAuth callback detected:', event.url);
                    
                    try {
                        const url = new URL(event.url);
                        const userId = url.searchParams.get('userId');
                        const secret = url.searchParams.get('secret');
                        const route = url.searchParams.get('route') || 'home';
                        const navigateTo = url.searchParams.get('navigateTo'); // Callback URL to navigate to

                        if (navigateTo) {
                            // Navigate app's WebView to callback URL
                            // This allows Appwrite to process the OAuth callback and set cookies in app's WebView
                            console.log('[Deep Link] Navigating WebView to callback URL:', navigateTo);
                            
                            try {
                                const callbackUrl = new URL(navigateTo);
                                const callbackUserId = callbackUrl.searchParams.get('userId');
                                const callbackSecret = callbackUrl.searchParams.get('secret');
                                
                                if (callbackUserId && callbackSecret) {
                                    // We have OAuth params, try to create session directly first
                                    console.log('[Deep Link] Found OAuth params in callback URL, creating session...');
                                    try {
                                        await account.createSession(callbackUserId, callbackSecret);
                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                        const verifySession = await account.get();
                                        if (verifySession && verifySession.$id) {
                                            console.log('[Deep Link] Session created successfully from params');
                                            await checkUser();
                                            router.push(`/${route}`);
                                            return;
                                        }
                                    } catch (sessionErr) {
                                        console.warn('[Deep Link] Direct session creation failed, will navigate to callback URL:', sessionErr);
                                    }
                                }
                                
                                // Navigate to callback URL - Appwrite will process it and set cookies
                                window.location.href = navigateTo;
                                // The callback page will handle session and redirect
                                return;
                            } catch (e) {
                                console.error('[Deep Link] Error parsing callback URL:', e);
                                // Fallback: just navigate
                                window.location.href = navigateTo;
                                return;
                            }
                        }

                        if (userId && secret) {
                            // 1️⃣ Create session in-app using Appwrite SDK
                            console.log('[Deep Link] Creating session from userId/secret');
                            console.log('[Deep Link] userId length:', userId?.length, 'secret length:', secret?.length);
                            try {
                                const sessionResult = await account.createSession(userId, secret);
                                console.log('[Deep Link] createSession result:', sessionResult);
                                
                                // Wait a bit for session to be fully established
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                
                                // Verify session was created
                                const verifySession = await account.get();
                                console.log('[Deep Link] Verified session:', verifySession?.$id);
                                
                                if (verifySession && verifySession.$id) {
                                    await checkUser();
                                    console.log('[Deep Link] Session established, navigating to', route);
                                    router.push(`/${route}`);
                                    return;
                                } else {
                                    console.error('[Deep Link] Session creation failed - no session after createSession');
                                    router.push('/login?error=session_not_created');
                                    return;
                                }
                            } catch (err) {
                                console.error('[Deep Link] Session creation failed:', err);
                                console.error('[Deep Link] Error details:', {
                                    message: err.message,
                                    code: err.code,
                                    type: err.type,
                                    response: err.response
                                });
                                router.push('/login?error=session_creation_failed');
                                return;
                            }
                        } else {
                            // fallback - try to check existing session
                            console.log('[Deep Link] No session params (userId:', !!userId, 'secret:', !!secret, '), checking existing session...');
                            await checkUser();
                            const session = await account.get();
                            if (session && session.$id) {
                                console.log('[Deep Link] Existing session found, navigating to', route);
                                router.push(`/${route}`);
                            } else {
                                console.log('[Deep Link] No existing session, redirecting to login');
                                router.push('/login');
                            }
                            return;
                        }
                    } catch (err) {
                        console.error('[Deep Link] Error handling callback:', err);
                        router.push('/login');
                    }
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
                    const isNativePlatform = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
                    console.log('[Google Login] Is Native Platform:', isNativePlatform);
                    return isNativePlatform;
                } catch (e) {
                    console.log('[Google Login] Error checking native platform:', e);
                    return false;
                }
            };

            if (isNative()) {
                // For Android: Use browser OAuth directly (more reliable than native)
                console.log('[Google Login] Native platform detected, opening OAuth in browser');
                try {
                    const oauthUrl = account.getOAuth2Url(
                        'google',
                        callbackUrl,
                        failureUrl,
                        ['https://www.googleapis.com/auth/drive.file']
                    );
                    console.log('[Google Login] OAuth URL:', oauthUrl);
                    await Browser.open({ url: oauthUrl });
                    console.log('[Google Login] Browser opened successfully');
                } catch(e) {
                    console.error('[Google Login] Failed to open browser:', e);
                    // Fallback: Try direct OAuth session creation
                    try {
                        console.log('[Google Login] Trying fallback method...');
                        account.createOAuth2Session(
                            'google',
                            callbackUrl,
                            failureUrl,
                            ['https://www.googleapis.com/auth/drive.file']
                        );
                    } catch(fallbackError) {
                        console.error('[Google Login] All methods failed:', fallbackError);
                        alert('Failed to open Google sign-in. Please check your internet connection and try again.');
                    }
                }
                return;
            }

            // Web: start OAuth directly from this page (auto-redirect is fine for web)
            console.log('[Google Login] Web platform, using createOAuth2Session');
            account.createOAuth2Session(
                'google',
                callbackUrl,  // Our callback page handles the redirect
                failureUrl,
                ['https://www.googleapis.com/auth/drive.file']
            );
        } catch (error) {
            console.error('[Google Login] Google login failed:', error);
            alert('Failed to start Google sign-in. Please try again.');
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