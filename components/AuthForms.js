'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { AiOutlineGoogle, AiOutlineLoading3Quarters } from 'react-icons/ai';

export function SignInForm() {
    const { login, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
        // If success, router.push handled in context
    };

    const handleGoogle = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(err.message || 'Google sign-in failed');
            setGoogleLoading(false);
        }
    };

    return (
        <div className="w-full">
            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || googleLoading}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || googleLoading}
                    />
                </div>

                <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                    disabled={loading || googleLoading}
                >
                    {loading ? <AiOutlineLoading3Quarters className="animate-spin" /> : 'Sign In'}
                </button>
            </form>

            <div className="divider">
                <span>OR</span>
            </div>

            <button
                type="button"
                onClick={handleGoogle}
                className={`btn btn-outline ${googleLoading ? 'btn-disabled' : ''}`}
                disabled={loading || googleLoading}
            >
                {googleLoading ? (
                    <AiOutlineLoading3Quarters className="animate-spin icon-lg" />
                ) : (
                    <>
                        <AiOutlineGoogle className="icon-lg" />
                        <span>Continue with Google</span>
                    </>
                )}
            </button>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    New here?{' '}
                </span>
                <Link href="/signup" className="link-text">
                    Create account
                </Link>
            </div>
        </div>
    );
}

export function SignUpForm() {
    const { signup, loginWithGoogle } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signup(email, password, name);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(err.message || 'Google sign-in failed');
            setGoogleLoading(false);
        }
    };

    return (
        <div className="w-full">
            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading || googleLoading}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || googleLoading}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        required
                        minLength={8}
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || googleLoading}
                    />
                </div>

                <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                    disabled={loading || googleLoading}
                >
                    {loading ? <AiOutlineLoading3Quarters className="animate-spin" /> : 'Create Account'}
                </button>
            </form>

            <div className="divider">
                <span>OR</span>
            </div>

            <button
                type="button"
                onClick={handleGoogle}
                className={`btn btn-outline ${googleLoading ? 'btn-disabled' : ''}`}
                disabled={loading || googleLoading}
            >
                {googleLoading ? (
                    <AiOutlineLoading3Quarters className="animate-spin icon-lg" />
                ) : (
                    <>
                        <AiOutlineGoogle className="icon-lg" />
                        <span>Continue with Google</span>
                    </>
                )}
            </button>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Already have an account?{' '}
                </span>
                <Link href="/login" className="link-text">
                    Sign in
                </Link>
            </div>
        </div>
    );
}
