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
        <div className="page-container">
            <div className="brand-header">
                <h1 className="brand-title gradient-text-brand">
                    Join RK AI
                </h1>
                <p className="brand-subtitle">
                    Create your workspace
                </p>
            </div>

            <div className="glass-card">
                <SignUpForm />
            </div>
        </div>
    );
}
