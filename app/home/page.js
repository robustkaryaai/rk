'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import AICommandInput from '@/components/AICommandInput';
import {
    AiOutlineWifi,
    AiOutlineDisconnect,
    AiOutlineRobot,
    AiOutlineHistory,
    AiOutlineClockCircle,
    AiOutlinePicture
} from 'react-icons/ai';
import { deviceAPI, mediaAPI } from '@/lib/api';

export default function HomePage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [device, setDevice] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/login');
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        // Check online status
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
        const initDevice = async () => {
            if (!isSignedIn) return;

            // Check for linked device slug
            const slug = localStorage.getItem('rk_device_slug');
            if (!slug) {
                router.push('/connect');
                return;
            }

            try {
                // Fetch device details only
                const deviceData = await deviceAPI.validateSlug(slug);

                if (!deviceData) {
                    // Slug invalid or device removed
                    localStorage.removeItem('rk_device_slug');
                    router.push('/connect');
                    return;
                }

                setDevice(deviceData);

                // Fetch chat history
                const chat = await mediaAPI.getChatHistory(slug);
                setChatHistory(chat);
            } catch (error) {
                console.error('Device sync error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isSignedIn) {
            initDevice();
        }
    }, [isSignedIn, router]);

    if (!isLoaded || !isSignedIn || loading) {
        return <div className="spinner"></div>;
    }

    return (
        <>
            <div className="page-container">
                {/* Device Status Header */}
                <div className="hero-section" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
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
                {/* Command History Feed */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <AiOutlineHistory />
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Activity History</h2>
                    </div>

                    <div className="history-feed">
                        {chatHistory.length > 0 ? (
                            chatHistory.map((convo) => (
                                <GlassCard key={convo.id} style={{ margin: '24px 0px', padding: '20px' }}>
                                    {/* User Message */}
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px', margin: '12px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            flexShrink: 0
                                        }}>
                                            👤
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.7 }}>
                                                You
                                            </div>
                                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                {convo.userMessage}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Response */}
                                    {convo.aiMessage && (
                                        <div style={{ display: 'flex', alignItems: 'start', gap: '10px', paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'rgba(255,255,255,0.1)',
                                                flexShrink: 0
                                            }}>
                                                🤖
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.7 }}>
                                                    AI Assistant
                                                </div>
                                                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                    {convo.aiMessage}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Date and Time */}
                                    {(convo.date || convo.time) && (
                                        <div style={{
                                            marginTop: '12px',
                                            paddingTop: '12px',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            fontSize: '12px',
                                            opacity: 0.5,
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center'
                                        }}>
                                            {convo.date && <span>📅 {convo.date}</span>}
                                            {convo.time && <span>🕐 {convo.time}</span>}
                                        </div>
                                    )}
                                </GlassCard>
                            ))
                        ) : (
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
