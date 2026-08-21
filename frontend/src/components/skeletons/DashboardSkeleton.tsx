import React from 'react';
import { SkeletonBox, SkeletonCard } from './Skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="page-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome & Actions Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '220px' }}>
          <SkeletonBox height="24px" width="180px" />
          <SkeletonBox height="14px" width="140px" />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <SkeletonBox height="40px" width="130px" borderRadius="var(--radius-md)" />
          <SkeletonBox height="40px" width="150px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* 4 Responsive Stat Cards */}
      <div className="responsive-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <SkeletonCard height="130px" />
        <SkeletonCard height="130px" />
        <SkeletonCard height="130px" />
        <SkeletonCard height="130px" />
      </div>

      {/* Analytics Chart Skeleton */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox height="20px" width="160px" />
          <SkeletonBox height="14px" width="100px" />
        </div>
        <SkeletonBox height="240px" width="100%" borderRadius="var(--radius-md)" />
      </div>

      {/* Recent Invoices Skeleton */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SkeletonBox height="20px" width="180px" />
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <SkeletonBox width="36px" height="36px" borderRadius="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonBox width="140px" height="14px" />
                <SkeletonBox width="90px" height="10px" />
              </div>
            </div>
            <SkeletonBox width="80px" height="18px" />
          </div>
        ))}
      </div>
    </div>
  );
};
