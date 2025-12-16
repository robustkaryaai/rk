'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import FileViewerModal from '@/components/FileViewerModal';
import {
    AiOutlineFile,
    AiOutlineDownload,
    AiOutlineFileImage,
    AiOutlineFileText,
    AiOutlineVideoCameraAdd,
    AiOutlineDelete,
    AiOutlineEye
} from 'react-icons/ai';
import { mediaAPI } from '@/lib/api';

export default function DataPage() {
    const { user, loading } = useAuth();
    const isLoaded = !loading;
    const isSignedIn = !!user;

    const router = useRouter();
    const [fileData, setFileData] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [deviceSlug, setDeviceSlug] = useState('');
    const [viewingFile, setViewingFile] = useState(null);

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

        const fetchFiles = async () => {
            setDataLoading(true);
            try {
                const data = await mediaAPI.getFiles(slug);
                setFileData(data);
            } catch (error) {
                console.error('Error fetching files:', error);
                setFileData(null);
            } finally {
                setDataLoading(false);
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
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName; // Only works for same-origin or blob
            // For external, just opening it might be enough or fetch blob
            if (source === 'google') {
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                link.href = blobUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file. Please try again.');
        }
    };

    const handleDelete = async (fileName, fileId = null, source = 'supabase') => {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;
        try {
            const success = await mediaAPI.deleteFile(deviceSlug, fileName, fileId, source);
            if (success) {
                // Refresh logic - ideally re-fetch or filter local state
                const data = await mediaAPI.getFiles(deviceSlug);
                setFileData(data);
            } else {
                alert('Failed to delete file');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Error deleting file');
        }
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.toLowerCase().split('.').pop();
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
            return <AiOutlineFileImage size={24} className="text-pink-400" />;
        } else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
            return <AiOutlineVideoCameraAdd size={24} className="text-orange-400" />;
        } else if (['doc', 'docx', 'pdf', 'txt'].includes(ext)) {
            return <AiOutlineFileText size={24} className="text-green-500" />;
        }
        return <AiOutlineFile size={24} className="text-gray-400" />;
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
            <div className="page-container" style={{ justifyContent: 'center', height: '100vh' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <>
            <div className="page-container">
                <div className="hero-section text-left">
                    <h1 className="hero-title">Device Files</h1>
                    <p className="hero-subtitle">
                        {deviceSlug ? `Device #${deviceSlug}` : 'Your Files'}
                    </p>
                </div>

                {dataLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : fileData && fileData.folderExists && fileData.files.length > 0 ? (
                    <div className="glass-card">
                        <div className="flex flex-col gap-1">
                            {fileData.files.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="settings-item"
                                    style={{ padding: '12px 0' }}
                                >
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        <div className="settings-icon bg-transparent">
                                            {getFileIcon(file.name)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="text-sm font-medium truncate text-gray-900">{file.name}</div>
                                            <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pl-2">
                                        {/* View (Text) */}
                                        {file.name.toLowerCase().endsWith('.txt') && (
                                            <button onClick={() => setViewingFile(file)} className="p-2 text-green-500 hover:bg-green-50 rounded">
                                                <AiOutlineEye size={18} />
                                            </button>
                                        )}
                                        {/* Download */}
                                        <button onClick={() => handleDownload(file.name, file.id, file.source)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                                            <AiOutlineDownload size={18} />
                                        </button>
                                        {/* Delete */}
                                        <button onClick={() => handleDelete(file.name, file.id, file.source)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                            <AiOutlineDelete size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="glass-card text-center py-12">
                        <p className="text-gray-500">No files found.</p>
                    </div>
                )}
            </div>

            {viewingFile && (
                <FileViewerModal
                    file={viewingFile}
                    deviceSlug={deviceSlug}
                    onClose={() => setViewingFile(null)}
                    onDownload={handleDownload}
                />
            )}

            <BottomNav />
        </>
    );
}
