'use client';

import { useState, useEffect } from 'react';
import { AiOutlineClose, AiOutlineDownload } from 'react-icons/ai';
import GlassCard from './GlassCard';

export default function FileViewerModal({ file, deviceSlug, onClose, onDownload }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch file content from Supabase or Google Drive
                const { supabase } = await import('@/lib/supabase');
                const folderName = `${deviceSlug}`;
                const filePath = `${folderName}/${file.name}`;

                if (file.source === 'supabase') {
                    const { data, error: downloadError } = await supabase
                        .storage
                        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
                        .download(filePath);

                    if (downloadError) throw downloadError;

                    const text = await data.text();
                    setContent(text);
                } else if (file.source === 'google') {
                    // For Google Drive, fetch via blob URL
                    const response = await fetch(file.url || '#');
                    const text = await response.text();
                    setContent(text);
                }
            } catch (err) {
                console.error('Error loading file:', err);
                setError('Failed to load file content');
            } finally {
                setLoading(false);
            }
        };

        if (file) {
            fetchContent();
        }
    }, [file, deviceSlug]);

    const parseContent = (text) => {
        if (!text) return null;

        const lines = text.split('\n');

        // Detect if it's a timetable (has time patterns)
        const hasTimePattern = lines.some(line =>
            /\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/.test(line)
        );

        if (hasTimePattern) {
            return renderTimetable(lines);
        }

        // Otherwise render as formatted text
        return renderFormattedText(lines);
    };

    const renderTimetable = (lines) => {
        const rows = [];

        lines.forEach((line, idx) => {
            if (line.trim()) {
                // Try to extract time and description
                const match = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-:]\s*(.+)/);
                if (match) {
                    rows.push(
                        <div key={idx} style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                minWidth: '100px',
                                fontWeight: '600',
                                color: '#667eea',
                                fontSize: '14px'
                            }}>
                                {match[1]}
                            </div>
                            <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.6' }}>
                                {match[2]}
                            </div>
                        </div>
                    );
                } else {
                    // Header or plain line
                    rows.push(
                        <div key={idx} style={{
                            fontWeight: line.startsWith('#') ? '700' : '400',
                            fontSize: line.startsWith('#') ? '18px' : '14px',
                            marginTop: line.startsWith('#') ? '16px' : '4px',
                            marginBottom: '8px',
                            opacity: line.trim() ? 1 : 0.5
                        }}>
                            {line.replace(/^#+\s*/, '')}
                        </div>
                    );
                }
            }
        });

        return <div>{rows}</div>;
    };

    const renderFormattedText = (lines) => {
        return lines.map((line, idx) => {
            const trimmed = line.trim();

            // Headings
            if (trimmed.startsWith('###')) {
                return <h3 key={idx} style={{ fontSize: '16px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>{trimmed.replace(/^###\s*/, '')}</h3>;
            } else if (trimmed.startsWith('##')) {
                return <h2 key={idx} style={{ fontSize: '18px', fontWeight: '700', marginTop: '20px', marginBottom: '8px' }}>{trimmed.replace(/^##\s*/, '')}</h2>;
            } else if (trimmed.startsWith('#')) {
                return <h1 key={idx} style={{ fontSize: '22px', fontWeight: '700', marginTop: '24px', marginBottom: '12px' }}>{trimmed.replace(/^#\s*/, '')}</h1>;
            }

            // Bullet points
            else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '8px' }}>
                        <span style={{ color: '#667eea', fontWeight: '600' }}>•</span>
                        <span style={{ flex: 1, lineHeight: '1.6' }}>{trimmed.replace(/^[-•*]\s*/, '')}</span>
                    </div>
                );
            }

            // Empty lines
            else if (!trimmed) {
                return <div key={idx} style={{ height: '8px' }} />;
            }

            // Regular text
            return <p key={idx} style={{ marginBottom: '8px', lineHeight: '1.6', fontSize: '14px' }}>{line}</p>;
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <GlassCard
                style={{
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        {file.name}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => onDownload(file.name, file.id, file.source)}
                            style={{
                                background: 'rgba(102, 126, 234, 0.2)',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '14px',
                                color: 'white'
                            }}
                        >
                            <AiOutlineDownload /> Download
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <AiOutlineClose size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="spinner"></div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '20px',
                            background: 'rgba(255, 107, 107, 0.1)',
                            borderRadius: '8px',
                            color: '#ff6b6b',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div style={{ color: 'white' }}>
                            {parseContent(content)}
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
