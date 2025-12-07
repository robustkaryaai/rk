'use client';

import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import { AiOutlineCheckCircle, AiOutlineAndroid, AiOutlineCloud, AiOutlineBug, AiOutlineArrowLeft } from 'react-icons/ai';

export default function WhatsNewPage() {
    const router = useRouter();

    return (
        <>
            <div className="page-container">
                <div className="hero-section">
                    <h1 className="hero-title">🚀 RK v2.1.1 - Polish & Fixes!</h1>
                    <p className="hero-subtitle">CSS improvements + Dark mode toggle fixed</p>
                    <button
                        onClick={() => router.back()}
                        className="btn-ghost"
                        style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <AiOutlineArrowLeft /> Back
                    </button>
                </div>

                {/* Android Optimizations */}
                <GlassCard style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <AiOutlineAndroid size={32} color="#3DDC84" />
                        <h2 className="section-title" style={{ margin: 0 }}>Android Optimizations</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Google OAuth Fixed</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Fixed redirect_uri_mismatch and "Access blocked" errors on native Android.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Deep Link Handling</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Improved callback handling for native apps using rkai:// scheme.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Browser Auto-Close</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    OAuth browser automatically closes after successful authentication.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Session Stability</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Enhanced session handling for native platforms with proper token sync.
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Google Drive Updates */}
                <GlassCard style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <AiOutlineCloud size={32} color="#667eea" />
                        <h2 className="section-title" style={{ margin: 0 }}>Google Drive - Temporarily Disabled</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#667eea" />
                            <div>
                                <strong>Coming Soon</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Google Drive integration temporarily disabled for optimization. Only tier 3 and 4 users can contact us to enable it for them.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#667eea" />
                            <div>
                                <strong>Supabase Storage</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    All files continue to be stored securely in Supabase.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#667eea" />
                            <div>
                                <strong>Future Return</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Google Drive will return with better performance and reliability.
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Bug Fixes */}
                <GlassCard style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <AiOutlineBug size={32} color="#f5576c" />
                        <h2 className="section-title" style={{ margin: 0 }}>Bug Fixes & Improvements</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Account Switching Fixed</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Properly clears localStorage when switching Google accounts.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Device Ownership Validation</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Validates device belongs to current user on login/refresh.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Mobile Background Fixed</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Grid pattern now visible with proper gradient background on all devices.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Safe Area Padding</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Content no longer hides behind status bar on mobile devices.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Premium Features for Tier 3/4</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Pro and Studio subscribers can now request new features in Settings.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Theme Persistence</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Selected theme now persists across app refreshes.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Code Cleanup</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Removed debug alerts and console logs for cleaner production environment.
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Technical Improvements */}
                <GlassCard>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>🔧 Technical Improvements</h3>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', opacity: 0.9 }}>
                        <li>Hybrid OAuth architecture: Appwrite for login, Direct Google API for Drive</li>
                        <li>Enhanced deep link handling with automatic browser closure.</li>
                        <li>Device ownership validation on session check.</li>
                        <li>LocalStorage cleanup on logout for clean account switching.</li>
                        <li>Dynamic viewport height (dvh) support for better mobile display.</li>
                        <li>Improved gradient visibility with increased opacity.</li>
                        <li>Feature request system for premium subscribers.</li>
                    </ul>
                </GlassCard>

                {/* v2.1.1 Hotfix */}
                <GlassCard style={{ marginBottom: '24px', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                        }}>
                            🎨
                        </div>
                        <h2 className="section-title" style={{ margin: 0 }}>v2.1.1 - CSS & Theme Fixes</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Light/Dark Mode Backgrounds</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Fixed background appearing the same in both themes - now properly switches.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Dark Mode Toggle State</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Toggle now correctly reflects whether dark mode is active or not.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Well litten App</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Added another color blob for the top so no part of app is not well litten.
                                </p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Light Mode Improvements</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Softer gradients and reduced grid opacity for better light mode experience
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Device disconnection problem</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Fixed user device automatically getting removed from the app when reloading the app.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Contact & Support</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Added direct contact and bug report form in Settings for all users.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <AiOutlineCheckCircle size={20} color="#4CAF50" />
                            <div>
                                <strong>Contact & Support</strong>
                                <p style={{ fontSize: '14px', opacity: 0.7, margin: '4px 0 0 0' }}>
                                    Added direct contact and bug report form in Settings for all users.
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <BottomNav />

            <style jsx>{`
                .feature-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    transition: background 0.3s ease;
                }
                
                .feature-item:hover {
                    background: rgba(102, 126, 234, 0.05);
                }
                
                .feature-item strong {
                    display: block;
                    margin-bottom: 2px;
                }
            `}</style>
        </>
    );
}
