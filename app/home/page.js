'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import {
    AiOutlineRobot,
    AiOutlineHistory,
} from 'react-icons/ai';
import { deviceAPI, mediaAPI } from '@/lib/api';
import { Capacitor } from '@capacitor/core';
import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le';

export default function HomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [device, setDevice] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [bleConnected, setBleConnected] = useState(false);
    const [sentWifi, setSentWifi] = useState(false);

    const isSignedIn = !!user;
    const isLoaded = !authLoading;

    // 1️⃣ Redirect to login if user not signed in
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/login');
        }
    }, [isLoaded, isSignedIn, router]);

    // 2️⃣ Online/offline status
    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const isNative = typeof Capacitor !== 'undefined' && typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() !== 'web' : false;
        if (!isNative) return;
        let timer;
        let initialized = false;
        const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
        const CHARACTERISTIC_UUID_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
        const getTrimmedSlug = (name) => {
            if (!name) return null;
            const n = name.toLowerCase();
            if (!n.startsWith('rk-ai-')) return null;
            return n.slice(6);
        };
        const checkAndSend = async () => {
            try {
                if (!initialized) {
                    await BleClient.initialize({ androidNeverForLocation: true });
                    const enabled = await BleClient.isEnabled();
                    if (!enabled) {
                        await BleClient.requestEnable();
                    }
                    initialized = true;
                }
                const slug = typeof localStorage !== 'undefined' ? localStorage.getItem('rk_device_slug') : null;
                if (!slug) return;
                const connected = await BleClient.getConnectedDevices([SERVICE_UUID]);
                let target = connected.find(d => getTrimmedSlug(d.name) === String(slug));
                if (!target) {
                    const bonded = await BleClient.getBondedDevices();
                    target = bonded.find(d => getTrimmedSlug(d.name) === String(slug));
                }
                if (!target) {
                    await BleClient.requestLEScan({ services: [SERVICE_UUID], allowDuplicates: false }, (res) => {
                        const name = res.device?.name || '';
                        const trimmed = getTrimmedSlug(name);
                        if (trimmed && trimmed === String(slug)) {
                            target = res.device;
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    await BleClient.stopLEScan();
                }
                const isConn = !!target;
                setBleConnected(isConn);
                if (isConn && !sentWifi) {
                    try {
                        await BleClient.connect(target.deviceId);
                    } catch {}
                    const ssid = typeof localStorage !== 'undefined' ? localStorage.getItem('rk_wifi_ssid') : '';
                    const pass = typeof localStorage !== 'undefined' ? localStorage.getItem('rk_wifi_pass') : '';
                    if (ssid && pass) {
                        const payload = JSON.stringify({ slug, ssid, pass, password: pass });
                        const encoder = new TextEncoder();
                        const bytes = Array.from(encoder.encode(payload));
                        await BleClient.write(target.deviceId, SERVICE_UUID, CHARACTERISTIC_UUID_RX, numbersToDataView(bytes));
                        setSentWifi(true);
                        try {
                            localStorage.removeItem('rk_wifi_ssid');
                            localStorage.removeItem('rk_wifi_pass');
                        } catch {}
                    }
                }
            } catch (e) {
                // ignore transient errors
            }
        };
        checkAndSend();
        timer = setInterval(checkAndSend, 10000);
        return () => {
            if (timer) clearInterval(timer);
        };
    }, []);

    // 3️⃣ Fetch device and chat history, with slug check
    useEffect(() => {
        const fetchData = async () => {
            if (!isSignedIn) return;

            const slug = localStorage.getItem('rk_device_slug');
            if (!slug) {
                router.push('/connect');
                return;
            }

            try {
                // Validate device
                const deviceData = await deviceAPI.validateSlug(slug);
                if (!deviceData) {
                    localStorage.removeItem('rk_device_slug');
                    router.push('/connect');
                    return;
                }
                setDevice(deviceData);

                // Fetch chat history
                const chat = await mediaAPI.getChatHistory(slug);
                setChatHistory(chat);
            } catch (err) {
                console.error('Error loading device/chat:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSignedIn, router]);

    if (!isLoaded || !isSignedIn || loading) {
        return <div className="spinner"></div>;
    }

    return (
        <>
            <div className="page-container">
                {/* Device Header */}
                {device && (
                    <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <div className={`status-dot ${device.status === 'online' ? 'online' : 'offline'}`}></div>
                                <span style={{ fontSize: '14px', opacity: 0.8, textTransform: 'capitalize' }}>{device.status}</span>
                            </div>
                            <h1 className="hero-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Device: {device.name}</h1>
                            <p className="hero-subtitle" style={{ fontSize: '14px' }}>ID: {device.id}</p>
                        </div>
                        <div className="device-icon-large">
                            <AiOutlineRobot size={48} color="white" style={{ opacity: 0.2 }} />
                        </div>
                    </div>
                )}

                {/* Chat History */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <AiOutlineHistory />
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Activity History</h2>
                    </div>

                    <div className="history-feed">
                        {chatHistory.length > 0 ? chatHistory.map((convo) => (
                            <GlassCard key={convo.id} style={{ margin: '24px 0', padding: '20px' }}>
                                {/* User Message */}
                                <div style={{ display: 'flex', alignItems: 'start', gap: '10px', margin: '12px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    }}>👤</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.7 }}>You</div>
                                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{convo.userMessage}</div>
                                    </div>
                                </div>

                                {/* AI Response */}
                                {convo.aiMessage && (
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px', paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(255,255,255,0.1)'
                                        }}>🤖</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.7 }}>AI Assistant</div>
                                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{convo.aiMessage}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Date & Time */}
                                {(convo.date || convo.time) && (
                                    <div style={{
                                        marginTop: '12px', paddingTop: '12px',
                                        borderTop: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: '12px', opacity: 0.5, display: 'flex', gap: '12px', alignItems: 'center'
                                    }}>
                                        {convo.date && <span>📅 {convo.date}</span>}
                                        {convo.time && <span>🕐 {convo.time}</span>}
                                    </div>
                                )}
                            </GlassCard>
                        )) : (
                            <div className="empty-state" style={{ padding: '32px' }}>
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <BottomNav />
        </>
    );
}
