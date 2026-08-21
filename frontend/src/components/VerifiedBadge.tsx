import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'sm', showText = true }) => {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;

  return (
    <span
      className="verified-badge"
      title="Email Verified Account"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: '#3b82f6',
        background: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        padding: size === 'sm' ? '2px 7px' : '4px 10px',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
        fontWeight: 600,
        letterSpacing: '0.01em'
      }}
    >
      <CheckCircle2 size={iconSize} color="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />
      {showText && <span>Verified</span>}
    </span>
  );
};
