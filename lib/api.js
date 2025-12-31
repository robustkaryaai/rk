import { supabase } from './supabase';
import { databases, DATABASE_ID, COLLECTIONS, Query } from './appwrite';

// ==================== Device API ====================
export const deviceAPI = {
    // Validate device slug against Appwrite
    async validateSlug(slug) {
        try {
            console.log(`[Validation] Checking slug in Appwrite: "${slug}"`);

            // Strict check: If Appwrite column is Integer, we MUST query with an Integer.
            if (!/^\d+$/.test(slug)) {
                console.log('[Validation] Slug is not numeric, skipping Appwrite query.');
                return null;
            }

            const queryValue = parseInt(slug, 10);
            console.log(`[Validation] Querying Appwrite for slug: ${queryValue} (Integer)`);

            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.DEVICES,
                [Query.equal('slug', queryValue)]
            );

            console.log(`[Validation] Appwrite response: Found ${response.documents.length} documents.`);

            if (response.documents.length > 0) {
                const device = response.documents[0];

                // Non-blocking: Try to check/create Supabase Storage folder (optional)
                const folderName = `${slug}`; // Folder name is just the slug
                console.log(`[Storage] Checking folder: ${folderName} (optional, won't block login if fails)`);

                // Don't await - make it fire-and-forget
                (async () => {
                    try {
                        const { data: files, error } = await supabase
                            .storage
                            .from('rk-ai-storage-base')
                            .list(folderName, { limit: 1 });

                        if (error) {
                            console.warn('[Storage] Could not check folder (Supabase might not be configured):', error.message || error);
                            return;
                        }

                        if (!files || files.length === 0) {
                            console.log(`[Storage] Folder ${folderName} doesn't exist. Creating...`);

                            const welcomeContent = new Blob(['Welcome to your RK AI device storage!'], { type: 'text/plain' });
                            const welcomeFile = new File([welcomeContent], 'welcome.txt', { type: 'text/plain' });

                            const { error: uploadError } = await supabase
                                .storage
                                .from('rk-ai-storage-base')
                                .upload(`${folderName}/welcome.txt`, welcomeFile);

                            if (uploadError) {
                                console.warn('[Storage] Could not create folder:', uploadError.message || uploadError);
                            } else {
                                console.log(`[Storage] Created folder: ${folderName}`);
                            }
                        } else {
                            console.log(`[Storage] Folder ${folderName} already exists.`);
                        }
                    } catch (storageError) {
                        console.warn('[Storage] Storage operation failed (non-critical):', storageError.message || storageError);
                    }
                })();

                // Return device immediately without waiting for storage
                return {
                    id: device.slug,
                    name: device.name_of_device || device.name || `Device ${device.slug}`,
                    status: device.status || 'offline',
                    lastSeen: device.$updatedAt,
                    storageUsing: device.storageUsing || 'supabase'
                };
            }
            console.warn(`[Validation] Device with slug ${queryValue} not found in Appwrite.`);
            return null;
        } catch (error) {
            console.error('[Validation] Error validating slug:', error);
            // Log the full error object for debugging
            console.error(JSON.stringify(error, null, 2));
            return null;
        }
    },

    // Send voice command to device
    async sendVoiceCommand(slug, fileBlob) {
        try {
            console.log(`[Voice Command] Sending to device: ${slug}`);

            const formData = new FormData();
            formData.append('file', fileBlob, 'voice_command.mp3'); // Filename matters for some backends

            const response = await fetch(`https://rk-ai-backend.onrender.com/voice/${slug}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[Voice Command] Failed with status ${response.status}: ${text}`);
                return false;
            }

            console.log('[Voice Command] Sent successfully! Device should play audio.');
            return true;
        } catch (error) {
            console.error('[Voice Command] Error sending command:', error);
            return false;
        }
    }
};

