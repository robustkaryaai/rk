'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const session = await account.get();
            setUser(session);
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
            router.push('/home');
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: error.message };
        }
    };

    const signup = async (email, password, name) => {
        try {
            // 1. Create Account
            const newAccount = await account.create(ID.unique(), email, password, name);

            // 2. Create Session
            await account.createEmailPasswordSession(email, password);

            // 3. Sync to Users Collection (as per existing logic)
            // We mock the Clerk user object structure used in api.js `syncUserToAppwrite`
            const mockClerkUser = {
                id: newAccount.$id,
                fullName: name,
                primaryEmailAddress: { emailAddress: email },
                imageUrl: '' // No image initially
            };

            await userAPI.syncUserToAppwrite(mockClerkUser);

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
            // Redirects to Google OAuth
            // successUrl and failureUrl should be absolute or relative to domain
            // Using window.location.origin to be safe
            const origin = window.location.origin;
            account.createOAuth2Session(
                'google',
                `${origin}/home`,
                `${origin}/login?error=oauth_failed`
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
