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
    <div className="simple-login-wrapper">
      <div className="simple-brand-header">
        <h1 className="simple-brand-title">RK AI</h1>
        <p className="simple-brand-subtitle">Login to your account</p>
      </div>

      <div className="simple-card">
        <SignInForm />
      </div>
    </div>
  );
}
