'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
    const { user } = useAuth();
    const router = useRouter();
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [setupMode, setSetupMode] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

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

    if (!user) {
        return <div className="spinner"></div>;
    }

    if (setupMode) {
        return (
            <div className="login-wrapper">
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
        <div className="login-wrapper">
            <div className="card-container-wrapper">
                <div className="glass-panel">
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <AiOutlineLink size={32} color="#6366f1" />
                        </div>
                        <h1 className="brand-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Connect Device</h1>
                        <p className="brand-subtitle" style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                            Enter your RK AI Device ID to continue
                        </p>
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
                            <div className="auth-form-group">
                                <label className="auth-label">Device Slug</label>
                                <div className="input-wrapper">
                                    <div className="input-icon-left">
                                        <AiOutlineQrcode />
                                    </div>
                                    <input
                                        type="text"
                                        className="auth-input"
                                        placeholder="e.g. 12345"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                {error && (
                                    <div className="error-box" style={{ marginTop: '1rem', marginBottom: '0' }}>
                                        <div className="error-dot"></div>
                                        {error}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary-gradient"
                                disabled={loading || !slug.trim()}
                            >
                                {loading ? 'Connecting...' : 'Connect & Setup'}
                            </button>
                        </form>
                    )}

                    {!showScanner && (
                        <div className="divider-wrapper">
                            <div className="divider-line"></div>
                            <span className="divider-text">OR</span>
                            <div className="divider-line"></div>
                        </div>
                    )}

                    {!showScanner && (
                        <button
                            onClick={() => setShowScanner(true)}
                            className="btn-google-outline"
                        >
                            <AiOutlineQrcode className="text-xl" />
                            <span>Scan QR Code</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
