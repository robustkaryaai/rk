'use client';

import { useState } from 'react';
import { AiOutlineSend, AiOutlineLoading3Quarters } from 'react-icons/ai';

export default function AICommandInput({ onSubmit, placeholder, type = 'text' }) {
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!command.trim() || loading) return;

        setLoading(true);
        setError(null);

        try {
            await onSubmit(command, type);
            setCommand(''); // Clear input on success
        } catch (err) {
            setError(err.message || 'Failed to process command');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-command-container">
            <form onSubmit={handleSubmit} className="ai-command-form">
                <div className="ai-input-wrapper">
                    <input
                        type="text"
                        className="ai-command-input"
                        placeholder={placeholder || 'Ask AI anything...'}
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="ai-submit-btn"
                        disabled={loading || !command.trim()}
                    >
                        {loading ? (
                            <AiOutlineLoading3Quarters className="spinning" size={20} />
                        ) : (
                            <AiOutlineSend size={20} />
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="ai-error-message">
                    {error}
                </div>
            )}
        </div>
    );
}
