'use client';

import GlassCard from './GlassCard';

export default function FeatureCard({ icon, title, description, onClick, badge }) {
    return (
        <GlassCard
            className="action-card"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {badge && (
                <div className="feature-badge">{badge}</div>
            )}
            <div className="action-icon">
                {icon}
            </div>
            <h3 className="action-title">{title}</h3>
            <p className="action-description">{description}</p>
        </GlassCard>
    );
}
