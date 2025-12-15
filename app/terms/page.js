'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';

export default function TermsPage() {
    const router = useRouter();

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <div className="page-container">
                <div className="hero-section">
                    <h1 className="hero-title">📜 Terms & Conditions</h1>
                    <p className="hero-subtitle">RK AI Application</p>
                    <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>
                        By RK Innovators • Last Updated: December 5, 2024
                    </p>
                </div>

                <GlassCard style={{ marginBottom: '24px', padding: '32px' }}>
                    {/* 1. Acceptance */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            1. Acceptance of Terms
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            By accessing, downloading, installing, or using the RK AI application (&quot;App&quot;, &quot;Service&quot;, or &quot;RK&quot;),
                            you acknowledge that you have read, understood, and agree to be legally bound by these Terms & Conditions
                            (&quot;Terms&quot;), our Privacy Policy, and all applicable laws and regulations. If you do not agree with
                            any of these terms, you are prohibited from using or accessing this application.
                        </p>
                    </section>

                    {/* 2. Description of Service */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            2. Description of Service
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            RK is an AI-powered multimodal assistant developed and maintained by RK Innovators that provides the following features:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
                            <li>AI-powered text generation and conversation</li>
                            <li>Image generation powered by Google Imagen</li>
                            <li>Video generation powered by Google Veo</li>
                            <li>Document generation (DOCX, PPT) via Gemini API & Presenton AI</li>
                            <li>Voice-to-text transcription via AssemblyAI</li>
                            <li>Cloud storage via Supabase or personal Google Drive</li>
                            <li>Task automation and scheduling</li>
                            <li>Educational tools for students and teachers</li>
                        </ul>
                        <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                            <strong>Offline Mode Limitations:</strong> When offline, RK supports only limited pre-programmed
                            basic commands. AI generation, cloud synchronization, and online features are unavailable offline.
                        </p>
                    </section>

                    {/* 3. Subscription Plans */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            3. Subscription Plans & Billing
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            RK offers multiple subscription tiers with varying features and storage limits:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
                            <li><strong>Free:</strong> 500 MB storage, basic features, no video generation</li>
                            <li><strong>Student:</strong> ₹149/month, 5 GB storage, unlimited documents</li>
                            <li><strong>Creator:</strong> ₹299/month, 20 GB storage, 2 videos/month</li>
                            <li><strong>Pro:</strong> ₹599/month, 50 GB storage, 10 videos/month</li>
                            <li><strong>Studio:</strong> ₹999/month, 120 GB storage, 30 videos/month</li>
                        </ul>
                        <p style={{
                            lineHeight: '1.6', opacity: '0.9' }}>
                            All payments are processed securely via Razorpay.Subscriptions auto- renew monthly unless cancelled.
                        Refunds are subject to our refund policy and applicable laws. We reserve the right to modify pricing
                        with 30 days notice to existing subscribers.
                    </p>
                </section>

                {/* 4. AI Dependency */}
                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                        4. Third-Party AI Services & Limitations
                    </h2>
                    <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                        RK relies on the following third-party AI services:
                    </p>
                    <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
                        <li>Google Gemini API (text generation)</li>
                        <li>Google Imagen (image generation)</li>
                        <li>Google Veo (video generation)</li>
                        <li>Presenton AI (presentation generation)</li>
                        <li>AssemblyAI (speech-to-text)</li>
                    </ul>
                    <p style={{
                        lineHeight: '1.6', opacity: '0.9' }}>
                            <strong>Disclaimer:</strong> RK Innovators is NOT responsible for service interruptions, errors,
                content accuracy issues, policy changes, or pricing modifications from these third-party providers.
                We do not guarantee uninterrupted access to AI features. Quality and availability of AI-generated
                content depends entirely on these external services.
            </p>
        </section >

            {/* 5. User Responsibilities */ }
            < section style = {{ marginBottom: '32px' }
}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            5. User Responsibilities & Prohibited Uses
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            You agree that you will <strong>NOT</strong>:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
                            <li>Use RK for any illegal, harmful, fraudulent, abusive, or unethical purposes</li>
                            <li>Generate or distribute content that violates intellectual property rights</li>
                            <li>Create deepfakes, misinformation, or deceptive content</li>
                            <li>Harass, threaten, or harm others using RK-generated content</li>
                            <li>Attempt to reverse-engineer, decompile, or extract source code</li>
                            <li>Circumvent usage limits, security measures, or payment systems</li>
                            <li>Upload malware, viruses, or harmful code</li>
                            <li>Impersonate others or misrepresent your identity</li>
                            <li>Use RK to spam, phish, or conduct unauthorized marketing</li>
                            <li>Overload or disrupt our servers or networks</li>
                        </ul>
                        <p style={{ lineHeight: '1.6', opacity:'0.9' }}>
                            You are <strong>fully responsible</strong> for all content you create, generate, upload, or share 
                            using RK. You must ensure compliance with all applicable laws in your jurisdiction.
                        </p>
                    </section>

{/* 6. Voice & Data Processing */ }
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            6. Voice Processing & Data Handling
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity:'0.9', marginBottom: '12px' }}>
                            When you use voice features:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: '0.9', paddingLeft: '24px', marginBottom: '12px' }}>
                            <li>Voice recordings are securely transmitted to our servers</li>
                            <li>Audio is processed using AssemblyAI for speech-to-text conversion</li>
                            <li>Voice files are <strong>automatically deleted</strong> immediately after transcription</li>
                            <li>RK does NOT permanently store your voice recordings</li>
                            <li>Transcribed text may be retained for service improvement and support</li>
                        </ul>
                        <p style={{ lineHeight: '1.6', opacity:'0.9' }}>
                            For detailed information about data collection and usage, please review our Privacy Policy.
                        </p>
                    </section>

                    {/* 7. Data Storage */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            7. Data Storage & Cloud Integration
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            <strong>Default Storage:</strong> RK uses Supabase for secure, encrypted data storage. 
                            All files are stored according to your subscription tier limits.
                        </p>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            <strong>Google Drive Integration:</strong> You may optionally connect your personal Google Drive. 
                            When using Google Drive:
                        </p>
                        <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
                            <li>RK creates a folder named &quot;RK AI Files&quot; in your Drive</li>
                            <li>You retain full ownership and control of your data</li>
                            <li>Google Drive&apos;s terms of service and policies apply</li>
                            <li>You are responsible for managing your Drive storage and permissions</li>
                            <li>RK is not liable for data loss or unauthorized access to your Drive</li>
                        </ul>
                        <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
                            We recommend regular backups of important data regardless of storage provider.
                        </p>
                    </section >

    {/* 8. Intellectual Property */ }
    < section style = {{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            8. Intellectual Property Rights
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
                            <strong>RK App:</strong> All software, branding, logos, user interface, design elements, and 
                            proprietary technology are owned by RK Innovators and protected by intellectual property laws. 
                            You may not copy, modify, distribute, sell, or create derivative works without explicit written permission.
                        </p>
                        <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
                            <strong>Your Content:</strong> You retain ownership of content you create using RK. However, 
                            by using our service, you grant RK Innovators a limited license to process, store, and transmit 
                            your content solely for providing and improving the service. We will not use your content for 
                            training AI models or share it with third parties without your consent, except as required by law.
                        </p>
                    </section>

{/* 9. Limitation of Liability */ }
<section style={{ marginBottom: '32px' }}>
    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#ff6b6b' }}>
        9. Limitation of Liability & Disclaimers
    </h2>
    <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '12px' }}>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, RK INNOVATORS SHALL NOT BE LIABLE FOR:
    </p>
    <ul style={{ lineHeight: '1.8', opacity: 0.9, paddingLeft: '24px', marginBottom: '12px' }}>
        <li>Data loss, corruption, or unauthorized access</li>
        <li>AI-generated content inaccuracies, errors, or offensive material</li>
        <li>Service interruptions, downtime, or unavailability</li>
        <li>Third-party service failures or policy changes</li>
        <li>Misuse of generated content by users</li>
        <li>Financial losses from subscription or usage</li>
        <li>Consequential, indirect, incidental, or punitive damages</li>
    </ul>
    <p style={{
        lineHeight: '1.6', opacity: '0.9' }}>
                            RK is provided on an<strong>& quot;AS IS&quot;</strong> and < strong >& quot;AS AVAILABLE & quot;</strong > basis 
                            without warranties of any kind, express or implied.We do not guarantee error - free operation,
    accuracy of AI outputs, or fitness for a particular purpose.
                        </p >
                    </section >

    {/* 10. Account Termination */ }
    < section style = {{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            10. Account Suspension & Termination
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
                            We reserve the right to suspend, restrict, or permanently terminate your access to RK at any time, 
                            with or without notice, for violations of these Terms, suspicious activity, abuse of service, 
                            non-payment, or any other reason at our sole discretion. Upon termination, your right to use RK 
                            ceases immediately, and we may delete your data after a reasonable grace period.
                        </p>
                    </section>

{/* 11. Privacy & Security */ }
<section style={{ marginBottom: '32px' }}>
    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
        11. Privacy & Data Security
    </h2>
    <p style={{
        lineHeight: '1.6', opacity: '0.9' }}>
                            Your privacy is important to us.We implement industry- standard security measures to protect your data.
    However, no system is 100% secure. You acknowledge that you provide information at your own risk.
    Please review our Privacy Policy for detailed information about data collection, usage, and protection practices.
</p>
                    </section >

    {/* 12. Children's Privacy */ }
    < section style = {{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            12. Children&apos;s Privacy
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
                            RK is not intended for children under 13 years of age. We do not knowingly collect personal information 
                            from children under 13. If you are a parent or guardian and believe your child has provided us with 
                            personal information, please contact us immediately.
                        </p>
                    </section>

                    {/* 13. Modifications */}
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            13. Changes to Terms & Service
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
                            We reserve the right to modify these Terms at any time. Material changes will be notified via email 
                            or in-app notification. Continued use of RK after changes constitutes acceptance of revised terms. 
                            We may also modify, suspend, or discontinue any feature or the entire service at any time without liability.
                        </p>
                    </section >

    {/* 14. Governing Law */ }
    < section style = {{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            14. Governing Law & Dispute Resolution
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: '0.9' }}>
                            These Terms shall be governed by and construed in accordance with the laws of India, without regard 
                            to conflict of law principles. Any disputes arising from these Terms or use of RK shall be resolved 
                            through binding arbitration in accordance with Indian Arbitration and Conciliation Act, 1996.
                        </p>
                    </section>

                    {/* 15. Contact */}
                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#667eea' }}>
                            15. Contact Information
                        </h2>
                        <p style={{ lineHeight: '1.6', opacity: 0.9, marginBottom: '8px' }}>
                            For questions, support, or legal inquiries regarding these Terms:
                        </p>
                        <p style={{ lineHeight: '1.6', opacity: '0.9', fontWeight: '500' }}>
                            <strong>RK Innovators</strong><br />
                            Email: support@rkinnovators.com<br />
                            Website: www.rkinnovators.com
                        </p>
                    </section >
                </GlassCard >

    {/* Back Button */ }
    < button
onClick = {() => router.back()}
className = "btn-ghost"
style = {{ width: '100%', marginBottom: '80px' }}
                >
                    ← Back to Settings
                </button >
            </div >
    <BottomNav />
        </>
    );
}
