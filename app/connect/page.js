'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import { AiOutlineLink, AiOutlineLoading3Quarters, AiOutlineQrcode, AiOutlineClose } from 'react-icons/ai';
import { deviceAPI } from '@/lib/api';
import BluetoothSetup from '@/components/DeviceSetup/BluetoothSetup';
import dynamic from 'next/dynamic';

// Dynamic import for QR Reader to avoid SSR issues
// Dynamic import for QR Reader to avoid SSR issues
const QrScanner = dynamic(
    () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
    { ssr: false }
);

export default function ConnectPage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [setupMode, setSetupMode] = useState(false);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/login');
        }
    }, [isLoaded, isSignedIn, router]);

    const handleConnect = async (e) => {
        if (e) e.preventDefault();
        if (!slug.trim()) return;

        setLoading(true);
        setError('');

        try {
            // Validate slug via API
            const device = await deviceAPI.validateSlug(slug);

            if (device) {
                // Save slug to localStorage for persistence
                localStorage.setItem('rk_device_slug', slug);
                // Switch to Bluetooth Setup Mode
                setSetupMode(true);
            } else {
                setError('Invalid Device ID. Please check and try again.');
            }
        } catch (err) {
            console.error('Connection error:', err);
            setError('Failed to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = (result) => {
        if (result && result.length > 0) {
            const rawValue = result[0].rawValue;
            // Handle both JSON and plain text
            try {
                const data = JSON.parse(rawValue);
                if (data.s) {
                    setSlug(data.s.toString());
                    setShowScanner(false);
                }
            } catch (e) {
                // Plain text fallback
                if (rawValue) {
                    setSlug(rawValue);
                    setShowScanner(false);
                }
            }
        }
    };

    const onSetupComplete = () => {
        router.push('/home');
    };

    if (!isLoaded || !isSignedIn) {
        return <div className="spinner"></div>;
    }

    if (setupMode) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <BluetoothSetup
                        slug={slug}
                        onComplete={onSetupComplete}
                        onCancel={() => setSetupMode(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <GlassCard style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <AiOutlineLink size={32} color="#667eea" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Connect Device</h1>
                    <p style={{ opacity: 0.7 }}>Enter your RK AI Device ID to continue</p>
                </div>

                {showScanner ? (
                    <div style={{ marginBottom: '24px', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                        <QrScanner
                            onScan={handleScan}
                            styles={{ container: { width: '100%' } }}
                        />
                        <button
                            onClick={() => setShowScanner(false)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <AiOutlineClose />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleConnect}>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label className="form-label">Device Slug</label>
                            <div className="ai-input-wrapper">
                                <input
                                    type="text"
                                    className="ai-command-input"
                                    style={{ borderRadius: '12px', paddingLeft: '16px' }}
                                    placeholder="e.g. 12345"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '8px' }}>{error}</p>}
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={loading || !slug.trim()}
                        >
                            {loading ? (
                                <>
                                    <AiOutlineLoading3Quarters className="spinning" style={{ marginRight: '8px' }} />
                                    Connecting...
                                </>
                            ) : (
                                'Connect & Setup'
                            )}
                        </button>
                    </form>
                )}

                {!showScanner && (
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="btn-ghost"
                            style={{ fontSize: '14px', opacity: 0.7 }}
                        >
                            <AiOutlineQrcode style={{ marginRight: '6px' }} />
                            Scan QR Code
                        </button>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
