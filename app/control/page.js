'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { deviceAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import { AiOutlineAudio, AiOutlineSend, AiFillAudio } from 'react-icons/ai';

export default function ControlPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [deviceSlug, setDeviceSlug] = useState('');
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    const isLoaded = !authLoading;
    const isSignedIn = !!user;

    // Auth & Device Check
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/login');
            return;
        }

        const slug = localStorage.getItem('rk_device_slug');
        if (isLoaded && isSignedIn && !slug) {
            router.push('/connect');
            return;
        }
        setDeviceSlug(slug);
    }, [isLoaded, isSignedIn, router]);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!text.trim() || !deviceSlug) return;

        setSending(true);
        try {
            // 1. Prepare Text
            const commandText = `ANNOUNCE ${text}`;
            console.log('Generating audio for:', commandText);

            // 2. Generate MP3 via our Proxy
            const ttsResponse = await fetch(`/api/tts?text=${encodeURIComponent(commandText)}`);
            if (!ttsResponse.ok) throw new Error('Failed to generate speech');
            const audioBlob = await ttsResponse.blob();

            // 3. Send to Device
            const success = await deviceAPI.sendVoiceCommand(deviceSlug, audioBlob);

            if (success) {
                alert('Announcement sent to device!');
                setText('');
            } else {
                alert('Failed to send command. Device might be offline.');
            }
        } catch (error) {
            console.error('Broadcast failed:', error);
            alert('Error sending announcement.');
        } finally {
            setSending(false);
        }
    };

    if (!isLoaded || !isSignedIn) {
        return <div className="spinner"></div>;
    }

    return (
        <>
            <div className="page-container">
                <div className="hero-section" style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 className="hero-title">Command Center</h1>
                    <p className="hero-subtitle">
                        Control Device #{deviceSlug} remotely
                    </p>
                </div>

                <div style={{ maxWidth: '400px', margin: '0 auto' }}>

                    <GlassCard style={{ padding: '32px' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AiOutlineAudio /> Make Announcement
                        </h2>
                        <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '24px' }}>
                            Type a message. The device will announce it out loud.
                        </p>

                        <form onSubmit={handleBroadcast}>
                            <textarea
                                className="input-field"
                                rows="3"
                                placeholder="e.g. Dinner is ready!"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                style={{
                                    width: '100%',
                                    resize: 'none',
                                    marginBottom: '16px',
                                    fontSize: '16px',
                                    padding: '16px'
                                }}
                                disabled={sending}
                            />

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={sending || !text.trim()}
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    height: '48px',
                                    fontSize: '16px'
                                }}
                            >
                                {sending ? (
                                    <><div className="spinner-small"></div> Sending...</>
                                ) : (
                                    <><AiOutlineSend /> Broadcast Now</>
                                )}
                            </button>
                        </form>
                    </GlassCard>

                </div>
            </div>
            <BottomNav />
        </>
    );
}
