'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import {
    AiOutlineMail,
    AiOutlineUser,
    AiOutlineCalendar,
    AiOutlineGoogle,
    AiOutlineCloud,
    AiOutlineRocket,
    AiOutlineCheckCircle,
    AiOutlineEdit,
    AiOutlineReload,
    AiOutlineClose,
    AiOutlineUpload,
    AiOutlineLock,
    AiOutlineSave,
    AiOutlineLogout
} from 'react-icons/ai';
import { userAPI, deviceAPI, mediaAPI } from '@/lib/api';

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ commands: 0, files: 0, daysActive: 1 });
    // Default subscription state
    const [subscription, setSubscription] = useState({ plan: 'Free', storageLimit: '500 MB', tier: 0 });

    // Storage & Device State
    const [deviceSlug, setDeviceSlug] = useState('');
    const [storageUsing, setStorageUsing] = useState('supabase');
    const [storageUsed, setStorageUsed] = useState(0);
    const [numericLimit, setNumericLimit] = useState(500 * 1024 * 1024); // Default 500MB in bytes

    // Avatar Editor State
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [avatarSeed, setAvatarSeed] = useState('');
    const [avatarStyle, setAvatarStyle] = useState('adventurer'); // adventurer, bottts, fun-emoji, lorelei
    const [savingAvatar, setSavingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Profile Edit State
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        // Require device connection
        const slug = localStorage.getItem('rk_device_slug');
        if (!loading && user && !slug) {
            router.push('/connect');
            return;
        }

        setDeviceSlug(slug);

        // Fetch user stats, subscription, and device info
        const fetchData = async () => {
            try {
                // Pre-fill profile form data
                if (user) {
                    const names = (user.name || '').split(' ');
                    setFirstName(names[0] || '');
                    setLastName(names.slice(1).join(' ') || '');
                    // setDob(user.unsafeMetadata?.dob || ''); // Appwrite prefs needed for this
                }

                // 1. User Stats
                const userData = await userAPI.getUserStats();
                setStats(userData);

                // 2. Sync Clerk user to Appwrite (Renamed/Adapted)
                if (user) {
                    // Adapted for Appwrite User object
                    const userForSync = {
                        id: user.$id,
                        fullName: user.name,
                        primaryEmailAddress: { emailAddress: user.email },
                        imageUrl: '' // TODO: Fetch from prefs or collection
                    };
                    userAPI.syncUserToAppwrite(userForSync).catch(err =>
                        console.warn('User sync failed:', err)
                    );
                }

                // 3. Fetch Device Info (for Storage Status)
                if (slug) {
                    const device = await deviceAPI.validateSlug(slug);

                    // Sync storage provider
                    if (device && device.storageUsing) {
                        setStorageUsing(device.storageUsing);

                        // Update limit based on provider
                        if (device.storageUsing === 'google') {
                            setNumericLimit(15 * 1024 * 1024 * 1024); // 15 GB
                        }
                    }

                    // 4. Fetch Subscription
                    const subData = await userAPI.getSubscription(slug);
                    setSubscription(subData);

                    // 5. Fetch Actual Usage
                    // We can reuse mediaAPI.getFiles to sum up size, similar to Settings page
                    const filesData = await mediaAPI.getFiles(slug);
                    if (filesData && filesData.files) {
                        const totalSize = filesData.files.reduce((sum, file) => sum + (file.size || 0), 0);
                        setStorageUsed(totalSize);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        if (!loading && user && slug) {
            fetchData();
        }
    }, [loading, router, user]);

    // Format bytes to human readable
    const formatBytes = (bytes, decimals = 1) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getUserName = () => user?.name || 'User';
    const getUserEmail = () => user?.email || 'No email';
    const getJoinDate = () => user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Recently';

    // Helper to format DOB nicely
    const getFormattedDob = () => {
        // if (user.unsafeMetadata?.dob) {
        //     return new Date(user.unsafeMetadata.dob).toLocaleDateString('en-US', {
        //         year: 'numeric', month: 'long', day: 'numeric'
        //     });
        // }
        return 'Not set';
    };

    const handleLinkDrive = () => {
        // Redirect to Google OAuth connect route
        // We pass the slug so it knows which device to link
        window.location.href = `/api/auth/google/connect?slug=${deviceSlug}`;
    };

    // --- Avatar Editor Logic ---
    const generateRandomAvatar = () => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    };

    const getAvatarUrl = (style, seed) => {
        // Using DiceBear API
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
    };

    const handleSaveAvatar = async () => {
        setSavingAvatar(true);
        try {
            // Appwrite Avatar update logic would go here
            // account.updatePrefs({ avatar: url }) etc.
            alert('Avatar update not fully implemented in migration yet.');
            setShowAvatarModal(false);
        } catch (error) {
            console.error('Failed to update avatar:', error);
            alert('Failed to update profile picture. Please try again.');
        } finally {
            setSavingAvatar(false);
        }
    };

    const handleFileUpload = async (e) => {
        // File upload logic
    };

    // --- Profile Update Logic ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            // Appwrite update name
            // await account.updateName(`${firstName} ${lastName}`);
            // Prefs for other data
            alert('Profile update not fully implemented in migration yet.');

            setShowEditProfileModal(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage('');

        if (!newPassword) {
            setPasswordMessage('Please enter a new password');
            return;
        }

        setChangingPassword(true);
        try {
            // await account.updatePassword(newPassword, currentPassword);
            setPasswordMessage('✅ Password updated successfully (Mock)');
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            console.error('Failed to update password:', error);
            setPasswordMessage(`❌ ${error.message || 'Failed to update password'}`);
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="login-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <div className="page-container">
                <div className="profile-header">
                    {/* Logout Button */}
                    <div style={{ position: 'absolute', top: 20, right: 20 }}>
                        <button
                            onClick={logout}
                            className="btn-ghost"
                            style={{
                                background: 'rgba(255, 50, 50, 0.1)',
                                border: '1px solid rgba(255, 50, 50, 0.2)',
                                color: '#ff6b6b',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <AiOutlineLogout /> Sign Out
                        </button>
                    </div>

                    <div className="profile-avatar" style={{ position: 'relative' }}>
                        {/* user.imageUrl placeholder or check if we loaded it */}
                        {false ? (
                            <img src={""} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            getInitials(getUserName())
                        )}

                        {/* Edit Button Overlay */}
                        <div
                            onClick={() => {
                                generateRandomAvatar();
                                setShowAvatarModal(true);
                            }}
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                background: '#667eea',
                                color: 'white',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            <AiOutlineEdit size={16} />
                        </div>
                    </div>
                    <h1 className="profile-name">{getUserName()}</h1>
                    <p className="profile-email">{getUserEmail()}</p>
                    <div
                        className="plan-badge"
                        style={{
                            background: subscription.tier === 0 ? 'rgba(255,255,255,0.1)' :
                                subscription.tier === 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                                    subscription.tier === 2 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                                        subscription.tier === 3 ? 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' :
                                            'linear-gradient(135deg, #ff6bcb 0%, #f59e0b 25%, #10b981 50%, #3b82f6 75%, #8b5cf6 100%)',
                            boxShadow: subscription.tier >= 3 ? '0 4px 20px rgba(139, 92, 246, 0.4)' : 'none',
                            fontWeight: '600',
                            cursor: 'default'
                        }}
                    >
                        {subscription.plan} Plan
                    </div>
                </div>

                {/* Subscription & Storage */}
                <GlassCard style={{ marginBottom: '24px' }}>
                    <h2 className="section-title">Subscription & Storage</h2>

                    <div className="info-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AiOutlineRocket size={24} color="#667eea" />
                            <div className="info-label">Current Plan</div>
                        </div>
                        <div className="info-value">{subscription.plan}</div>
                    </div>

                    <div className="info-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AiOutlineCloud size={24} color="#667eea" />
                            <div className="info-label">Cloud Storage</div>
                        </div>
                        <div className="info-value">
                            {formatBytes(storageUsed)} / {storageUsing === 'google' ? '15 GB' : subscription.storageLimit}
                        </div>
                    </div>

                    <div className="info-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AiOutlineGoogle size={24} color={storageUsing === 'google' ? "#4caf50" : "#999"} />
                            <div className="info-label">Google Drive</div>
                        </div>
                        <div className="info-value">
                            {storageUsing === 'google' ? (
                                <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AiOutlineCheckCircle /> Linked
                                </span>
                            ) : (
                                <button className="btn-ghost" onClick={handleLinkDrive} style={{ padding: '4px 12px', fontSize: '12px' }}>
                                    Link Account
                                </button>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Account Info */}
                <GlassCard style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Account Information</h2>
                        <button
                            className="btn-ghost"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                            onClick={() => setShowEditProfileModal(true)}
                        >
                            <AiOutlineEdit style={{ marginRight: '4px' }} /> Edit
                        </button>
                    </div>

                    <div className="info-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AiOutlineUser size={24} />
                            <div className="info-label">Full Name</div>
                        </div>
                        <div className="info-value">{getUserName()}</div>
                    </div>

                    <div className="info-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AiOutlineMail size={24} />
                            <div className="info-label">Email</div>
                        </div>
                        <div className="info-value">{getUserEmail()}</div>
                    </div>

                    <div className="info-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AiOutlineCalendar size={24} />
                            <div className="info-label">Date of Birth</div>
                        </div>
                        <div className="info-value">{getFormattedDob()}</div>
                    </div>

                    <div className="info-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AiOutlineCalendar size={24} />
                            <div className="info-label">Member Since</div>
                        </div>
                        <div className="info-value">{getJoinDate()}</div>
                    </div>
                </GlassCard>

                {/* Usage Stats */}
                <GlassCard>
                    <h2 className="section-title">Usage Statistics</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '16px' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.commands}</div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>AI Commands</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.files}</div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Files Stored</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.daysActive}</div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Days Active</div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <BottomNav />

            {/* Avatar Editor Modal */}
            {showAvatarModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <GlassCard style={{ width: '100%', maxWidth: '350px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Edit Profile Picture</h3>
                            <button onClick={() => setShowAvatarModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <AiOutlineClose size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            {/* Avatar Preview */}
                            <div style={{
                                width: '120px', height: '120px', margin: '0 auto 20px',
                                borderRadius: '50%', overflow: 'hidden',
                                border: '4px solid rgba(255,255,255,0.1)', background: '#f0f0f0'
                            }}>
                                <img
                                    src={getAvatarUrl(avatarStyle, avatarSeed)}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileUpload}
                            />

                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="btn-ghost"
                                style={{ width: '100%', marginBottom: '20px', justifyContent: 'center' }}
                            >
                                <AiOutlineUpload style={{ marginRight: '8px' }} />
                                Upload from Device
                            </button>

                            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0 20px 0' }}></div>

                            {/* Style Selector */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', textAlign: 'left', marginBottom: '8px', fontSize: '14px', opacity: 0.8 }}>Or Generate Avatar</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                    {['adventurer', 'bottts', 'lorelei', 'fun-emoji', 'avataaars'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setAvatarStyle(style)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                border: '1px solid ' + (avatarStyle === style ? '#667eea' : 'rgba(255,255,255,0.2)'),
                                                background: avatarStyle === style ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                                                color: 'white',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={generateRandomAvatar}
                                    className="btn-ghost"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    <AiOutlineReload style={{ marginRight: '6px' }} />
                                    Randomize
                                </button>
                                <button
                                    onClick={handleSaveAvatar}
                                    className="btn-primary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={savingAvatar}
                                >
                                    {savingAvatar ? 'Saving...' : 'Save Avatar'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Profile Edit Modal */}
            {showEditProfileModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <GlassCard style={{ width: '100%', maxWidth: '400px', padding: '0', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Edit Profile</h3>
                            <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <AiOutlineClose size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        className="ai-command-input"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        className="ai-command-input"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="ai-command-input"
                                        value={dob}
                                        onChange={e => setDob(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                                    />
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '32px' }} disabled={savingProfile}>
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AiOutlineLock /> Change Password
                                </h4>

                                <form onSubmit={handleChangePassword}>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label className="form-label">Current Password</label>
                                        <input
                                            type="password"
                                            className="ai-command-input"
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            placeholder="Required"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label className="form-label">New Password</label>
                                        <input
                                            type="password"
                                            className="ai-command-input"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                    </div>

                                    {passwordMessage && (
                                        <div style={{
                                            marginBottom: '16px',
                                            fontSize: '13px',
                                            color: passwordMessage.startsWith('✅') ? '#4caf50' : '#ff6b6b'
                                        }}>
                                            {passwordMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn-ghost"
                                        style={{ width: '100%', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}
                                        disabled={changingPassword || !newPassword}
                                    >
                                        {changingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </>
    );
}
