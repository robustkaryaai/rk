'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import { AiOutlineUser, AiOutlineMail, AiOutlinePhone, AiOutlineMessage, AiOutlineBulb } from 'react-icons/ai';

export default function TiersOnlyContactPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        featureRequest: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkTierAccess = async () => {
            if (loading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            // Check user's subscription tier
            const slug = localStorage.getItem('rk_device_slug');
            if (!slug) {
                alert('Please connect a device first');
                router.push('/connect');
                return;
            }

            try {
                const { userAPI } = await import('@/lib/api');
                const subscription = await userAPI.getSubscription(slug);

                // Only allow Tier 3 (Pro) or Tier 4 (Studio)
                if (subscription.tier === 3 || subscription.tier === 4) {
                    setAuthorized(true);
                    // Pre-fill user info
                    setFormData(prev => ({
                        ...prev,
                        name: user.name || '',
                        email: user.email || ''
                    }));
                } else {
                    alert('⚠️ Feature requests are exclusive to Pro and Studio subscribers.\n\nUpgrade your plan to unlock this feature!');
                    router.push('/subscription');
                }
            } catch (error) {
                console.error('Error checking tier:', error);
                router.push('/subscription');
            } finally {
                setChecking(false);
            }
        };

        checkTierAccess();
    }, [user, loading, router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Import Appwrite
            const { databases, DATABASE_ID, COLLECTIONS, ID } = await import('@/lib/appwrite');

            // Create document in tiersonlycontact collection
            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.TIERSONLYCONTACT,
                ID.unique(),
                {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || 'Not provided',
                    featureRequest: formData.featureRequest,
                    message: formData.message,
                    createdAt: new Date().toISOString()
                }
            );

            alert('✅ Thank you! We appreciate your feedback and will review your feature request.');
            router.push('/subscription');
        } catch (error) {
            console.error('Feature request submission failed:', error);
            alert('❌ Failed to submit request. Please try again or contact support@robustkaryaai.com');
        } finally {
            setSubmitting(false);
        }
    };

    if (checking || !authorized) {
        return (
            <div className="login-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <div className="page-container">
                <div className="hero-section">
                    <h1 className="hero-title">Request a Feature</h1>
                    <p className="hero-subtitle">Tell us what you'd like to see in RK AI</p>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>
                        Exclusive for Pro & Studio subscribers
                    </p>
                </div>

                <GlassCard>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineUser /> Full Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="ai-command-input"
                                placeholder="John Doe"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineMail /> Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="ai-command-input"
                                placeholder="john@example.com"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlinePhone /> Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="ai-command-input"
                                placeholder="+91 98765 43210"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </div>

                        {/* Feature Request */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineBulb /> What feature would you like? *
                            </label>
                            <input
                                type="text"
                                name="featureRequest"
                                required
                                value={formData.featureRequest}
                                onChange={handleChange}
                                className="ai-command-input"
                                placeholder="e.g., Voice commands, Multi-language support, etc."
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </div>

                        {/* Message */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineMessage /> Tell us more about it
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="ai-command-input"
                                rows={5}
                                placeholder="Describe how this feature would help you and why it's important..."
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => router.push('/subscription')}
                                className="btn-ghost"
                                style={{ flex: 1 }}
                                disabled={submitting}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ flex: 2 }}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Feature Request'}
                            </button>
                        </div>
                    </form>
                </GlassCard>
            </div>
            <BottomNav />
        </>
    );
}
