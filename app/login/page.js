'use client';

import { SignInForm } from '@/components/AuthForms';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { account } from '@/lib/appwrite';

export default function LoginPage() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            redirect('/home');
        }
    }, [user, loading]);

    // If the page is opened with ?start_oauth=google (used by native flow), start Appwrite OAuth
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const start = params.get('start_oauth');
            if (start === 'google') {
                // success and failure URLs
                const origin = window.location.origin;
                const callbackUrl = `${origin}/auth/callback`;
                const failureUrl = `${origin}/login?error=oauth_failed`;

                // Initiate Appwrite OAuth from this browser context
                account.createOAuth2Session('google', callbackUrl, failureUrl, ['https://www.googleapis.com/auth/drive.file']);
            }
        } catch (e) {
            console.warn('OAuth auto-start not available:', e.message);
        }
    }, []);

    if (loading) {
        return (
            <div className="login-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="login-wrapper">
            <div className="brand-container">
                <div className="brand-logo">RK</div>
                <h1 className="brand-title">
                    Only app for the only RK AI
                </h1>
                <p className="brand-subtitle">
                    View chat history and manage AI files in one premium workspace.
                </p>
            </div>

            <div className="card-container-wrapper">
                <div className="glass-panel">
                    <SignInForm />
                </div>

                <p className="copyright-text">
                    &copy; 2025 RK AI Systems
                </p>
            </div>
        </div>
    );
}
