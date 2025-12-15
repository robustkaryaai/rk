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
        <div className="login-wrapper">
            <div className="brand-container">
                <div className="brand-logo">RK</div>
                <h1 className="brand-title">
                    Join the only app made for the only RK AI
                </h1>
                <p className="brand-subtitle">
                    Create your account to get started with RK AI
                </p>
            </div>

            <div className="card-container-wrapper">
                <div className="glass-panel">
                    <SignUpForm />
                </div>

                <p className="copyright-text">
                    &copy; 2025 RK Innovators
                </p>
            </div>
        </div>
    );
}
