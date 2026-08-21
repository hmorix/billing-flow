import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ isOpen, onClose }) => {
  const { user, verifyEmail, sendVerificationCode } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isSuccess = await verifyEmail(code.trim());
      if (isSuccess) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setSuccessMsg('Email verified successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await sendVerificationCode();
      setSuccessMsg('Verification code sent! Check your inbox.');
      if (res.code) {
        setDemoCodeHint(res.code);
        setCode(res.code);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box fade-in" style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Mail size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Verify Your Email</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '340px' }}>
            We've sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ fontSize: '0.8rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ fontSize: '0.8rem' }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {demoCodeHint && (
          <div className="alert alert-info" style={{ fontSize: '0.78rem', gap: '6px' }}>
            <span>Verification Code generated: <strong style={{ letterSpacing: '0.1em' }}>{demoCodeHint}</strong></span>
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ textAlign: 'center' }}>
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 849201"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                fontSize: '1.4rem',
                letterSpacing: '0.3em',
                textAlign: 'center',
                fontWeight: 700,
                padding: '12px'
              }}
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px' }} />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Account</span>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Didn't receive a code?</span>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={12} className={resending ? 'spinner' : ''} />
            <span>Resend Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
