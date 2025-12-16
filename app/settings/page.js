'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import {
    AiOutlineUser,
    AiOutlineSetting,
    AiOutlineLogout,
    AiOutlineRight,
    AiOutlineDisconnect,
    AiOutlineRobot,
    AiOutlineBell,
    AiOutlineSound,
    AiOutlineEdit,
    AiOutlineCloud,
    AiOutlineGoogle,
    AiOutlineInfoCircle,
    AiOutlineWifi
} from 'react-icons/ai';
import { BsMoonStars, BsSun } from 'react-icons/bs';
import { deviceAPI, userAPI, mediaAPI } from '@/lib/api';
import dynamic from 'next/dynamic';
import { Browser } from '@capacitor/browser';

const BluetoothSetup = dynamic(() => import('@/components/DeviceSetup/BluetoothSetup'), { ssr: false });

export default function SettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    // Map loading/user to match previous logic (isLoaded, isSignedIn)
    const isLoaded = !loading;
    const isSignedIn = !!user;
    const [deviceSlug, setDeviceSlug] = useState('');
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [storageUsing, setStorageUsing] = useState('supabase');
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageLimit, setStorageLimit] = useState(500);
    const [voiceVolume, setVoiceVolume] = useState(70);
    const [micMuted, setMicMuted] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [showWifiUpdate, setShowWifiUpdate] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

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

        setDeviceSlug(slug);

        // Fetch device info and subscription
        const fetchData = async () => {
            if (slug) {
                const device = await deviceAPI.validateSlug(slug);
                setDeviceInfo(device);

                // Get storage setting from device (assuming it's returned or we need to fetch it)
                // For now, let's assume validateSlug returns storageUsing if we updated it, or we fetch subscription

                const sub = await userAPI.getSubscription(slug);
                setSubscription(sub);

                // Always set storage from device data (source of truth is Appwrite)
                if (device && device.storageUsing) {
                    setStorageUsing(device.storageUsing);
                }

                // Check URL params for success/error messages only
                const params = new URLSearchParams(window.location.search);
                if (params.get('google_connected') === 'true') {
                    alert('✅ Google Drive connected successfully!');
                    window.history.replaceState({}, '', '/settings');
                } else if (params.get('google_error')) {
                    alert('❌ Failed to connect Google Drive: ' + params.get('google_error'));
                    window.history.replaceState({}, '', '/settings');
                }

                // Fetch storage usage
                const files = await mediaAPI.getFiles(slug);
                console.log('[Storage] Files fetched:', files.files?.length, 'files');
                const totalSize = files.files.reduce((sum, file) => sum + (file.size || 0), 0);
                console.log('[Storage] Total size:', totalSize, 'bytes');
                setStorageUsed(totalSize);

                // Set storage limit based on current storage provider and tier
                const currentStorage = device?.storageUsing || 'supabase';
                console.log('[Storage] Current storage provider:', currentStorage);
                console.log('[Storage] Subscription tier:', sub.tier);

                if (currentStorage === 'google') {
                    setStorageLimit(15 * 1024 * 1024 * 1024); // 15 GB for Google Drive free tier
                } else {
                    // For Supabase, get limit from subscription tier
                    const tierLimits = {
                        0: 500,      // Free: 500 MB
                        1: 5120,     // Student: 5 GB
                        2: 20480,    // Creator: 20 GB
                        3: 51200,    // Pro: 50 GB
                        4: 122880    // Studio: 120 GB
                    };
                    const limitMB = tierLimits[sub.tier] || 500;
                    console.log('[Storage] Limit MB:', limitMB);
                    setStorageLimit(limitMB * 1024 * 1024);
                }
            }
        };

        if (isLoaded && isSignedIn && slug) {
            fetchData();
        }
    }, [isLoaded, isSignedIn, router]);

    // Initialize dark mode state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDark = document.documentElement.classList.contains('dark');
            setDarkMode(isDark);
        }
    }, []);

    const handleConnectGoogle = async () => {
        const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

        if (isNative) {
            // Build OAuth URL manually for Native
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
            const scope = 'https://www.googleapis.com/auth/drive.file email';

            if (!clientId || !redirectUri) {
                alert('Google OAuth config missing');
                return;
            }

            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            authUrl.searchParams.append('client_id', clientId);
            authUrl.searchParams.append('redirect_uri', redirectUri);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('scope', scope);
            authUrl.searchParams.append('access_type', 'offline');
            authUrl.searchParams.append('prompt', 'consent');
            // Pass flag to indicate this is a native app request so callback can redirect to deep link
            authUrl.searchParams.append('state', `${deviceSlug}|native`);

            console.log('[Google Connect] Opening native browser:', authUrl.toString());
            await Browser.open({ url: authUrl.toString() });
        } else {
            // Web flow
            window.location.href = `/api/auth/google/connect?slug=${deviceSlug}`;
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!confirm('Disconnect Google Drive and switch back to standard storage?')) return;

        try {
            const response = await fetch('/api/auth/google/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: deviceSlug })
            });

            if (response.ok) {
                setStorageUsing('supabase');
                alert('Switched back to standard storage.');
            } else {
                alert('Failed to disconnect.');
            }
        } catch (error) {
            console.error('Disconnect failed:', error);
            alert('Error disconnecting Google Drive.');
        }
    };

    const handleDisconnect = () => {
        localStorage.removeItem('rk_device_slug');
        router.push('/connect');
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Dark mode handlers
    const isDarkMode = () => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    };

    const toggleDarkMode = () => {
        const html = document.documentElement;
        const body = document.body;
        const currentlyDark = html.classList.contains('dark');
        const nextDark = !currentlyDark;
        if (nextDark) {
            html.classList.add('dark');
            body.classList.add('dark');
        } else {
            html.classList.remove('dark');
            body.classList.remove('dark');
        }
        localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        setDarkMode(nextDark);
    };

    const handleEditName = () => {
        setEditedName(deviceInfo?.name || '');
        setIsEditingName(true);
    };

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setEditedName('');
    };

    const handleFactoryReset = async () => {
        if (!confirm('⚠️ Factory Reset will DELETE ALL FILES and disconnect your device. This cannot be undone. Continue?')) {
            return;
        }

        try {
            // Import supabase
            const { supabase } = await import('@/lib/supabase');

            // List all files in the folder
            const { data: files } = await supabase
                .storage
                .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
                .list(deviceSlug);

            if (files && files.length > 0) {
                // Delete all files
                const filePaths = files.map(file => `${deviceSlug}/${file.name}`);
                await supabase
                    .storage
                    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
                    .remove(filePaths);
            }

            // Disconnect device
            localStorage.removeItem('rk_device_slug');
            alert('✅ Factory reset complete. Device disconnected.');
            router.push('/connect');
        } catch (error) {
            console.error('Factory reset failed:', error);
            alert('❌ Factory reset failed. Please try again.');
        }
    };

    const handleSaveName = async () => {
        try {
            // Update in Appwrite
            const { databases, DATABASE_ID, COLLECTIONS, Query } = await import('@/lib/appwrite');

            // Get the device document ID first
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.DEVICES,
                [Query.equal('slug', parseInt(deviceSlug, 10))]
            );

            if (response.documents && response.documents.length > 0) {
                const deviceDoc = response.documents[0];

                // Update the name_of_device field
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.DEVICES,
                    deviceDoc.$id,
                    { name_of_device: editedName }
                );

                // Update local state
                setDeviceInfo({ ...deviceInfo, name: editedName });
                setIsEditingName(false);
            }
        } catch (error) {
            console.error('Error saving device name:', error);
            alert('Failed to save device name. Please try again.');
        }
    };

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="login-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                @keyframes textFlow {
                    0% {
                        background: linear-gradient(90deg, 
                            rgba(102,126,234,1) 0%, 
                            rgba(255,255,255,0.9) 20%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    12.5% {
                        background: linear-gradient(90deg, 
                            rgba(255,255,255,0.9) 0%, 
                            rgba(102,126,234,1) 10%, 
                            rgba(255,255,255,0.9) 30%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    25% {
                        background: linear-gradient(90deg, 
                            rgba(255,255,255,0.9) 0%, 
                            rgba(102,126,234,1) 25%, 
                            rgba(255,255,255,0.9) 45%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    37.5% {
                        background: linear-gradient(90deg, 
                            rgba(255,255,255,0.9) 0%, 
                            rgba(255,255,255,0.9) 20%, 
                            rgba(102,126,234,1) 40%, 
                            rgba(255,255,255,0.9) 60%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    50% {
                        background: linear-gradient(90deg, 
                            rgba(255,255,255,0.9) 0%, 
                            rgba(255,255,255,0.9) 35%, 
                            rgba(102,126,234,1) 55%, 
                            rgba(255,255,255,0.9) 75%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    62.5% {
                        background: linear-gradient(90deg, 
                            rgba(255,255,255,0.9) 0%, 
                            rgba(255,255,255,0.9) 50%, 
                            rgba(102,126,234,1) 70%, 
                            rgba(255,255,255,0.9) 90%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    75% {
                        background: linear-gradient(90deg, 
                            rgba(255,255,255,0.9) 0%, 
                            rgba(255,255,255,0.9) 65%, 
                            rgba(102,126,234,1) 85%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    87.5% {
                        background: linear-gradient(90deg, 
                            rgba(255,255,255,0.9) 0%, 
                            rgba(255,255,255,0.9) 80%, 
                            rgba(102,126,234,1) 95%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    100% {
                        background: linear-gradient(90deg, 
                            rgba(102,126,234,1) 0%, 
                            rgba(255,255,255,0.9) 20%, 
                            rgba(255,255,255,0.9) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                }
            `}</style>
            {/* WiFi Update Modal */}
            {/* WiFi Update Modal */}
            {showWifiUpdate && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <BluetoothSetup
                            slug={deviceSlug}
                            initialStep="wifi"
                            onComplete={() => setShowWifiUpdate(false)}
                            onCancel={() => setShowWifiUpdate(false)}
                        />
                    </div>
                </div>
            )}


            {/* Device Settings */}
            <div className="page-container">
                <h1 className="page-title">Settings</h1>

                <section style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">Connected Device</h2>
                    <GlassCard>
                        {deviceSlug ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <AiOutlineRobot size={20} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                                                Device: {deviceInfo?.name || 'Loading...'}
                                            </h3>
                                            <div
                                                onClick={handleEditName}
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <AiOutlineEdit size={16} />
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '12px', opacity: 0.7 }}>ID: {deviceSlug}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div
                                        onClick={() => setShowWifiUpdate(true)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#667eea',
                                            background: 'rgba(102, 126, 234, 0.1)'
                                        }}
                                        title="Update WiFi Configuration"
                                    >
                                        <AiOutlineWifi size={20} />
                                    </div>
                                    <div
                                        onClick={handleDisconnect}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#ff0000ff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <AiOutlineDisconnect size={20} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '12px' }}>
                                <p style={{ marginBottom: '12px', opacity: 0.7 }}>No device connected</p>
                                <button
                                    onClick={() => router.push('/connect')}
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Connect Device
                                </button>
                            </div>
                        )}
                    </GlassCard>
                </section>

                {/* Subscription Section */}
                <section style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">Subscription</h2>
                    <GlassCard>
                        <div
                            onClick={() => router.push('/subscription')}
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                                    {subscription?.plan || 'Free'} Plan
                                </div>
                                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                                    {subscription?.tier === 0
                                        ? 'Want more limits? Upgrade now!'
                                        : 'Wanna change plan? Click here'
                                    }
                                </div>
                            </div>
                            <AiOutlineRight size={20} />
                        </div>
                    </GlassCard>
                </section>

                {/* Appearance Settings */}
                <section style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">Appearance</h2>
                    <GlassCard className="settings-card">
                        <div className="settings-item">
                            <div className="settings-info">
                                <div className="settings-icon">
                                    {darkMode ? <BsMoonStars /> : <BsSun />}
                                </div>
                                <span>Dark Mode</span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={toggleDarkMode}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </GlassCard>
                </section>

                {/* AI Device Settings */}
                <section style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">AI Device Settings</h2>
                    <GlassCard className="settings-card">
                        {/* Voice Volume */}
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="settings-info">
                                    <div className="settings-icon">
                                        <AiOutlineSound />
                                    </div>
                                    <span>Voice Volume</span>
                                </div>
                                <div className="settings-value">{voiceVolume}%</div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={voiceVolume}
                                onChange={(e) => setVoiceVolume(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Microphone Mute */}
                        <div className="settings-item">
                            <div className="settings-info">
                                <div className="settings-icon">
                                    <AiOutlineSound />
                                </div>
                                <span>Microphone</span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={!micMuted}
                                    onChange={() => setMicMuted(!micMuted)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* Factory Reset */}
                        <div className="settings-item" style={{ position: 'relative' }}>
                            <div className="settings-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#ff0000ff', fontWeight: '500' }}>Factory Reset</span>
                                <div
                                    style={{
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        const tooltip = e.currentTarget.querySelector('.tooltip');
                                        if (tooltip) tooltip.style.opacity = '1';
                                        e.currentTarget.style.color = '#ff6b6b';
                                    }}
                                    onMouseLeave={(e) => {
                                        const tooltip = e.currentTarget.querySelector('.tooltip');
                                        if (tooltip) tooltip.style.opacity = '0';
                                        e.currentTarget.style.color = 'inherit';
                                    }}
                                >
                                    <AiOutlineInfoCircle size={16} style={{ opacity: 0.6, color: '#ff0000ff' }} />
                                    <div
                                        className="tooltip"
                                        style={{
                                            position: 'absolute',
                                            left: '50%',
                                            bottom: '120%',
                                            transform: 'translateX(-50%)',
                                            background: 'rgba(255, 0, 0, 0.95)',
                                            color: 'white',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            opacity: 0,
                                            transition: 'opacity 0.2s',
                                            pointerEvents: 'none',
                                            zIndex: 1000
                                        }}
                                    >
                                        Delete all files and reset device
                                        <div style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '100%',
                                            transform: 'translateX(-50%)',
                                            width: 0,
                                            height: 0,
                                            borderLeft: '6px solid transparent',
                                            borderRight: '6px solid transparent',
                                            borderTop: '6px solid rgba(255, 0, 0, 0.95)'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleFactoryReset}
                                className="btn-ghost"
                                style={{
                                    background: '#ff0000ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    fontSize: '13px'
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </GlassCard>
                </section>

                {/* About Section */}
                <section style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">About</h2>
                    <GlassCard className="settings-card">
                        <div className="settings-item">
                            <div className="settings-info">
                                <span>Version</span>
                            </div>
                            <div className="settings-value">2.1.3</div>
                        </div>
                        <div
                            onClick={() => router.push('/new')}
                            className="settings-item menu-item-hover"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: '12px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                const span = e.currentTarget.querySelector('span');
                                if (span) span.classList.add('menu-text-flow');
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                const span = e.currentTarget.querySelector('span');
                                if (span) span.classList.remove('menu-text-flow');
                            }}
                        >
                            <div className="settings-info">
                                <span style={{ transition: 'all 0.3s' }}>What&#39;s New?</span>
                            </div>
                            <AiOutlineRight style={{ opacity: 0.5 }} />
                        </div>
                        <div
                            onClick={() => router.push('/terms')}
                            className="settings-item menu-item-hover"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: '12px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                const span = e.currentTarget.querySelector('span');
                                if (span) span.classList.add('menu-text-flow');
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                const span = e.currentTarget.querySelector('span');
                                if (span) span.classList.remove('menu-text-flow');
                            }}
                        >
                            <div className="settings-info">
                                <span style={{ transition: 'all 0.3s' }}>Terms of Service</span>
                            </div>
                            <AiOutlineRight style={{ opacity: 0.5 }} />
                        </div>
                        <div
                            onClick={() => router.push('/privacy')}
                            className="settings-item menu-item-hover"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: '12px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                const span = e.currentTarget.querySelector('span');
                                if (span) span.classList.add('menu-text-flow');
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                const span = e.currentTarget.querySelector('span');
                                if (span) span.classList.remove('menu-text-flow');
                            }}
                        >
                            <div className="settings-info">
                                <span>Privacy Policy</span>
                            </div>
                            <AiOutlineRight style={{ opacity: 0.5 }} />
                        </div>
                    </GlassCard>
                </section>

                {/* Cloud Storage (All Users) */}
                <section style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">Cloud Storage</h2>
                    <GlassCard className="settings-card">
                        <div className="settings-item">
                            <div className="settings-info">
                                <div className="settings-icon">
                                    <AiOutlineCloud />
                                </div>
                                <span>File Storage Location</span>
                            </div>
                            <div className="settings-value" style={{ textTransform: 'capitalize' }}>
                                {storageUsing === 'google' ? 'Google Drive' : 'Supabase (Default)'}
                            </div>
                        </div>

                        {/* Storage Usage */}
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="settings-info">
                                    <span>Storage Used</span>
                                </div>
                                <div className="settings-value">
                                    {storageUsed < 1024 * 1024
                                        ? `${(storageUsed / 1024).toFixed(1)} KB / ${(storageLimit / (1024 * 1024)).toFixed(0)} MB`
                                        : `${(storageUsed / (1024 * 1024)).toFixed(1)} MB / ${(storageLimit / (1024 * 1024)).toFixed(0)} MB`
                                    }
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div style={{
                                width: '100%',
                                height: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%`,
                                    height: '100%',
                                    background: (storageUsed / storageLimit) > 0.9
                                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    transition: 'width 0.3s ease'
                                }}></div>
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.6, textAlign: 'right' }}>
                                {((storageUsed / storageLimit) * 100).toFixed(1)}% used
                            </div>
                        </div>

                        <div className="settings-item">
                            <div className="settings-info">
                                <span>Google Drive Integration</span>
                                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Store files in your personal Drive</div>
                            </div>
                            <div style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                background: 'rgba(102, 126, 234, 0.1)',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                                color: '#667eea',
                                fontWeight: '600'
                            }}>
                                Coming Soon
                            </div>
                        </div>

                        {/* Commented out for future use
                        {storageUsing === 'supabase' ? (
                            <div className="settings-item">
                                <div className="settings-info">
                                    <span>Connect Google Drive</span>
                                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Store files in your personal Drive</div>
                                </div>
                                <button
                                    onClick={handleConnectGoogle}
                                    className="btn-primary"
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <AiOutlineGoogle /> Connect
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="settings-item" style={{ position: 'relative' }}>
                                    <div className="settings-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#4CAF50' }}>✓ Connected</span>
                                        <div
                                            style={{
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                const tooltip = e.currentTarget.querySelector('.tooltip');
                                                if (tooltip) tooltip.style.opacity = '1';
                                                e.currentTarget.style.color = '#667eea';
                                            }}
                                            onMouseLeave={(e) => {
                                                const tooltip = e.currentTarget.querySelector('.tooltip');
                                                if (tooltip) tooltip.style.opacity = '0';
                                                e.currentTarget.style.color = 'inherit';
                                            }}
                                        >
                                            <AiOutlineInfoCircle size={16} style={{ opacity: 0.6 }} />
                                            <div
                                                className="tooltip"
                                                style={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    bottom: '120%',
                                                    transform: 'translateX(-50%)',
                                                    background: 'rgba(0, 0, 0, 0.9)',
                                                    color: 'white',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s',
                                                    pointerEvents: 'none',
                                                    zIndex: 1000
                                                }}
                                            >
                                                Files are saving to Google Drive
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    top: '100%',
                                                    transform: 'translateX(-50%)',
                                                    width: 0,
                                                    height: 0,
                                                    borderLeft: '6px solid transparent',
                                                    borderRight: '6px solid transparent',
                                                    borderTop: '6px solid rgba(0, 0, 0, 0.9)'
                                                }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDisconnectGoogle}
                                        className="btn-ghost"
                                        style={{
                                            background: '#ff0000ff',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            fontSize: '13px'
                                        }}
                                    >
                                    </button>
                                </div>
                            </div>

                        )}
                        */}
                    </GlassCard>
                </section>

                {/* Contact & Support */}
                <section style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">Support</h2>
                    <GlassCard className="settings-card">
                        <div
                            className="settings-item menu-item-hover"
                            onClick={() => router.push('/contact')}
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '12px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <div className="settings-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px'
                                }}>
                                    📧
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Contact Us / Bug Report</div>
                                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Get in touch or report issues</div>
                                </div>
                            </div>
                            <AiOutlineRight style={{ opacity: 0.5 }} />
                        </div>
                    </GlassCard>
                </section>


                {/* Premium Features Section - Only for Tier 3/4 */}
                {subscription && (subscription.tier === 3 || subscription.tier === 4) && (
                    <section style={{ marginBottom: '24px' }}>
                        <h2 className="section-title">Premium Features</h2>
                        <GlassCard className="settings-card">
                            <div
                                className="settings-item menu-item-hover"
                                onClick={() => router.push('/tiersonlycontact')}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    borderRadius: '12px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div className="settings-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        💡
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Request a Feature</div>
                                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Tell us what you&#39;d like to see</div>
                                    </div>
                                </div>
                                <AiOutlineRight style={{ opacity: 0.5 }} />
                            </div>
                        </GlassCard>
                    </section>
                )}

                {/* Account Section */}
                <section>
                    <h2 className="section-title">Account</h2>
                    <GlassCard className="settings-card">
                        <div className="settings-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                            <div className="settings-info">
                                <div className="settings-icon" style={{ color: '#ff0000ff' }}>
                                    <AiOutlineLogout />
                                </div>
                                <span style={{ color: '#ff0000ff' }}>Log Out</span>
                            </div>
                            <AiOutlineRight style={{ opacity: 0.5 }} />
                        </div>
                    </GlassCard>
                </section>

                <div style={{ textAlign: 'center', marginTop: '32px', opacity: 0.5, fontSize: '12px' }}>
                    <p>RK v2.1.1</p>
                </div>
            </div>

            {/* Edit Name Modal */}
            {
                isEditingName && (
                    <div
                        onClick={() => setIsEditingName(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '20px',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(40px)',
                                WebkitBackdropFilter: 'blur(40px)',
                                borderRadius: '24px',
                                padding: '32px',
                                width: '100%',
                                maxWidth: '420px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                                animation: 'slideUp 0.3s ease-out'
                            }}
                        >
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                marginBottom: '24px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                Edit Device Name
                            </h3>
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                placeholder="Enter device name"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    marginBottom: '24px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.border = '1px solid rgba(102, 126, 234, 0.4)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                                }}
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setIsEditingName(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.07)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveName}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px 0 rgba(102, 126, 234, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 15px 0 rgba(102, 126, 234, 0.3)';
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <BottomNav />
        </>
    );
}
