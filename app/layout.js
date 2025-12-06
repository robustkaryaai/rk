import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
    title: 'RK AI - Next Generation Intelligence',
    description: 'Futuristic AI-powered application',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const theme = localStorage.getItem('theme');
                                    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                        document.documentElement.classList.add('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body suppressHydrationWarning>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const theme = localStorage.getItem('theme');
                                    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                        document.body.classList.add('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
                <AuthProvider>
                    <div className="gradient-blob-1"></div>
                    <div className="gradient-blob-2"></div>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}

