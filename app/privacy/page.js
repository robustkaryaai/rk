'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';

export default function PrivacyPage() {
    const router = useRouter();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <div className="page-container">
                <div className="hero-section">
                    <h1 className="hero-title">🔒 Privacy Policy</h1>
                    <p className="hero-subtitle">RK AI Application</p>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>
                        By RK Innovators • Last Updated: December 5, 2024
                    </p>
                    <p style={{ fontSize: '14px', marginTop: '16px', fontWeight: '500' }}>
                        Your privacy matters. This policy explains what data we collect, how we use it, and how we protect it.
                    </p>
                </div>

                <GlassCard style={{ marginBottom: '24px', padding: '32px' }}>
                    {/* 1. Information We Collect */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            1. Information We Collect
                        </h2>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#4caf50' }}>
                                ✅ a) Voice Data
                            </h3>
                            <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                                <li>Temporarily collected for speech recognition</li>
                                <li>Processed using AssemblyAI</li>
                                <li><strong>Deleted immediately after transcription</strong></li>
                            </ul>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#4caf50' }}>
                                ✅ b) Generated Content
                            </h3>
                            <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '8px' }}>
                                Text, images, videos, PPTs, and documents generated using:
                            </p>
                            <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                                <li>Gemini API</li>
                                <li>Imagen</li>
                                <li>Veo</li>
                                <li>Presenton AI</li>
                            </ul>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#4caf50' }}>
                                ✅ c) Storage Data
                            </h3>
                            <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                                <li>Stored securely via Supabase</li>
                                <li>Only stored if user chooses to save it</li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#4caf50' }}>
                                ✅ d) Optional Drive Connection
                            </h3>
                            <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '8px' }}>
                                If you connect your personal cloud drive:
                            </p>
                            <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                                <li>We only access files required for the chosen function</li>
                                <li>We do NOT permanently store your drive credentials</li>
                            </ul>
                        </div>
                    </section>

                    {/* 2. What We DO NOT Collect */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#ff6b6b' }}>
                            2. What We DO NOT Collect
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            We do <strong>NOT</strong> collect:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                            <li>❌ Phone contacts</li>
                            <li>❌ Personal messages</li>
                            <li>❌ Bank details</li>
                            <li>❌ Location tracking</li>
                            <li>❌ Camera access without permission</li>
                            <li>❌ Background recordings</li>
                        </ul>
                    </section>

                    {/* 3. How Your Data Is Used */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            3. How Your Data Is Used
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            Your data is used strictly to:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                            <li>Provide AI responses</li>
                            <li>Generate requested content</li>
                            <li>Improve app performance</li>
                            <li>Store user-created files (only if enabled)</li>
                        </ul>
                    </section>

                    {/* 4. Data Sharing */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            4. Data Sharing
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            RK Innovators:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
                            <li style={{ color: '#4caf50' }}>✅ Shares data only with required AI services (Gemini, AssemblyAI, etc.)</li>
                            <li style={{ color: '#ff6b6b' }}>❌ Does NOT sell your data</li>
                            <li style={{ color: '#ff6b6b' }}>❌ Does NOT share with advertisers</li>
                            <li style={{ color: '#ff6b6b' }}>❌ Does NOT run surveillance</li>
                        </ul>
                    </section>

                    {/* 5. Data Security */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            5. Data Security
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            We use:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
                            <li>Secure API connections</li>
                            <li>Cloud security via Supabase</li>
                            <li>Auto-deletion of voice files</li>
                            <li>Encrypted communications</li>
                        </ul>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, fontStyle: 'italic' }}>
                            However, no digital system is 100% hack-proof. You use RK at your own risk.
                        </p>
                    </section>

                    {/* 6. Children's Privacy */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            6. Children&apos;s Privacy
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            RK is not intended for children under 13 without parental consent.
                        </p>
                    </section>

                    {/* 7. Offline Mode Privacy */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            7. Offline Mode Privacy
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            Offline mode:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                            <li>Uses ONLY built-in pre-fed commands</li>
                            <li>Collects no personal data</li>
                            <li>Works fully without internet or servers</li>
                        </ul>
                    </section>

                    {/* 8. User Control */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            8. User Control
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            You can:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px' }}>
                            <li>Request data deletion</li>
                            <li>Disconnect cloud drive anytime</li>
                            <li>Clear local app data</li>
                            <li>Stop using RK anytime</li>
                        </ul>
                    </section>

                    {/* 9. Policy Updates */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            9. Policy Updates
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            This policy may change with new features. Continued use = acceptance of updates.
                        </p>
                    </section>

                    {/* 10. Contact */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            10. Contact
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '8px' }}>
                            For privacy concerns:
                        </p>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, fontWeight: '500' }}>
                            <strong>RK Innovators Team</strong><br />
                            Email: support@rkinnovators.com
                        </p>
                    </section>
                </GlassCard>

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="btn-ghost"
                    style={{ width: '100%', marginBottom: '80px' }}
                >
                    ← Back to Settings
                </button>
            </div>
            <BottomNav />
        </>
    );
}
