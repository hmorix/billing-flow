import React from 'react';
import { SkeletonBox } from './Skeleton';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="page-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <SkeletonBox height="28px" width="160px" />
        <SkeletonBox height="40px" width="140px" borderRadius="var(--radius-md)" />
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <SkeletonBox height="40px" width="260px" borderRadius="var(--radius-md)" />
        <SkeletonBox height="40px" width="120px" borderRadius="var(--radius-md)" />
      </div>

      <div className="custom-table-container">
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
          <SkeletonBox height="14px" width="15%" />
          <SkeletonBox height="14px" width="25%" />
          <SkeletonBox height="14px" width="20%" />
          <SkeletonBox height="14px" width="15%" />
          <SkeletonBox height="14px" width="15%" />
        </div>

        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <SkeletonBox height="16px" width="15%" />
            <SkeletonBox height="16px" width="25%" />
            <SkeletonBox height="16px" width="20%" />
            <SkeletonBox height="16px" width="15%" />
            <SkeletonBox height="16px" width="15%" />
          </div>
        ))}
      </div>
    </div>
  );
};