// ==================== Google Drive API ====================
const googleDriveAPI = {
    // Helper: Refresh access token using refresh token (via server-side API)
    async getAccessToken(refreshToken) {
        try {
            console.log('[Google Drive] Refreshing access token via API...');

            const response = await fetch('/api/google/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[Google Drive] Token refresh failed:', errorData);
                return null;
            }

            const data = await response.json();
            console.log('[Google Drive] Access token refreshed successfully');
            return data.accessToken;
        } catch (error) {
            console.error('[Google Drive] Failed to refresh Google token:', error);
            return null;
        }
    },

    // List files in Google Drive folder
    async listFiles(refreshToken, folderId) {
        try {
            console.log('[Google Drive] Listing files in folder:', folderId);
            const accessToken = await this.getAccessToken(refreshToken);
            if (!accessToken) {
                console.error('[Google Drive] No access token available');
                return [];
            }

            const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,createdTime)`;
            console.log('[Google Drive] Fetching:', url);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Google Drive] List files failed:', response.status, errorText);
                return [];
            }

            const data = await response.json();
            console.log('[Google Drive] Files found:', data.files?.length || 0);
            console.log('[Google Drive] Files:', data.files);
            return data.files || [];
        } catch (error) {
            console.error('[Google Drive] Error listing files:', error);
            return [];
        }
    },

    // Download file from Google Drive
    async downloadFile(refreshToken, fileId) {
        try {
            const accessToken = await this.getAccessToken(refreshToken);
            if (!accessToken) return null;

            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            return await response.blob();
        } catch (error) {
            console.error('Error downloading from Google Drive:', error);
            return null;
        }
    },

    // Upload file to Google Drive
    async uploadFile(refreshToken, fileName, content, folderId) {
        try {
            const accessToken = await this.getAccessToken(refreshToken);
            if (!accessToken) return null;

            const metadata = {
                name: fileName,
                parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', content);

            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: form
                }
            );

            return await response.json();
        } catch (error) {
            console.error('Error uploading to Google Drive:', error);
            return null;
        }
    },

    // Delete file from Google Drive
    async deleteFile(refreshToken, fileId) {
        try {
            const accessToken = await this.getAccessToken(refreshToken);
            if (!accessToken) return false;

            await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            return true;
        } catch (error) {
            console.error('Error deleting from Google Drive:', error);
            return false;
        }
    }
};

// ==================== Media API ====================
export const mediaAPI = {
    // Get all files from slug folder, excluding chat.txt and limit.txt
    async getFiles(slug) {
        try {
            if (!slug) {
                return {
                    slug: null,
                    folderExists: false,
                    files: []
                };
            }

            // Get device info to check storage type
            const deviceResponse = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.DEVICES,
                [Query.equal('slug', parseInt(slug, 10))]
            );

            if (deviceResponse.documents.length === 0) {
                return { slug, folderExists: false, files: [] };
            }

            const device = deviceResponse.documents[0];
            const storageType = device.storageUsing || 'supabase';

            // Route to appropriate storage
            if (storageType === 'google' && device.googleRefreshToken && device.googleFolderId) {
                // Fetch from Google Drive
                const driveFiles = await googleDriveAPI.listFiles(device.googleRefreshToken, device.googleFolderId);

                const filteredFiles = driveFiles
                    .filter(file => {
                        const fileName = file.name.toLowerCase();
                        return fileName !== 'chat.txt' && fileName !== 'limit.txt' && fileName !== 'welcome.txt';
                    })
                    .map(file => ({
                        id: file.id,
                        name: file.name,
                        size: parseInt(file.size) || 0,
                        mimeType: file.mimeType || 'application/octet-stream',
                        createdAt: file.createdTime,
                        url: null, // Google Drive files don't have direct public URLs
                        previewUrl: null,
                        source: 'google'
                    }));

                return {
                    slug,
                    folderExists: true,
                    files: filteredFiles
                };
            } else {
                // Fetch from Supabase (existing logic)
                const folderName = `${slug}`;
                console.log('[Data Files] Fetching files for slug:', slug);
                console.log('[Data Files] Folder name:', folderName);

                const { data, error } = await supabase
                    .storage
                    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
                    .list(folderName, {
                        limit: 1000,
                        sortBy: { column: 'created_at', order: 'desc' }
                    });

                console.log('[Data Files] Supabase response:', { data, error });

                if (error) {
                    console.error('Error fetching files:', error);
                    return {
                        slug,
                        folderExists: false,
                        files: []
                    };
                }

                console.log('[Data Files] Raw files:', data);

                const filteredFiles = (data || [])
                    .filter(file => {
                        const fileName = file.name.toLowerCase();
                        return fileName !== 'chat.txt' && fileName !== 'limit.txt' && fileName !== 'welcome.txt';
                    })
                    .map(file => ({
                        id: file.id || file.name,
                        name: file.name,
                        size: file.metadata?.size || 0,
                        mimeType: file.metadata?.mimetype || 'application/octet-stream',
                        createdAt: file.created_at,
                        url: supabase.storage.from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET).getPublicUrl(`${folderName}/${file.name}`).data.publicUrl,
                        previewUrl: null,
                        source: 'supabase'
                    }));

                console.log('[Data Files] Filtered files:', filteredFiles);

                return {
                    slug,
                    folderExists: true,
                    files: filteredFiles
                };
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            return {
                slug,
                folderExists: false,
                files: []
            };
        }
    },

    // Get detailed file list with metadata for display
    async getFileDetails(slug) {
        try {
            if (!slug) return [];

            const { data, error } = await supabase
                .storage
                .from('rk-ai-storage-base')
                .list(`${slug}`, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error || !data) {
                console.error('Error fetching file details:', error);
                return [];
            }

            // Transform to expected format with public URLs
            return data.map(file => ({
                id: file.id,
                name: file.name,
                size: file.metadata?.size || 0,
                mimeType: file.metadata?.mimetype || 'application/octet-stream',
                createdAt: file.created_at,
                url: supabase.storage.from('rk-ai-storage-base').getPublicUrl(`${slug}/${file.name}`).data.publicUrl,
                previewUrl: null,
                source: 'device'
            }));
        } catch (error) {
            console.error('Error fetching file details:', error);
            return [];
        }
    },

    // Get download URL
    async getDownloadUrl(slug, fileName, fileId = null, source = 'supabase') {
        try {
            // Check storage type if not provided
            if (source === 'supabase') {
                const folderName = `${slug}`;
                const filePath = `${folderName}/${fileName}`;
                const { data } = supabase
                    .storage
                    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
                    .getPublicUrl(filePath);

                return data.publicUrl;
            } else if (source === 'google' && fileId) {
                // For Google Drive, we need to download the file and create blob URL
                const deviceResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.DEVICES,
                    [Query.equal('slug', parseInt(slug, 10))]
                );

                if (deviceResponse.documents.length > 0) {
                    const device = deviceResponse.documents[0];
                    const blob = await googleDriveAPI.downloadFile(device.googleRefreshToken, fileId);
                    if (blob) {
                        return URL.createObjectURL(blob);
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting download URL:', error);
            return null;
        }
    },

    // Get chat history from chat.txt (JSON format)
    async getChatHistory(slug) {
        try {
            if (!slug) return [];

            let text = '';

            // Get device info to check storage type
            const deviceResponse = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.DEVICES,
                [Query.equal('slug', parseInt(slug, 10))]
            );

            if (deviceResponse.documents.length > 0) {
                const device = deviceResponse.documents[0];
                const storageType = device.storageUsing || 'supabase';

                if (storageType === 'google' && device.googleRefreshToken && device.googleFolderId) {
                    // Fetch from Google Drive
                    const files = await googleDriveAPI.listFiles(device.googleRefreshToken, device.googleFolderId);
                    const chatFile = files.find(f => f.name.toLowerCase() === 'chat.txt');

                    if (chatFile) {
                        const blob = await googleDriveAPI.downloadFile(device.googleRefreshToken, chatFile.id);
                        if (blob) {
                            text = await blob.text();
                        }
                    }
                } else {
                    // Fetch from Supabase
                    const folderName = `${slug}`;
                    const filePath = `${folderName}/chat.txt`;

                    const { data, error } = await supabase
                        .storage
                        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
                        .download(filePath);

                    if (!error && data) {
                        text = await data.text();
                    }
                }
            }

            if (!text) {
                console.log('No chat history found');
                return [];
            }

            const conversations = [];

            try {
                // Try parsing as JSON array first
                const jsonArray = JSON.parse(text);

                if (Array.isArray(jsonArray)) {
                    // It's a JSON array format
                    jsonArray.forEach((convo, i) => {
                        if (convo.User && convo.AI) {
                            conversations.push({
                                userMessage: convo.User,
                                aiMessage: convo.AI,
                                date: convo.Date || null,
                                time: convo.Time || null,
                                id: `convo-${i}`
                            });
                        }
                    });
                }
            } catch (arrayParseError) {
                // Not a JSON array, try line-by-line JSON objects
                const lines = text.split('\n').filter(line => line.trim());

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    try {
                        const convo = JSON.parse(line);
                        if (convo.User && convo.AI) {
                            conversations.push({
                                userMessage: convo.User,
                                aiMessage: convo.AI,
                                date: convo.Date || null,
                                time: convo.Time || null,
                                id: `convo-${i}`
                            });
                        }
                    } catch (parseError) {
                        console.warn(`[Chat History] Failed to parse line ${i}:`, parseError);
                    }
                }
            }

            // Return in reverse order (newest first)
            return conversations.reverse();
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
    },

    // Delete file (supports both Google Drive and Supabase)
    async deleteFile(slug, fileName, fileId = null, source = 'supabase') {
        try {
            console.log('[Delete File] Source:', source, 'FileName:', fileName, 'FileID:', fileId);

            if (source === 'google' && fileId) {
                // Delete from Google Drive
                const deviceResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.DEVICES,
                    [Query.equal('slug', parseInt(slug, 10))]
                );

                if (deviceResponse.documents.length > 0) {
                    const device = deviceResponse.documents[0];
                    const result = await googleDriveAPI.deleteFile(device.googleRefreshToken, fileId);
                    console.log('[Delete File] Google Drive result:', result);
                    return result !== null;
                }
                return false;
            } else {
                // Delete from Supabase
                const folderName = `${slug}`;
                const filePath = `${folderName}/${fileName}`;

                const { data, error } = await supabase
                    .storage
                    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
                    .remove([filePath]);

                if (error) {
                    console.error('[Delete File] Supabase error:', error);
                    return false;
                }

                console.log('[Delete File] Supabase success:', data);
                return true;
            }
        } catch (error) {
            console.error('[Delete File] Error:', error);
            return false;
        }
    },

};

// ==================== User API ====================
export const userAPI = {
    // Get user stats
    async getUserStats() {
        // Mock data for now - can be enhanced later
        return {
            commands: 42,
            files: 8,
            daysActive: 7
        };
    },

    // Get subscription info from Appwrite (query devices by slug)
    async getSubscription(slug) {
        try {
            console.log('[Subscription] Fetching for slug:', slug);

            // Fetch from Appwrite devices collection using slug
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.DEVICES,
                [Query.equal('slug', parseInt(slug, 10))]
            );

            console.log('[Subscription] Response:', response);

            if (response.documents && response.documents.length > 0) {
                const device = response.documents[0];
                console.log('[Subscription] Device data:', device);

                const tier = device['subscription-tier'] || 0;
                const hasSubscription = device.subscription === true || device.subscription === 'true';

                console.log('[Subscription] Tier:', tier, 'HasSubscription:', hasSubscription);
                console.log('[Subscription] Raw subscription field:', device.subscription);
                console.log('[Subscription] Raw subscription-tier field:', device['subscription-tier']);

                // Tier mapping
                const tierMap = {
                    0: { name: 'Free', storage: '500 MB', storageBytes: 524288000 },
                    1: { name: 'Student', storage: '5 GB', storageBytes: 5368709120 },
                    2: { name: 'Creator', storage: '20 GB', storageBytes: 21474836480 },
                    3: { name: 'Pro', storage: '50 GB', storageBytes: 53687091200 },
                    4: { name: 'Studio', storage: '120 GB', storageBytes: 128849018880 }
                };

                const planInfo = tierMap[tier] || tierMap[0];

                return {
                    plan: planInfo.name,
                    tier: tier,
                    hasSubscription: hasSubscription,
                    storageLimit: planInfo.storage,
                    storageLimitBytes: planInfo.storageBytes,
                    storageUsed: 0 // TODO: Calculate actual usage from Supabase
                };
            }

            // Default to Free tier if no device found
            return {
                plan: 'Free',
                tier: 0,
                hasSubscription: false,
                storageLimit: '500 MB',
                storageLimitBytes: 524288000,
                storageUsed: 0
            };
        } catch (error) {
            console.error('Error fetching subscription:', error);
            // Return default Free tier on error
            return {
                plan: 'Free',
                tier: 0,
                hasSubscription: false,
                storageLimit: '500 MB',
                storageLimitBytes: 524288000,
                storageUsed: 0
            };
        }
    },

    // Sync User to Appwrite users collection
    async syncUserToAppwrite(user, avatarUrl = '', providerAccessToken = null, providerRefreshToken = null) {
        try {
            // Determine user details
            let userId, name, email;

            if (user.$id) {
                // Appwrite User Object
                userId = user.$id;
                name = user.name;
                email = user.email;
            } else {
                // Generic/Mock Object
                userId = user.id;
                name = user.name || 'User';
                email = user.email || '';
            }

            console.log(`[User Sync] Syncing user: ${userId}, Tokens: ${providerAccessToken ? 'Yes' : 'No'}`);

            // 1. Ensure User Document Exists
            try {
                // Try to get existing doc
                await databases.getDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    userId
                );

                // Update basic info
                const updateData = {
                    name: name,
                    email: email,
                };
                if (avatarUrl) updateData.avatar = avatarUrl;

                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    userId,
                    updateData
                );
            } catch (err) {
                // Document not found - create it
                const userData = {
                    name: name,
                    email: email,
                    avatar: avatarUrl || ''
                };

                // Use the SAME ID as the Auth Account
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    userId, // Using Auth ID as Doc ID
                    userData
                );
                console.log('[User Sync] Created user in Appwrite DB:', userId);
            }

            // 2. Sync Google Tokens (Separately to avoid breaking main sync if columns miss)
            if (providerAccessToken || providerRefreshToken) {
                try {
                    const tokenUpdate = {};
                    if (providerAccessToken) tokenUpdate.googleAccessToken = providerAccessToken;
                    if (providerRefreshToken) tokenUpdate.googleRefreshToken = providerRefreshToken;

                    await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId,
                        tokenUpdate
                    );
                    console.log('[User Sync] Synced Google tokens');
                } catch (tokenErr) {
                    console.warn('[User Sync] Could not sync tokens (columns might be missing):', tokenErr.message);
                }
            }

            return true;

        } catch (error) {
            console.error('[User Sync] Critical error syncing user:', error);
            return false;
        }
    }
};
