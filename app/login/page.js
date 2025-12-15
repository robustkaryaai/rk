'use client';

import { SignInForm } from '@/components/AuthForms';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);


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
        <h1 className="brand-title">Only app for the only RK AI</h1>
        <p className="brand-subtitle">
          View chat history and manage AI files in one premium workspace.
        </p>
      </div>

      <div className="card-container-wrapper">
        <div className="glass-panel">
          <SignInForm />
        </div>
        <p className="copyright-text">&copy; 2025 RK Innovators</p>
      </div>
    </div>
  );
}
