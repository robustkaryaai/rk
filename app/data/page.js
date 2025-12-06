'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import {
    AiOutlineFile,
    AiOutlineDownload,
    AiOutlineFileImage,
    AiOutlineFileText,
    AiOutlineVideoCameraAdd,
    AiOutlineDelete
} from 'react-icons/ai';
import { mediaAPI } from '@/lib/api';

export default function DataPage() {
    const { user, loading } = useAuth();
    // Adapter
    const isLoaded = !loading;
    const isSignedIn = !!user;

    const router = useRouter();
    const [fileData, setFileData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [deviceSlug, setDeviceSlug] = useState('');
    const [files, setFiles] = useState([]);

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

        const fetchFiles = async () => {
            setDataLoading(true);
            try {
                const data = await mediaAPI.getFiles(slug);
                setFileData(data);
            } catch (error) {
                console.error('Error fetching files:', error);
                setFileData(null);
            } finally {
                setDataLoading(false); // Changed setLoading to setDataLoading
            }
        };

        if (isLoaded && isSignedIn && slug) {
            fetchFiles();
        }
    }, [isLoaded, isSignedIn, router]);

    const handleDownload = async (fileName, fileId = null, source = 'supabase') => {
        try {
            const url = await mediaAPI.getDownloadUrl(deviceSlug, fileName, fileId, source);
            if (!url) return;

            // For Google Drive, URL is already a blob URL
            if (source === 'google') {
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                // Fetch the file as a blob to bypass CORS issues
                const response = await fetch(url);
                const blob = await response.blob();

                // Create a blob URL
                const blobUrl = window.URL.createObjectURL(blob);

                // Create temporary anchor and trigger download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();

                // Cleanup
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file. Please try again.');
        }
    };

    const handleDelete = async (fileName, fileId = null, source = 'supabase') => {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return;
        }

        try {
            const success = await mediaAPI.deleteFile(deviceSlug, fileName, fileId, source);

            if (success) {
                alert('File deleted successfully');
                // Refresh file list
                const result = await mediaAPI.getFiles(deviceSlug);
                setFiles(result.files);
            } else {
                alert('Failed to delete file');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete file. Please try again.');
        }
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.toLowerCase().split('.').pop();
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
            return <AiOutlineFileImage size={24} color="#f093fb" />;
        } else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
            return <AiOutlineVideoCameraAdd size={24} color="#ff9800" />;
        } else if (['doc', 'docx', 'pdf', 'txt'].includes(ext)) {
            return <AiOutlineFileText size={24} color="#4caf50" />;
        }
        return <AiOutlineFile size={24} color="#667eea" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            <div className="page-container">
                <div className="hero-section" style={{ textAlign: 'left', marginBottom: '24px' }}>
                    <h1 className="hero-title">Device Files</h1>
                    <p className="hero-subtitle">
                        {deviceSlug ? `Files for Device #${deviceSlug}` : 'Files from your RK AI device'}
                    </p>
                </div>

                {loading ? (
                    <div className="spinner"></div>
                ) : fileData && fileData.folderExists && fileData.files.length > 0 ? (
                    <GlassCard>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {fileData.files.map((file, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        {getFileIcon(file.name)}
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                                {file.name}
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                                                {formatFileSize(file.size)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {/* Download Button */}
                                        <div
                                            onClick={() => handleDownload(file.name, file.id, file.source)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <AiOutlineDownload size={20} color="#667eea" />
                                        </div>

                                        {/* Delete Button */}
                                        <div
                                            onClick={() => handleDelete(file.name, file.id, file.source)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <AiOutlineDelete size={20} color="#ff6b6b" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                ) : (
                    <GlassCard>
                        <div className="empty-state">
                            <div className="empty-icon">📂</div>
                            <p className="empty-text">No files available yet</p>
                        </div>
                    </GlassCard>
                )}
            </div>

            <BottomNav />
        </>
    );
}
