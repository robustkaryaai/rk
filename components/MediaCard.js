'use client';

import { useState } from 'react';
import GlassCard from './GlassCard';
import { AiOutlineFile, AiOutlineFileImage, AiOutlineFilePdf, AiOutlineDownload, AiOutlineEye } from 'react-icons/ai';

export default function MediaCard({ file, onView, onDownload }) {
    const [imageError, setImageError] = useState(false);

    const getFileIcon = () => {
        const mimeType = file.mimeType || file.type || '';

        if (mimeType.startsWith('image/')) {
            return <AiOutlineFileImage size={32} />;
        } else if (mimeType.includes('pdf')) {
            return <AiOutlineFilePdf size={32} />;
        } else {
            return <AiOutlineFile size={32} />;
        }
    };

    const getFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const mb = bytes / (1024 * 1024);
        if (mb < 1) {
            return `${Math.round(bytes / 1024)} KB`;
        }
        return `${mb.toFixed(2)} MB`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const isImage = file.mimeType?.startsWith('image/');

    return (
        <GlassCard className="media-card">
            <div className="media-preview">
                {isImage && !imageError ? (
                    <img
                        src={file.previewUrl || file.url}
                        alt={file.name}
                        onError={() => setImageError(true)}
                        className="media-image"
                    />
                ) : (
                    <div className="media-icon-placeholder">
                        {getFileIcon()}
                    </div>
                )}
            </div>

            <div className="media-info">
                <h4 className="media-title">{file.name || 'Untitled'}</h4>
                <p className="media-meta">
                    {getFileSize(file.sizeOriginal || file.size)} • {formatDate(file.createdAt || file.$createdAt)}
                </p>
            </div>

            <div className="media-actions">
                {onView && (
                    <button
                        className="media-action-btn"
                        onClick={() => onView(file)}
                        title="View file"
                    >
                        <AiOutlineEye size={20} />
                    </button>
                )}
                {onDownload && (
                    <button
                        className="media-action-btn"
                        onClick={() => onDownload(file)}
                        title="Download file"
                    >
                        <AiOutlineDownload size={20} />
                    </button>
                )}
            </div>
        </GlassCard>
    );
}
