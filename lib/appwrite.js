// lib/appwrite.js
import { Client, Databases, Account, ID, Query } from 'appwrite'; // ✅ Web SDK

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

// Web SDK exports
export const databases = new Databases(client);
export const account = new Account(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

export const COLLECTIONS = {
  DEVICES: 'devices',
  SETTINGS: 'settings',
  USERS: 'users',
};

export { ID, Query, client };
