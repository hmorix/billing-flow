import React from 'react';
import { SkeletonBox, SkeletonText } from './Skeleton';

export const AgreementSkeleton: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '300px' }}>
          <SkeletonBox width="220px" height="28px" />
          <SkeletonBox width="180px" height="14px" />
        </div>
        <SkeletonBox width="140px" height="40px" borderRadius="10px" />
      </div>

      {/* Stamp paper preview skeleton */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '80px', background: 'var(--bg-tertiary)', borderRadius: '8px' }} className="pulse-glow" />
        <SkeletonText lines={4} gap="12px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
          <SkeletonBox height="100px" borderRadius="10px" />
          <SkeletonBox height="100px" borderRadius="10px" />
        </div>
        <SkeletonText lines={6} gap="10px" />
      </div>
    </div>
  );
};
