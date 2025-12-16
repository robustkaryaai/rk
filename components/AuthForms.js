import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AiOutlineGoogle, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineArrowRight, AiOutlineCheckCircle } from 'react-icons/ai';
import LiquidBackground from './LiquidBackground';

export default function AuthForms({ initialLoginState = true }) {
    const { login, signup, loginWithGoogle } = useAuth();
    const [isLogin, setIsLogin] = useState(initialLoginState);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleGoogle = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
            // Note: On native, this might not resolve until return, or browser opens.
            // We keep it "Opening Google..." for feedback.
            // If success happens via deep link, the app reloads/redirects anyway.
        } catch (err) {
            setGoogleLoading(false);
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
            } else {
                setSuccess(true);
                // Redirect handled by context, but we show success state briefly
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setEmail('');
        setPassword('');
        setName('');
    };

    if (success) {
        return (
            <>
                <LiquidBackground />
                <div className="auth-card" style={{ textAlign: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    <div style={{ animation: 'bounce 1s infinite' }}>
                        <AiOutlineCheckCircle size={64} color="var(--success-color)" style={{ marginBottom: '16px' }} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Successfully logged in</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Redirecting...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <LiquidBackground />
            <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
                {/* Google Button - Primary Action */}
                <button
                    type="button"
                    onClick={handleGoogle}
                    className="btn btn-outline"
                    disabled={googleLoading}
                    style={{ marginBottom: '16px', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
                >
                    {googleLoading ? (
                        <span>Opening Google...</span>
                    ) : (
                        <>
                            <AiOutlineGoogle size={22} />
                            <span>Continue with Google</span>
                        </>
                    )}
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
        </>
    );
}
