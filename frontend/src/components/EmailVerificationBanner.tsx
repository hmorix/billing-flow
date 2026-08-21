import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmailVerificationModal } from './EmailVerificationModal';

export const EmailVerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user || user.isVerified) return null;

  return (
    <>
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.15))',
          borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          zIndex: 90
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span>
            <strong>Account Unverified:</strong> Please verify your email (<code>{user.email}</code>) to unlock full system capabilities.
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-warning"
          style={{
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldCheck size={14} />
          <span>Verify Email Now</span>
        </button>
      </div>

      <EmailVerificationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
