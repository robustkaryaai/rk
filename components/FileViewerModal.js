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

    const parseInlineFormatting = (text) => {
        // Parse inline markdown: **bold**, *italic*, ***bold-italic***
        const parts = [];
        let currentIndex = 0;
        const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Add text before match
            if (match.index > currentIndex) {
                parts.push({ type: 'text', content: text.substring(currentIndex, match.index) });
            }

            const matched = match[0];
            if (matched.startsWith('***') && matched.endsWith('***')) {
                // Bold + Italic
                parts.push({ type: 'bold-italic', content: matched.slice(3, -3) });
            } else if (matched.startsWith('**') && matched.endsWith('**')) {
                // Bold
                parts.push({ type: 'bold', content: matched.slice(2, -2) });
            } else if (matched.startsWith('*') && matched.endsWith('*')) {
                // Italic
                parts.push({ type: 'italic', content: matched.slice(1, -1) });
            }

            currentIndex = match.index + matched.length;
        }

        // Add remaining text
        if (currentIndex < text.length) {
            parts.push({ type: 'text', content: text.substring(currentIndex) });
        }

        return parts.length > 0 ? parts : [{ type: 'text', content: text }];
    };

    const renderInlineContent = (text) => {
        const parts = parseInlineFormatting(text);
        return parts.map((part, idx) => {
            if (part.type === 'bold') {
                return <strong key={idx} style={{ fontWeight: '700', color: '#e0e7ff' }}>{part.content}</strong>;
            } else if (part.type === 'italic') {
                return <em key={idx} style={{ fontStyle: 'italic', color: '#e0e7ff' }}>{part.content}</em>;
            } else if (part.type === 'bold-italic') {
                return <strong key={idx}><em style={{ fontWeight: '700', fontStyle: 'italic', color: '#e0e7ff' }}>{part.content}</em></strong>;
            }
            return <span key={idx}>{part.content}</span>;
        });
    };

    const renderFormattedText = (lines) => {
        return lines.map((line, idx) => {
            const trimmed = line.trim();

            // Headings
            if (trimmed.startsWith('###')) {
                const content = trimmed.replace(/^###\s*/, '');
                return <h3 key={idx} style={{ fontSize: '16px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>{renderInlineContent(content)}</h3>;
            } else if (trimmed.startsWith('##')) {
                const content = trimmed.replace(/^##\s*/, '');
                return <h2 key={idx} style={{ fontSize: '18px', fontWeight: '700', marginTop: '20px', marginBottom: '8px' }}>{renderInlineContent(content)}</h2>;
            } else if (trimmed.startsWith('#')) {
                const content = trimmed.replace(/^#\s*/, '');
                return <h1 key={idx} style={{ fontSize: '22px', fontWeight: '700', marginTop: '24px', marginBottom: '12px' }}>{renderInlineContent(content)}</h1>;
            }

            // Bullet points (avoid treating * at start as bullet if it's markdown formatting)
            else if (trimmed.startsWith('-') || trimmed.startsWith('•') || (trimmed.startsWith('*') && trimmed[1] === ' ')) {
                const content = trimmed.replace(/^[-•*]\s*/, '');
                return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '8px' }}>
                        <span style={{ color: '#667eea', fontWeight: '600', minWidth: '8px' }}>•</span>
                        <span style={{ flex: 1, lineHeight: '1.6' }}>{renderInlineContent(content)}</span>
                    </div>
                );
            }

            // Empty lines
            else if (!trimmed) {
                return <div key={idx} style={{ height: '8px' }} />;
            }

            // Regular text with inline formatting
            return <p key={idx} style={{ marginBottom: '8px', lineHeight: '1.6', fontSize: '14px' }}>{renderInlineContent(line)}</p>;
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
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '85vh',
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
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 'calc(100% - 140px)'
                    }}>
                        {file.name}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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
                                color: 'white',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
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
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
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
                    overflowX: 'hidden',
                    flex: 1,
                    scrollBehavior: 'smooth',
                    wordBreak: 'break-word'
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

            {/* Mobile responsive styles */}
            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="maxWidth: '900px'"] {
                        max-width: 95vw !important;
                        max-height: 90vh !important;
                    }
                    h2 {
                        font-size: 16px !important;
                        max-width: calc(100% - 100px) !important;
                    }
                    button span {
                        display: none;
                    }
                }
                @media (max-width: 480px) {
                    div[style*="padding: '24px'"] {
                        padding: 16px !important;
                    }
                    div[style*="padding: '20px 24px'"] {
                        padding: 16px !important;
                    }
                }
            `}</style>
        </div>
    );
}
