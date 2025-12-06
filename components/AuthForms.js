'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AiOutlineGoogle, AiOutlineMail, AiOutlineLock, AiOutlineUser } from 'react-icons/ai';
import Link from 'next/link';

export function SignInForm() {
    const { login, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                <div className="form-group mb-4">
                    <label className="block text-sm font-medium mb-1 opacity-80">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <AiOutlineMail className="text-gray-400" />
                        </div>
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label className="block text-sm font-medium mb-1 opacity-80">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <AiOutlineLock className="text-gray-400" />
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-200">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-bold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="mx-4 text-xs uppercase opacity-50">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
                onClick={loginWithGoogle}
                type="button"
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
                <AiOutlineGoogle className="text-xl" />
                <span>Sign in with Google</span>
            </button>

            <div className="mt-6 text-center text-sm opacity-70">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-4">
                    <label className="block text-sm font-medium mb-1 opacity-80">Full Name</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <AiOutlineUser className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            required
                            className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group mb-4">
                    <label className="block text-sm font-medium mb-1 opacity-80">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <AiOutlineMail className="text-gray-400" />
                        </div>
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label className="block text-sm font-medium mb-1 opacity-80">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <AiOutlineLock className="text-gray-400" />
                        </div>
                        <input
                            type="password"
                            required
                            minLength={8}
                            className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-200">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-bold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>

            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="mx-4 text-xs uppercase opacity-50">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
                onClick={loginWithGoogle}
                type="button"
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
                <AiOutlineGoogle className="text-xl" />
                <span>Sign in with Google</span>
            </button>

            <div className="mt-6 text-center text-sm opacity-70">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                    Sign in
                </Link>
            </div>
        </div>
    );
}
