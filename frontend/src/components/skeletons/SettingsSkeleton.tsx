import React from 'react';
import { SkeletonBox } from './Skeleton';

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="page-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SkeletonBox height="28px" width="180px" />

      <div className="tab-bar">
        <SkeletonBox height="36px" width="110px" borderRadius="var(--radius-md)" />
        <SkeletonBox height="36px" width="110px" borderRadius="var(--radius-md)" />
        <SkeletonBox height="36px" width="110px" borderRadius="var(--radius-md)" />
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonBox height="22px" width="150px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <SkeletonBox height="44px" width="100%" borderRadius="var(--radius-md)" />
          <SkeletonBox height="44px" width="100%" borderRadius="var(--radius-md)" />
        </div>
        <SkeletonBox height="44px" width="100%" borderRadius="var(--radius-md)" />
        <SkeletonBox height="44px" width="140px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
};
