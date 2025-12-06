'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import { AiOutlineCheck, AiOutlineStar, AiOutlineRocket } from 'react-icons/ai';
import { userAPI } from '@/lib/api';

export default function SubscriptionPage() {
    const { user, loading } = useAuth();
    // Adapter
    const isLoaded = !loading;
    const isSignedIn = !!user;

    const router = useRouter();
    const [currentTier, setCurrentTier] = useState(0);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/login');
            return;
        }

        // Require device connection
        const slug = localStorage.getItem('rk_device_slug');
        if (isLoaded && isSignedIn && !slug) {
            router.push('/connect');
            return;
        }

        // Fetch current subscription tier
        const fetchCurrentPlan = async () => {
            const slug = localStorage.getItem('rk_device_slug');
            if (slug) {
                const subData = await userAPI.getSubscription(slug);
                setCurrentTier(subData.tier || 0);
            }
        };

        if (isLoaded && isSignedIn) {
            fetchCurrentPlan();
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded || !isSignedIn) {
        return <div className="spinner"></div>;
    }

    const plans = [
        {
            name: '🆓 Free',
            tier: 0,
            price: '₹0',
            period: '/month',
            storage: '500 MB',
            videos: 'No videos',
            description: 'Personal exploration',
            features: [
                '500 MB storage',
                'Basic AI features',
                'No video generation',
                'Perfect for testing'
            ],
            current: true,
            recommended: false,
            color: '#9333ea'  // Purple color like others
        },
        {
            name: '🟢 Student',
            tier: 1,
            price: '₹149',
            period: '/month',
            storage: '5 GB',
            videos: 'No videos',
            description: 'Students & Assignments',
            features: [
                '5 GB storage',
                'Unlimited text documents',
                'PPT & DOCX support',
                'Priority support'
            ],
            current: false,
            recommended: true,
            color: '#4caf50'
        },
        {
            name: '🔵 Creator',
            tier: 2,
            price: '₹299',
            period: '/month',
            storage: '20 GB',
            videos: '2 videos/month',
            description: 'Content Creators',
            features: [
                '20 GB storage',
                '2 AI videos per month',
                'Thumbnail generation',
                'All document types',
                'Advanced AI features'
            ],
            current: false,
            recommended: false,
            color: '#2196f3'
        },
        {
            name: '🟣 Pro',
            tier: 3,
            price: '₹599',
            period: '/month',
            storage: '50 GB',
            videos: '10 videos/month',
            description: 'Power Users & Pros',
            features: [
                '50 GB storage',
                '10 AI videos per month',
                'Unlimited documents',
                'Priority AI processing',
                'API access'
            ],
            current: false,
            recommended: false,
            color: '#9c27b0'
        },
        {
            name: '🔴 Studio',
            tier: 4,
            price: '₹999',
            period: '/month',
            storage: '120 GB',
            videos: '30 videos/month',
            description: 'Studios & Schools',
            features: [
                '120 GB storage',
                '30 AI videos per month',
                'Unlimited everything',
                'Team collaboration',
                'White-label options',
                'Dedicated support'
            ],
            current: false,
            recommended: false,
            color: '#f44336'
        }
    ];

    const handleSubscribe = async (plan) => {
        if (plan.tier === currentTier) return;

        try {
            const slug = localStorage.getItem('rk_device_slug');
            if (!slug) {
                alert('Device not connected. Please connect a device first.');
                return;
            }

            const response = await fetch('/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug: slug,
                    amount: parseFloat(plan.price.replace('₹', '')),
                    tier: plan.tier
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Payment initiation failed');
            }

            const data = await response.json();

            // Create form and submit to Paytm
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `${process.env.NEXT_PUBLIC_PAYTM_HOST}/theia/api/v1/showPaymentPage?mid=${data.mid}&orderId=${data.orderId}`;

            const fields = {
                mid: data.mid,
                orderId: data.orderId,
                txnToken: data.txnToken
            };

            for (const key in fields) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = fields[key];
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();

        } catch (error) {
            console.error('Payment error:', error);
            alert(`Payment failed: ${error.message}`);
        }
    };

    return (
        <>
            <div className="page-container">
                <div className="hero-section">
                    <h1 className="hero-title">Upgrade Your Experience</h1>
                    <p className="hero-subtitle">Choose the perfect plan for your needs</p>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>
                        Secure payments via Paytm (Supports BHIM UPI, GPay, PhonePe, Cards)
                    </p>
                </div>

                <div className="plans-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {plans
                        .sort((a, b) => {
                            // Current plan always first
                            if (a.tier === currentTier) return -1;
                            if (b.tier === currentTier) return 1;
                            return 0;
                        })
                        .map((plan) => (
                            <GlassCard
                                key={plan.name}
                                style={{
                                    border: plan.recommended && currentTier === 0 ? '2px solid #667eea' : '1px solid var(--glass-border-light)',
                                    position: 'relative'
                                }}
                            >
                                {/* Show CURRENT PLAN badge or RECOMMENDED (only if Free tier) */}
                                {(plan.tier === currentTier || (plan.recommended && currentTier === 0)) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        background: plan.tier === currentTier
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'  // Green for current
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple for recommended
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        boxShadow: plan.tier === currentTier
                                            ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                            : '0 4px 12px rgba(102, 126, 234, 0.4)',
                                        zIndex: 10,
                                        letterSpacing: '0.5px'
                                    }}>
                                        {plan.tier === currentTier ? 'CURRENT PLAN' : 'RECOMMENDED'}
                                    </div>
                                )}

                                <div style={{ marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: plan.color }}>{plan.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '8px' }}>
                                        <span style={{ fontSize: '32px', fontWeight: '800' }}>{plan.price}</span>
                                        <span style={{ fontSize: '14px', opacity: 0.7 }}>{plan.period}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', marginTop: '8px', marginBottom: '12px', display: 'flex', gap: '6px' }}>
                                        <span style={{ opacity: 0.6 }}>Best for:</span>
                                        <span style={{ fontWeight: '500' }}>{plan.description}</span>
                                    </div>
                                    {/* Storage & Video limits */}
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.8 }}>
                                        <div>💾 {plan.storage}</div>
                                        <div>🎥 {plan.videos}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                    {plan.features.map((feature, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AiOutlineCheck style={{ color: '#4caf50', flexShrink: 0 }} />
                                            <span style={{ fontSize: '14px' }}>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {plan.tier !== currentTier && (
                                    <button
                                        onClick={() => handleUpgrade(plan)}
                                        className={plan.tier < currentTier ? "btn-ghost" : "btn-primary"}
                                        style={{ width: '100%' }}
                                    >
                                        {plan.tier < currentTier ? 'Downgrade' : 'Upgrade Now'}
                                    </button>
                                )}
                            </GlassCard>
                        ))}
                </div>
            </div>
            <BottomNav />
        </>
    );
}
