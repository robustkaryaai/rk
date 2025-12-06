import { Client, Databases, Account, ID, Query } from 'appwrite';

// Initialize Appwrite client for device validation
const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const databases = new Databases(client);
export const account = new Account(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

export const COLLECTIONS = {
    DEVICES: 'devices',
    SETTINGS: 'settings',  // User subscription and settings
    USERS: 'users'
};

export { ID, Query, client };
