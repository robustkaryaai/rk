import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const checkAuth = async () => {
    const { userId } = await auth();
    if (!userId) {
        redirect('/login');
    }
    return userId;
};

export const getAuthUser = async () => {
    const { userId } = await auth();
    return userId;
};
