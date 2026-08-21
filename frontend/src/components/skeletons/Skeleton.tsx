import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-sm)',
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; gap?: string }> = ({ lines = 3, gap = '8px' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, width: '100%' }}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBox
          key={idx}
          height="14px"
          width={idx === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ height?: string }> = ({ height = '140px' }) => {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', height }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width="40%" height="16px" />
        <SkeletonBox width="32px" height="32px" borderRadius="50%" />
      </div>
      <SkeletonBox width="60%" height="28px" />
      <SkeletonBox width="30%" height="12px" />
    </div>
  );
};
