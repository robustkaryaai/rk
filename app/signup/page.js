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
        <div className="simple-login-wrapper">
            <div className="simple-brand-header">
                <h1 className="simple-brand-title">
                    Join RK AI
                </h1>
                <p className="simple-brand-subtitle">
                    Create your account to get started
                </p>
            </div>

            <div className="simple-card">
                <SignUpForm />
            </div>
        </div>
    );
}
