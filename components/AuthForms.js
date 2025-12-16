'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AiOutlineGoogle, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineArrowRight } from 'react-icons/ai';

export default function AuthForms({ initialLoginState = true }) {
    const { login, signup, loginWithGoogle } = useAuth();
    const [isLogin, setIsLogin] = useState(initialLoginState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleGoogle = async () => {
        // Clear previous errors
        setError('');
        // We do NOT set loading states that disable the button to prevent "frozen" UI
        // The browser/Appwrite SDK handles the redirect or popup
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(err.message || 'Google sign-in failed. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await login(email, password);
            } else {
                result = await signup(email, password, name);
            }

            if (!result.success) {
                setError(result.error);
                setLoading(false);
            }
            // If success,AuthContext handles redirect
        } catch (err) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    };

    // Toggle Mode
    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setEmail('');
        setPassword('');
        setName('');
    };

    return (
        <div className="auth-card">
            {/* Google Button - Primary Action */}
            <button
                type="button"
                onClick={handleGoogle}
                className="btn btn-outline"
                style={{ marginBottom: '16px', justifyContent: 'center' }}
            >
                <AiOutlineGoogle size={22} />
                <span>Continue with Google</span>
            </button>

            <div className="divider">
                <span>OR</span>
            </div>

            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={!isLogin}
                        />
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex'
                            }}
                        >
                            {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                        </button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                    disabled={loading}
                    style={{ marginTop: '16px' }}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                            <AiOutlineArrowRight />
                        </>
                    )}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={toggleMode}
                        className="link-text"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
}
