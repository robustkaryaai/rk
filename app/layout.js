import { AuthProvider } from '@/context/AuthContext';
import { Analytics } from "@vercel/analytics/next"
import './globals.css';

export const metadata = {
    title: 'RK AI - Next Generation Intelligence',
    description: 'Futuristic AI-powered application',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <Analytics />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var html = document.documentElement;
                                    var body = document.body;
                                    window.__setTheme = function(isDark) {
                                        if (isDark) {
                                            html.classList.add('dark');
                                            body.classList.add('dark');
                                            localStorage.setItem('theme','dark');
                                        } else {
                                            html.classList.remove('dark');
                                            body.classList.remove('dark');
                                            localStorage.setItem('theme','light');
                                        }
                                    };
                                    var theme = localStorage.getItem('theme');
                                    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                                    var shouldDark = theme === 'dark' || (!theme && prefersDark);
                                    window.__setTheme(shouldDark);
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body suppressHydrationWarning>
                <div className='padding-from-top'></div>
                <AuthProvider>
                    <div className="gradient-blob-1"></div>
                    <div className="gradient-blob-2"></div>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
