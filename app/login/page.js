'use client';

import { SignInForm } from '@/components/AuthForms';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            redirect('/home');
        }
    }, [user, loading]);

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
