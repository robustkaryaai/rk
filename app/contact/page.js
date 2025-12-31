'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import { AiOutlineUser, AiOutlineMail, AiOutlineBug, AiOutlineMessage, AiOutlineArrowLeft } from 'react-icons/ai';

export default function ContactPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { databases, DATABASE_ID, COLLECTIONS, ID } = await import('@/lib/appwrite');

            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.CONTACT,
                ID.unique(),
                {
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    createdAt: new Date().toISOString()
                }
            );

            alert('✅ Thank you! Your message has been sent. We\'ll get back to you soon.');
            router.back();
        } catch (error) {
            console.error('Contact form submission failed:', error);
            alert('❌ Failed to send message. Please try again or email support@robustkaryaai.com');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="page-container">
                <div className="hero-section">
                    <h1 className="hero-title">📧 Contact Us</h1>
                    <p className="hero-subtitle">Report bugs or get in touch with us</p>
                    <button
                        onClick={() => router.back()}
                        className="btn-ghost"
                        style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <AiOutlineArrowLeft /> Back
                    </button>
                </div>

                <GlassCard>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineUser /> Your Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="ai-command-input"
                                placeholder="John Doe"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineMail /> Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="ai-command-input"
                                placeholder="john@example.com"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </div>

                        {/* Subject */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineBug /> Subject *
                            </label>
                            <input
                                type="text"
                                name="subject"
                                required
                                value={formData.subject}
                                onChange={handleChange}
                                className="ai-command-input"
                                placeholder="e.g., Bug Report, Feature Request, General Inquiry"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px'
                                }}
                            />
                        </div>

                        {/* Message */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AiOutlineMessage /> Your Message *
                            </label>
                            <textarea
                                name="message"
                                required
                                value={formData.message}
                                onChange={handleChange}
                                className="ai-command-input"
                                rows={6}
                                placeholder="Please provide as much detail as possible..."
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn-ghost"
                                style={{ flex: 1 }}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ flex: 2 }}
                                disabled={submitting}
                            >
                                {submitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </GlassCard>
            </div>

            <BottomNav />
        </>
    );
}
