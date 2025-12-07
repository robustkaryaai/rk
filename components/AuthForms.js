'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AiOutlineGoogle, AiOutlineMail, AiOutlineLock, AiOutlineUser, AiOutlineUpload } from 'react-icons/ai';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export function SignInForm() {
    const { login, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastUrl, setLastUrl] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem('rk_last_oauth_url') || '') : ''
    );
    const [oauthError, setOauthError] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem('rk_last_oauth_error') || '') : ''
    );

    useEffect(() => {
        const onFocus = () => {
            try {
                const u = localStorage.getItem('rk_last_oauth_url') || '';
                const e = localStorage.getItem('rk_last_oauth_error') || '';
                setLastUrl(u);
                setOauthError(e);
            } catch (_) {}
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit}>
                <div className="auth-form-group">
                    <label className="auth-label">Email Address</label>
                    <div className="input-wrapper">
                        <div className="input-icon-left">
                            <AiOutlineMail />
                        </div>
                        <input
                            type="email"
                            required
                            className="auth-input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="auth-form-group">
                    <label className="auth-label">Password</label>
                    <div className="input-wrapper">
                        <div className="input-icon-left">
                            <AiOutlineLock />
                        </div>
                        <input
                            type="password"
                            required
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="error-box">
                        <div className="error-dot"></div>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary-gradient"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="divider-wrapper">
                <div className="divider-line"></div>
                <span className="divider-text">Or continue with</span>
                <div className="divider-line"></div>
            </div>

            <button
                onClick={loginWithGoogle}
                type="button"
                className="btn-google-outline"
            >
                <AiOutlineGoogle className="text-xl" />
                <span>Sign in with Google</span>
            </button>

            {(oauthError || lastUrl) && (
                <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>
                    {oauthError && (
                        <div style={{ marginBottom: '6px' }}>Last error: {oauthError}</div>
                    )}
                    {lastUrl && (
                        <div style={{ wordBreak: 'break-all' }}>
                            {lastUrl}
                        </div>
                    )}
                </div>
            )}

            <div className="link-switch-wrapper">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="link-highlight">
                    Sign up
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
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let avatarUrl = '';

        if (avatarFile) {
            try {
                // Upload to Supabase
                const fileName = `avatars/${Date.now()}_${avatarFile.name}`;
                const { data, error: uploadError } = await supabase
                    .storage
                    .from('rk-ai-storage-base') // Using existing bucket
                    .upload(fileName, avatarFile);

                if (uploadError) {
                    console.error('Avatar upload failed:', uploadError);
                    // Continue without avatar if fails, but log it
                } else {
                    const { data: publicUrlData } = supabase
                        .storage
                        .from('rk-ai-storage-base')
                        .getPublicUrl(fileName);
                    avatarUrl = publicUrlData.publicUrl;
                }

            } catch (err) {
                console.error('Avatar upload exception:', err);
            }
        }

        const result = await signup(email, password, name, avatarUrl);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit}>
                {/* Avatar Upload */}
                <div className="avatar-section">
                    <div
                        className="avatar-upload-circle"
                        onClick={() => fileInputRef.current.click()}
                    >
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="avatar-preview-img" />
                        ) : (
                            <div className="avatar-placeholder">
                                <AiOutlineUpload className="avatar-icon" />
                                <span className="avatar-label-text">Add Photo</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="auth-form-group">
                    <label className="auth-label">Full Name</label>
                    <div className="input-wrapper">
                        <div className="input-icon-left">
                            <AiOutlineUser />
                        </div>
                        <input
                            type="text"
                            required
                            className="auth-input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="auth-form-group">
                    <label className="auth-label">Email Address</label>
                    <div className="input-wrapper">
                        <div className="input-icon-left">
                            <AiOutlineMail />
                        </div>
                        <input
                            type="email"
                            required
                            className="auth-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="auth-form-group">
                    <label className="auth-label">Password</label>
                    <div className="input-wrapper">
                        <div className="input-icon-left">
                            <AiOutlineLock />
                        </div>
                        <input
                            type="password"
                            required
                            minLength={8}
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="error-box">
                        <div className="error-dot"></div>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary-gradient"
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>

            <div className="divider-wrapper">
                <div className="divider-line"></div>
                <span className="divider-text">Or continue with</span>
                <div className="divider-line"></div>
            </div>

            <button
                onClick={loginWithGoogle}
                type="button"
                className="btn-google-outline"
            >
                <AiOutlineGoogle className="text-xl" />
                <span>Sign in with Google</span>
            </button>

            <div className="link-switch-wrapper">
                Already have an account?{' '}
                <Link href="/login" className="link-highlight">
                    Sign in
                </Link>
            </div>
        </div>
    );
}
