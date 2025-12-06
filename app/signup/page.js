'use client';

import { SignUpForm } from '@/components/AuthForms';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
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
        <div className="login-container">
            <div className="login-logo">RK AI</div>
            <h1 className="login-title">Join the Future of Learning</h1>
            <p className="hero-subtitle" style={{ marginBottom: '32px', maxWidth: '400px' }}>
                Create your account to get started with RK AI
            </p>

            <div className="login-card glass-card">
                <SignUpForm />
            </div>
        </div>
    );
}
