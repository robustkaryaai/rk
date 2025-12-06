'use client';

import { SignInForm } from '@/components/AuthForms';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { account } from '@/lib/appwrite';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  // Auto-start Google OAuth
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const start = params.get('start_oauth');

    if (start === 'google') {
      const isMobileApp = /RKAIApp/.test(navigator.userAgent); // change to your app detection logic
      const origin = window.location.origin;
      const failureUrl = `${origin}/login?error=oauth_failed`;

      // Web fallback
      const callbackUrl = isMobileApp
        ? 'rkai://callback' // deep link for Android/iOS
        : `${origin}/auth/callback`; // normal web callback

      account.createOAuth2Session('google', callbackUrl, failureUrl)
        .catch(err => console.warn('OAuth failed:', err));
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
