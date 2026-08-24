import React from 'react';
import { BillingFlowLogo } from '../components/BillingFlowLogo';
import { Wrench, RefreshCw, ShieldCheck } from 'lucide-react';

export const Maintenance: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <BillingFlowLogo size={44} subtext="System Status" />
      </div>

      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8'
        }}>
          <Wrench size={32} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>System Maintenance</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            BillingFlow is undergoing scheduled infrastructure optimization. Your data and billing records are secure and will be available shortly.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', marginTop: '8px' }}
        >
          <RefreshCw size={16} />
          <span>Check Status &amp; Reload</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', marginTop: '8px' }}>
          <ShieldCheck size={16} />
          <span>Database Backups &amp; Ledger Protected</span>
        </div>
      </div>
    </div>
  );
};
