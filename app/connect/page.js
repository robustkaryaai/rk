'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AiOutlineLink, AiOutlineQrcode, AiOutlineClose } from 'react-icons/ai';
import { deviceAPI } from '@/lib/api';
import BluetoothSetup from '@/components/DeviceSetup/BluetoothSetup';
import dynamic from 'next/dynamic';

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
            const device = await deviceAPI.validateSlug(slug);
            if (device) {
                localStorage.setItem('rk_device_slug', slug);
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
            try {
                const data = JSON.parse(rawValue);
                if (data.s) {
                    setSlug(data.s.toString());
                    setShowScanner(false);
                }
            } catch (e) {
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
        return (
            <div className="page-container" style={{ justifyContent: 'center', height: '100vh' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (setupMode) {
        return (
            <div className="page-container">
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
        <div className="page-container">
            <div className="auth-header">
                <div style={{
                    width: '64px', height: '64px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <AiOutlineLink size={32} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h1 className="brand-title">Connect Device</h1>
                <p className="brand-subtitle">Enter your RK AI Device ID</p>
            </div>

            <div className="auth-card">
                {showScanner ? (
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <QrScanner
                            onScan={handleScan}
                            styles={{ container: { width: '100%' } }}
                        />
                        <button
                            onClick={() => setShowScanner(false)}
                            style={{
                                position: 'absolute', top: '10px', right: '10px',
                                background: 'rgba(0,0,0,0.5)', color: 'white',
                                border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <AiOutlineClose />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleConnect}>
                        <div className="form-group">
                            <label className="form-label">Device ID</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 123456"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {error && <div className="error-banner">{error}</div>}

                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                            disabled={loading || !slug.trim()}
                        >
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Connect'}
                        </button>
                    </form>
                )}

                {!showScanner && (
                    <>
                        <div className="divider"><span>OR</span></div>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="btn btn-outline"
                        >
                            <AiOutlineQrcode className="icon-lg" />
                            <span>Scan QR Code</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
