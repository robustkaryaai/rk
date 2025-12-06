import { account } from './appwrite';

export const checkAuth = async () => {
    try {
        const user = await account.get();
        return user.$id;
    } catch (error) {
        // If server-side, we might not be able to easy check without cookie forwarding
        // For Client Components, this works.
        // For now, return null if failed
        return null;
    }
};

export const getAuthUser = async () => {
    try {
        const user = await account.get();
        return user;
    } catch (error) {
        return null;
    }
};
