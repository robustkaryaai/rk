'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';

export default function WhatsNewPage() {
    const router = useRouter();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <div className="page-container">
                {/* Hero Section */}
                <div className="hero-section">
                    <h1 className="hero-title">🚀 What’s New in RK v2.0</h1>
                    <p className="hero-subtitle">
                        A massive upgrade in performance, design & independence.
                    </p>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>
                        By RK Innovators • Released: 2025
                    </p>
                </div>

                <GlassCard style={{ marginBottom: '24px', padding: '32px' }}>

                    {/* 1. Custom Authentication */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            🔐 Custom Authentication System (No More Clerk)
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            RK is now fully independent from third-party auth providers like Clerk.
                            Version 2.0 introduces a <b>fully self-hosted authentication system</b> with:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginTop: '12px' }}>
                            <li>Secure Email & Password Sign In / Sign Up</li>
                            <li>Native Google Sign-In (Direct Integration)</li>
                            <li>Faster login response & better session control</li>
                            <li>Full control over user data & security layers</li>
                        </ul>
                        <p style={{ marginTop: '12px', opacity: 0.85 }}>
                            This means <b>faster auth, zero vendor lock-in, and maximum privacy.</b>
                        </p>
                    </section>

                    {/* 2. Brand New Futuristic UI */}
                    {/* 2. New Premium Ambient UI */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#a855f7' }}>
                            ✨ New Premium Animated Background
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            RK v2.0 introduces a completely redesigned ambient UI environment built for focus and elegance:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginTop: '12px' }}>
                            <li>Soft radial light glow instead of harsh gradients</li>
                            <li>Dynamic hue-shifting blur animation</li>
                            <li>Subtle cinematic grid mesh for depth</li>
                            <li>Zero visual noise, maximum readability</li>
                        </ul>
                        <p style={{ marginTop: '12px', opacity: 0.85 }}>
                            The interface now feels <b>calm, premium, cinematic, and truly AI-grade.</b>
                        </p>
                    </section>


                    {/* 3. Performance Boost */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#22c55e' }}>
                            ⚡ Performance & Stability Improvements
                        </h2>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                            <li>Faster app startup and navigation</li>
                            <li>Optimized background animations</li>
                            <li>Reduced authentication delays</li>
                            <li>Improved session handling & token security</li>
                        </ul>
                    </section>

                    {/* 4. Security Enhancements */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#ef4444' }}>
                            🛡️ Security Upgrades
                        </h2>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                            <li>Encrypted user sessions</li>
                            <li>Better password hashing & validation</li>
                            <li>Protected OAuth login with Google</li>
                            <li>Stronger API request verification</li>
                        </ul>
                    </section>

                    {/* 5. Developer Freedom */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#06b6d4' }}>
                            🧠 Built for Scale & Developer Control
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            With RK v2.0, the platform is now completely controlled by RK Innovators:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginTop: '12px' }}>
                            <li>Zero dependency on external auth vendors</li>
                            <li>Full backend flexibility</li>
                            <li>Future-ready for enterprise scaling</li>
                        </ul>
                    </section>

                    {/* Closing */}
                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            🌌 RK v2.0 = Independence + Power
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            RK 2.0 isn’t just an update — it’s a <b>foundation shift</b>.
                            More control. More speed. More security. More future.
                        </p>
                    </section>
                </GlassCard>

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="btn-ghost"
                    style={{ width: '100%', marginBottom: '80px' }}
                >
                    ← Back
                </button>
            </div>

            <BottomNav />
        </>
    );
}
