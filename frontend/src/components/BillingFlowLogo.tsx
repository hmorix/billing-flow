import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textVariant?: 'light' | 'dark' | 'auto';
  subtext?: string;
}

export const BillingFlowLogo: React.FC<LogoProps> = ({
  size = 36,
  showText = true,
  textVariant = 'auto',
  subtext = 'Enterprise Billing'
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: `${Math.max(8, size * 0.28)}px`, userSelect: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))' }}
      >
        <defs>
          <linearGradient id="bf-lgrad-1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="bf-lgrad-2" x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Outer Shield Frame */}
        <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#bf-lgrad-1)" />

        {/* Precision Geometric Financial Monogram */}
        <path
          d="M 11 11 L 23 11 C 27.5 11, 27.5 18, 23 18 L 17 18 L 24 28 L 18.5 28 L 13 19 L 16 19 C 21 19, 21 14, 16 14 L 11 14 Z"
          fill="#ffffff"
          opacity="0.96"
        />
        <path
          d="M 22 9 C 28.5 9, 30 15, 25 20 C 31 25, 26 31, 19 31 L 11 31 L 11 26 L 19 26 C 22.5 26, 24 23, 21 20 C 25 17, 23.5 13, 19 13 L 16 13 L 16 9 Z"
          fill="url(#bf-lgrad-2)"
          opacity="0.35"
        />
        {/* Status indicator node */}
        <circle cx="28.5" cy="11.5" r="2.5" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontSize: `${Math.max(14, size * 0.52)}px`,
                fontWeight: 800,
                fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif",
                letterSpacing: '-0.035em',
                color: textVariant === 'dark' ? '#0f172a' : textVariant === 'light' ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              Billing
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800
                }}
              >
                Flow
              </span>
            </span>
          </div>
          {subtext && (
            <span
              style={{
                fontSize: `${Math.max(9, size * 0.26)}px`,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                opacity: 0.8,
                marginTop: '2px'
              }}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
