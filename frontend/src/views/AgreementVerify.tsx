import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, FileText, Download, CheckCircle2,
  MapPin, Clock, Building, User, ArrowLeft, ExternalLink
} from 'lucide-react';
import { BillingFlowLogo } from '../components/BillingFlowLogo';
import { formatCurrency, type SupportedCurrency } from '../utils/i18n';

export const AgreementVerify: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAgreement = async () => {
      if (!hash) return;
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/api/agreements/verify/${hash}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || 'Agreement verification failed or document was altered.');
        }
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to verify agreement hash.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAgreement();
  }, [hash]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, rgba(99,102,241,0.08) 0%, transparent 50%), var(--bg-primary)',
      padding: '32px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px'
    }}>
      
      {/* Header Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BillingFlowLogo size={36} subtext="HMorix Legal &amp; FinTech Verification Portal" />
      </div>

      <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '640px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Verifying Cryptographic SHA-256 Digital Signature...
            </span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '30px 10px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(225,29,72,0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>Verification Failed</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                {error}
              </p>
            </div>
            <code style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              Hash: {hash}
            </code>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Return to Home
            </button>
          </div>
        ) : data?.agreement && (
          <>
            {/* Authenticity Badge */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.06))',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={28} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  ✓ Cryptographically Certified &amp; Authenticated
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Under HMorix Digital Legal Framework • Non-Repudiable Digital Footprint
                </p>
              </div>
            </div>

            {/* Document Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Agreement Identifier</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', fontFamily: 'monospace' }}>{data.agreement.agreementNumber}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Document Title</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{data.agreement.title}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Contract Type</span>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{data.agreement.agreementType}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>First Party (Provider)</span>
                <strong style={{ fontSize: '0.85rem' }}>{data.agreement.firstParty}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Second Party (Client)</span>
                <strong style={{ fontSize: '0.85rem' }}>{data.agreement.secondParty}</strong>
              </div>

              {data.agreement.totalAmount ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Commercial Value</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--success)' }}>
                    {formatCurrency(data.agreement.totalAmount, (data.agreement.currency || 'INR') as SupportedCurrency)}
                  </strong>
                </div>
              ) : null}

              {data.agreement.stateJurisdiction && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Jurisdiction &amp; e-Stamp Duty</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    {data.agreement.stateJurisdiction} • ₹{data.agreement.stampDutyAmount || 100}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Execution Date</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {new Date(data.agreement.executedAt).toUTCString()}
                </span>
              </div>

              {data.agreement.geoAddress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--primary)" /> GPS Geolocation Capture Stamp
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {data.agreement.geoAddress}
                  </span>
                </div>
              )}
            </div>

            {/* Cryptographic SHA-256 Seal */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SHA-256 Digital Fingerprint
              </div>
              <code style={{ fontSize: '0.72rem', color: 'var(--primary)', wordBreak: 'break-all', display: 'block', marginTop: '4px' }}>
                {data.agreement.digitalHash}
              </code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                Home
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/agreements/new')}>
                Create Your Own Agreement
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
