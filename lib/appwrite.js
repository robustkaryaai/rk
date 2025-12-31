import { Client, Databases, Account, ID, Query } from 'appwrite';

export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

export const COLLECTIONS = {
  DEVICES: 'devices',
  MEDIA: 'media',
  OAUTH_SESSIONS: 'oauth_sessions',
  TIERSONLYCONTACT: 'tiersonlycontact',
  CONTACT: 'contact'
};

export { ID, Query, client };
