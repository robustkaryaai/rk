'use client';

import AuthForms from '@/components/AuthForms';
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
            <div className="page-container" style={{ justifyContent: 'center' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="auth-header">
                <h1 className="brand-title">RK</h1>
                <p className="brand-subtitle">Join the Future</p>
            </div>

            <AuthForms initialLoginState={false} />
        </div>
    );
}
