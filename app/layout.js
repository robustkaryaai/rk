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
                <div className='padding-from-top'></div>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const theme = localStorage.getItem('theme');
                                    // If theme is explicitly 'dark', OR if no preference and system is dark
                                    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                        document.body.classList.add('dark');
                                    } else {
                                        // Ensure dark class is removed if theme is 'light'
                                        document.body.classList.remove('dark');
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

