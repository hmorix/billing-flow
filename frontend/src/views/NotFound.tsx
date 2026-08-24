import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BillingFlowLogo } from '../components/BillingFlowLogo';
import { Home, FileSpreadsheet, Users, FileText, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

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
        <BillingFlowLogo size={44} subtext="Enterprise SaaS" />
      </div>

      <div style={{
        maxWidth: '540px',
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
          fontSize: '4.5rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1
        }}>
          404
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Page Not Found</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The page or invoice link you requested may have moved or does not exist. You can return safely to your dashboard.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Home size={18} />
            <span>Go to Dashboard</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>

        <div style={{
          width: '100%',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Navigation Links
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <Link to="/invoices" style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileSpreadsheet size={15} /> Invoices
            </Link>
            <Link to="/clients" style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={15} /> Clients
            </Link>
            <Link to="/agreements" style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={15} /> Agreements
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
