import { SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
    const { userId } = await auth();

    if (userId) {
        redirect('/home');
    }

    return (
        <div className="login-container">
            <div className="login-logo">RK AI</div>
            <h1 className="login-title">Your AI-Powered School Companion</h1>
            <p className="hero-subtitle" style={{ marginBottom: '32px', maxWidth: '400px' }}>
                Manage assignments, get AI help, and stay organized
            </p>

            <div className="login-card glass-card">
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'w-full',
                            card: 'bg-transparent shadow-none p-0',
                            headerTitle: 'hidden',
                            headerSubtitle: 'hidden',
                            socialButtonsBlockButton: 'btn-primary mb-3',
                            formButtonPrimary: 'btn-primary',
                            footerAction: 'text-white',
                        },
                        variables: {
                            colorBackground: 'transparent',
                            colorText: '#ffffff',
                        }
                    }}
                    afterSignInUrl="/home"
                    afterSignUpUrl="/home"
                />
            </div>
        </div>
    );
}
