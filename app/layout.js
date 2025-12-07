import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
    title: 'RK AI - Next Generation Intelligence',
    description: 'Futuristic AI-powered application',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AuthProvider>
                    <div className="gradient-blob-1"></div>
                    <div className="gradient-blob-2"></div>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}

