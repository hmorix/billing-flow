import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, Mail, ShieldAlert, CheckCircle2, Upload, FileImage, KeyRound, Check, User as UserIcon, Palette, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { VerifiedBadge } from '../components/VerifiedBadge';

const EMAIL_TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    desc: 'Clean blue corporate style',
    preview: { bg: 'linear-gradient(135deg,#1e40af,#3b82f6)', accent: '#1e40af', text: '#374151', badge: '#dbeafe' },
  },
  {
    id: 'modern_dark',
    name: 'Modern Dark',
    desc: 'Premium dark mode with violet',
    preview: { bg: 'linear-gradient(135deg,#1e293b,#0f172a)', accent: '#a78bfa', text: '#cbd5e1', badge: '#1e293b' },
  },
  {
    id: 'vibrant_purple',
    name: 'Vibrant Purple',
    desc: 'Bold gradient purple',
    preview: { bg: 'linear-gradient(135deg,#7c3aed,#a855f7)', accent: '#f3e8ff', text: 'rgba(255,255,255,0.8)', badge: 'rgba(255,255,255,0.15)' },
  },
  {
    id: 'ocean_wave',
    name: 'Ocean Wave',
    desc: 'Coastal teal & cyan',
    preview: { bg: 'linear-gradient(135deg,#0891b2,#22d3ee)', accent: '#ecfeff', text: '#0e7490', badge: '#a5f3fc' },
  },
  {
    id: 'corporate_red',
    name: 'Corporate Red',
    desc: 'Bold authoritative red',
    preview: { bg: 'linear-gradient(135deg,#991b1b,#dc2626)', accent: '#fef2f2', text: '#374151', badge: '#fee2e2' },
  },
  {
    id: 'emerald_green',
    name: 'Emerald Green',
    desc: 'Fresh growth green',
    preview: { bg: 'linear-gradient(135deg,#059669,#34d399)', accent: '#f0fdf4', text: '#065f46', badge: '#d1fae5' },
  },
  {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    desc: 'Warm amber gradient',
    preview: { bg: 'linear-gradient(135deg,#ea580c,#fbbf24)', accent: '#fff7ed', text: '#78350f', badge: '#fed7aa' },
  },
  {
    id: 'midnight_blue',
    name: 'Midnight Blue',
    desc: 'Deep navy sophisticated',
    preview: { bg: 'linear-gradient(135deg,#0a1540,#1d4ed8)', accent: '#e0e7ff', text: '#c7d2fe', badge: '#1e3a8a' },
  },
  {
    id: 'rose_gold',
    name: 'Rose Gold',
    desc: 'Elegant pink & gold',
    preview: { bg: 'linear-gradient(135deg,#be185d,#c026d3)', accent: '#fff1f2', text: '#9d174d', badge: '#fecdd3' },
  },
  {
    id: 'forest_sage',
    name: 'Forest Sage',
    desc: 'Earthy olive & green',
    preview: { bg: 'linear-gradient(135deg,#14532d,#166534)', accent: '#f0fdf4', text: '#166534', badge: '#bbf7d0' },
  },
  {
    id: 'neon_cyber',
    name: 'Neon Cyber',
    desc: 'Dark cyberpunk neon',
    preview: { bg: 'linear-gradient(135deg,#000000,#0d0d0d)', accent: '#00ff88', text: '#00ff88', badge: '#001a0a' },
  },
  {
    id: 'golden_luxury',
    name: 'Golden Luxury',
    desc: 'Prestige gold & black',
    preview: { bg: 'linear-gradient(135deg,#1a1200,#2d1f00)', accent: '#d4af37', text: '#d4af37', badge: '#2d1f00' },
  },
];


const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const Settings: React.FC = () => {
  const { user, apiFetch, organization, updateOrganization } = useAuth();

  // Profile Form States
  const [companyName, setCompanyName] = useState(organization?.name || '');
  const [address, setAddress] = useState(organization?.address || '');
  const [taxId, setTaxId] = useState(organization?.taxId || '');
  const [phone, setPhone] = useState(organization?.phone || '');
  const [paymentQrLink, setPaymentQrLink] = useState(organization?.paymentQrLink || '');

  // Bank & Payment Details
  const [bankName, setBankName] = useState(organization?.bankName || '');
  const [bankAccountNo, setBankAccountNo] = useState(organization?.bankAccountNo || '');
  const [bankIfsc, setBankIfsc] = useState(organization?.bankIfsc || '');
  const [bankUpiId, setBankUpiId] = useState(organization?.bankUpiId || '');
  const [contactPhone, setContactPhone] = useState(organization?.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(organization?.contactEmail || '');

  // Signatory & Terms
  const [signatoryName, setSignatoryName] = useState(organization?.signatoryName || '');
  const [signatoryDesignation, setSignatoryDesignation] = useState(organization?.signatoryDesignation || '');
  const [termsConditions, setTermsConditions] = useState(organization?.termsConditions || '');
  const [thanksMessage, setThanksMessage] = useState(organization?.thanksMessage || '');

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Logo Upload States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [processedLogoBlob, setProcessedLogoBlob] = useState<Blob | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization?.logoUrl ? `${API_BASE_URL}${organization.logoUrl}` : null
  );
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);

  // SMTP Settings States
  const [smtpHost, setSmtpHost] = useState(organization?.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(organization?.smtpPort || '587');
  const [smtpUser, setSmtpUser] = useState(organization?.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState(organization?.smtpFrom || '');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSuccess, setSmtpSuccess] = useState(false);

  // SMTP Test States
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Email Template States
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(organization?.emailTemplate || 'professional');
  const [emailTemplateLoading, setEmailTemplateLoading] = useState(false);
  const [emailTemplateSuccess, setEmailTemplateSuccess] = useState(false);

  // Google Drive Cloud Backup States
  const [gdriveWebhookUrl, setGdriveWebhookUrl] = useState(localStorage.getItem('gdrive_webhook_url') || '');
  const [gdriveFolderId, setGdriveFolderId] = useState(localStorage.getItem('gdrive_folder_id') || '');
  const [gdriveAutoSync, setGdriveAutoSync] = useState(localStorage.getItem('gdrive_auto_sync') === 'true');
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [gdriveLoading, setGdriveLoading] = useState(false);
  const [gdriveSuccess, setGdriveSuccess] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleSaveEmailTemplate = async () => {
    setEmailTemplateLoading(true);
    setEmailTemplateSuccess(false);
    setError(null);
    try {
      await apiFetch('/api/organization/email-template', {
        method: 'PUT',
        body: JSON.stringify({ template: selectedEmailTemplate }),
      });
      updateOrganization({ emailTemplate: selectedEmailTemplate });
      setEmailTemplateSuccess(true);
      setTimeout(() => setEmailTemplateSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update email template.');
    } finally {
      setEmailTemplateLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    setError(null);

    try {
      await apiFetch('/api/organization/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: companyName,
          address,
          taxId,
          phone,
          paymentQrLink,
          bankName,
          bankAccountNo,
          bankIfsc,
          bankUpiId,
          contactPhone,
          contactEmail,
          signatoryName,
          signatoryDesignation,
          termsConditions,
          thanksMessage
        })
      });

      updateOrganization({
        name: companyName,
        address,
        taxId,
        phone,
        paymentQrLink,
        bankName,
        bankAccountNo,
        bankIfsc,
        bankUpiId,
        contactPhone,
        contactEmail,
        signatoryName,
        signatoryDesignation,
        termsConditions,
        thanksMessage
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update organization profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Crop + resize logo to a square canvas (max 200×200px) before upload
  const processLogoImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const maxPx = 200;
        const outSize = Math.min(size, maxPx);
        const canvas = document.createElement('canvas');
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext('2d')!;
        // Center-crop: cut equal amounts from each side
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, outSize, outSize);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob conversion failed'));
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for processing'));
      };
      img.src = objectUrl;
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoSuccess(false);
      try {
        const processed = await processLogoImage(file);
        setProcessedLogoBlob(processed);
        // Show the cropped preview
        setLogoPreview(URL.createObjectURL(processed));
      } catch {
        // Fallback to raw preview if processing fails
        setProcessedLogoBlob(null);
        setLogoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleLogoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) return;

    setLogoLoading(true);
    setLogoSuccess(false);
    setError(null);

    // Use the processed (cropped + resized) blob if available, else raw file
    const uploadBlob = processedLogoBlob ?? logoFile;
    const uploadName = logoFile.name.replace(/\.[^.]+$/, '') + '.png';

    const formData = new FormData();
    formData.append('logo', uploadBlob, uploadName);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/organization/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Logo upload failed.');

      updateOrganization({ logoUrl: data.logoUrl });
      // Show the uploaded logo via the R2 proxy URL
      setLogoPreview(`${API_BASE_URL}${data.logoUrl}`);
      setLogoSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo.');
    } finally {
      setLogoLoading(false);
    }
  };

  const handleUpdateSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpSuccess(false);
    setError(null);

    try {
      await apiFetch('/api/organization/smtp', {
        method: 'PUT',
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass: smtpPass || undefined, // Send password only if updated
          smtpFrom
        })
      });

      updateOrganization({
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpFrom,
        smtpHasPassword: smtpPass ? true : organization?.smtpHasPassword
      });
      setSmtpSuccess(true);
      setSmtpPass('');
    } catch (err: any) {
      setError(err.message || 'Failed to update SMTP configurations.');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestLoading(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await apiFetch('/api/organization/smtp/test', {
        method: 'POST',
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass: smtpPass || undefined, // Test with current input or saved secret
          smtpFrom
        })
      });
      setTestResult({ type: 'success', message: response.message });
    } catch (err: any) {
      setTestResult({ type: 'error', message: err.message || 'SMTP Connection Test Failed.' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveGDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setGdriveLoading(true);
    setGdriveSuccess(false);
    try {
      localStorage.setItem('gdrive_webhook_url', gdriveWebhookUrl);
      localStorage.setItem('gdrive_folder_id', gdriveFolderId);
      localStorage.setItem('gdrive_auto_sync', String(gdriveAutoSync));
      setGdriveSuccess(true);
      setTimeout(() => setGdriveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save Google Drive settings.');
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleBackupToDrive = async () => {
    if (!gdriveWebhookUrl) {
      setShowScriptGuide(true);
      setError('Please configure your Google Drive Webhook URL first (see 1-minute setup guide below).');
      return;
    }

    setBackupLoading(true);
    setBackupResult(null);
    try {
      const invoicesRes = await apiFetch('/api/invoices');
      const invoicesList = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes.invoices || []);

      if (invoicesList.length === 0) {
        setBackupResult('No invoices found to sync.');
        return;
      }

      let successCount = 0;
      for (const inv of invoicesList.slice(0, 10)) {
        try {
          await apiFetch(`/api/invoices/${inv.id}/sync-drive`, {
            method: 'POST',
            body: JSON.stringify({
              webhookUrl: gdriveWebhookUrl,
              folderId: gdriveFolderId || undefined
            })
          });
          successCount++;
        } catch (itemErr) {
          console.warn(`Failed to sync invoice ${inv.id}:`, itemErr);
        }
      }

      setBackupResult(`Successfully uploaded ${successCount} invoice PDF(s) to your Google Drive folder!`);
      setTimeout(() => setBackupResult(null), 8000);
    } catch (err: any) {
      setError(err.message || 'Backup failed. Please verify your Google Drive Webhook URL.');
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 700 }} className="text-gradient">
          Organization Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Configure company identities, bill headers, brand logo, and SMTP email parameters.
        </p>
      </div>

      {/* User Account Profile Summary */}
      {user && (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="avatar" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</h4>
                {user.isVerified ? (
                  <VerifiedBadge size="md" />
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Unverified</span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email} • Role: {user.role}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fade-in" style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.15)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="settings-grid">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Profile Edit Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <Building size={20} color="var(--primary)" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Billing Identity Profile</h4>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corporation LLC"
                  className="form-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">VAT / Tax ID</label>
                  <input
                    type="text"
                    placeholder="US87654321"
                    className="form-input"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Contact</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">HQ Billing Address *</label>
                <textarea
                  required
                  placeholder="5th Ave, Floor 10, New York, NY 10001"
                  className="form-input"
                  rows={3}
                  style={{ resize: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment / QR Code Link (Printed on PDF Invoices)</label>
                <input
                  type="text"
                  placeholder="https://pay.stripe.com/your-org or upi://pay?pa=yourorg@upi"
                  className="form-input"
                  value={paymentQrLink}
                  onChange={(e) => setPaymentQrLink(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Enter your custom payment link, PayPal, Stripe, or UPI URL. A real QR code will be generated and embedded in PDF invoices.
                </span>
              </div>

              {/* Bank & Payment Details Section */}
              <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', padding: '16px', marginTop: '6px' }}>
                <h5 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                  🏦 Bank Account & Payment Contact Details (Printed on Invoices)
                </h5>
                <div className="form-grid-2">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank / State Bank of India / Chase"
                      className="form-input"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 50100492819283"
                      className="form-input"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">IFSC / SWIFT / Branch Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      className="form-input"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">UPI ID / VPA (Instant Mobile Payment)</label>
                    <input
                      type="text"
                      placeholder="e.g. yourbusiness@okaxis"
                      className="form-input"
                      value={bankUpiId}
                      onChange={(e) => setBankUpiId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      className="form-input"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Contact Email</label>
                    <input
                      type="email"
                      placeholder="e.g. billing@yourcompany.com"
                      className="form-input"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Authorized Signatory Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <h5 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ✍️ Authorized Signatory Details
                </h5>
                <div className="form-grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Signatory Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="form-input"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Signatory Designation / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director / Partner"
                      className="form-input"
                      value={signatoryDesignation}
                      onChange={(e) => setSignatoryDesignation(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Default Terms & Thanks Message */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <h5 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  📜 Default Terms & Conditions and Greetings
                </h5>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Default Terms & Conditions</label>
                  <textarea
                    placeholder="e.g. 1. Payment due within 30 days. 2. Goods once sold will not be taken back. 3. Subject to Delhi jurisdiction."
                    className="form-input"
                    rows={3}
                    style={{ resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
                    value={termsConditions}
                    onChange={(e) => setTermsConditions(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Default Thanks / Business Greeting</label>
                  <input
                    type="text"
                    placeholder="e.g. Thank you for choosing our business! We look forward to serving you again."
                    className="form-input"
                    value={thanksMessage}
                    onChange={(e) => setThanksMessage(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                {profileSuccess ? (
                  <span style={{ fontSize: '0.82rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} /> Saved Successfully
                  </span>
                ) : <span></span>}

                <button type="submit" disabled={profileLoading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>

            </form>
          </div>

          {/* SMTP Config Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <KeyRound size={20} color="var(--primary)" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>SMTP Mail Server Settings</h4>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
              Setup your own SMTP servers to send real invoice reminder emails to your clients. Leaving SMTP settings blank drops back to simulated logs.
            </p>

            <form onSubmit={handleUpdateSmtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SMTP Server Host</label>
                  <input
                    type="text"
                    placeholder="smtp.mailtrap.io"
                    className="form-input"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SMTP Port</label>
                  <input
                    type="text"
                    placeholder="587"
                    className="form-input"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SMTP Auth Username</label>
                  <input
                    type="text"
                    placeholder="api-key-user"
                    className="form-input"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SMTP Auth Password</label>
                  <input
                    type="password"
                    placeholder={organization?.smtpHasPassword ? '•••••••• (Saved)' : 'Enter password'}
                    className="form-input"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sender Email Address (From)</label>
                <input
                  type="email"
                  placeholder="billing@yourdomain.com"
                  className="form-input"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                />
              </div>

              {/* Test Connection Result alert */}
              {testResult && (
                <div style={{
                  background: testResult.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(225, 29, 72, 0.08)',
                  border: `1px solid ${testResult.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(225, 29, 72, 0.15)'}`,
                  color: testResult.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: 1.4
                }}>
                  {testResult.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                {smtpSuccess ? (
                  <span style={{ fontSize: '0.82rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} /> Connection Saved
                  </span>
                ) : <span></span>}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    disabled={testLoading || !smtpHost || !smtpUser} 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    onClick={handleTestSmtp}
                  >
                    {testLoading ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button type="submit" disabled={smtpLoading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                    {smtpLoading ? 'Saving...' : 'Save Config'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Email Template Selector Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={20} color="var(--primary)" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Email Reminder Template</h4>
              </div>
              <Link to="/settings/email" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} /> Full Live Preview →
              </Link>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Choose how your invoice reminder emails look when sent to clients. This template is applied to all payment reminder emails.
            </p>

            <div className="email-gallery-grid" style={{ marginBottom: '20px' }}>
              {EMAIL_TEMPLATES.map((tpl) => {
                const isSelected = selectedEmailTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedEmailTemplate(tpl.id)}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      background: isSelected ? 'rgba(99,102,241,0.05)' : 'var(--bg-secondary)',
                      boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      position: 'relative',
                    }}
                  >
                    {/* Gradient header preview */}
                    <div style={{ height: '60px', background: tpl.preview.bg, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 12px' }}>
                      <div style={{ width: '55%', height: '7px', background: 'rgba(255,255,255,0.85)', borderRadius: '4px', marginBottom: '5px' }} />
                      <div style={{ width: '35%', height: '4px', background: 'rgba(255,255,255,0.45)', borderRadius: '3px' }} />
                      {isSelected && (
                        <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--primary)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={11} color="#fff" />
                        </div>
                      )}
                    </div>
                    {/* Body lines */}
                    <div style={{ padding: '9px 12px', background: 'var(--bg-primary)' }}>
                      <div style={{ height: '3px', background: 'var(--border-color)', borderRadius: '2px', marginBottom: '4px', width: '80%' }} />
                      <div style={{ height: '3px', background: 'var(--border-color)', borderRadius: '2px', width: '55%' }} />
                    </div>
                    <div style={{ padding: '0 12px 10px' }}>
                      <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tpl.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.63rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{tpl.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {emailTemplateSuccess ? (
                <span style={{ fontSize: '0.82rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={16} /> Email template saved!
                </span>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Selected: <strong style={{ color: 'var(--text-primary)' }}>{EMAIL_TEMPLATES.find(t => t.id === selectedEmailTemplate)?.name}</strong>
                </span>
              )}
              <button
                onClick={handleSaveEmailTemplate}
                disabled={emailTemplateLoading}
                className="btn btn-primary"
                style={{ padding: '8px 20px' }}
              >
                {emailTemplateLoading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Branding logo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <FileImage size={20} color="var(--primary)" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Brand Logo</h4>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Upload a PNG, JPG, or JPEG company logo. It will be <strong>automatically center-cropped to a square and resized to 200×200px</strong> before saving. This logo will appear on all generated PDF invoices.
            </p>

            {/* Current logo display */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Company Logo Preview" 
                  style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }} 
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Upload size={32} />
                  <span style={{ fontSize: '0.78rem' }}>No logo configured</span>
                </div>
              )}
            </div>

            <form onSubmit={handleLogoUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                id="logo-upload-input"
                style={{ display: 'none' }}
                onChange={handleLogoChange}
              />
              
              <label 
                htmlFor="logo-upload-input" 
                className="btn btn-secondary" 
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
              >
                <span>Select Logo File</span>
              </label>

              {logoFile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {logoFile.name}
                    </span>
                    <button type="submit" disabled={logoLoading} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                      {logoLoading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                  </div>
                  {processedLogoBlob && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Auto-cropped to square &amp; resized to 200×200px — preview shown above
                    </span>
                  )}
                </div>
              )}

              {logoSuccess && (
                <span style={{ fontSize: '0.82rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'center' }}>
                  <CheckCircle2 size={16} /> Logo saved successfully
                </span>
              )}
            </form>

          </div>

          {/* Google Drive Cloud Backup Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <Cloud size={20} color="#4285f4" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Google Drive Cloud Backup</h4>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Automatically sync generated invoice PDFs and signed legal agreements directly to your Google Drive folder using a free Google Apps Script webhook.
            </p>

            <form onSubmit={handleSaveGDrive} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Google Drive Webhook URL *</label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="form-input"
                  value={gdriveWebhookUrl}
                  onChange={(e) => setGdriveWebhookUrl(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Paste your Google Web App deployment URL.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScriptGuide(!showScriptGuide)}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showScriptGuide ? 'Hide Script' : 'Get Free Google Script'}
                  </button>
                </div>
              </div>

              {showScriptGuide && (
                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1-Minute Setup Instructions:</span>
                  <ol style={{ paddingLeft: '16px', lineHeight: 1.5 }}>
                    <li>Go to <strong>script.google.com</strong> &rarr; Click <strong>New project</strong>.</li>
                    <li>Paste the code below &rarr; Click <strong>Deploy</strong> &rarr; <strong>New deployment</strong>.</li>
                    <li>Select type: <strong>Web app</strong> (Execute as: <em>Me</em>, Who has access: <em>Anyone</em>).</li>
                    <li>Copy the Web app URL and paste it in the box above!</li>
                  </ol>
                  <pre style={{ background: '#090d16', padding: '8px', borderRadius: '4px', overflowX: 'auto', fontSize: '0.7rem', color: '#38bdf8' }}>
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var decoded = Utilities.base64Decode(data.fileBase64);
  var blob = Utilities.newBlob(decoded, 'application/pdf', data.filename);
  var folder = data.folderId ? DriveApp.getFolderById(data.folderId) : DriveApp.getRootFolder();
  var file = folder.createFile(blob);
  return ContentService.createTextOutput(JSON.stringify({ status: "success", url: file.getUrl() })).setMimeType(ContentService.MimeType.JSON);
}`}
                  </pre>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Google Drive Folder ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1A2b3C4d5E6f_GoogleDriveFolderID"
                  className="form-input"
                  value={gdriveFolderId}
                  onChange={(e) => setGdriveFolderId(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Leave blank to save in Google Drive root, or paste your folder ID to save inside a specific folder.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="gdrive-auto-sync"
                  checked={gdriveAutoSync}
                  onChange={(e) => setGdriveAutoSync(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="gdrive-auto-sync" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Enable automatic sync on new invoices
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                {gdriveSuccess ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} /> Drive Config Saved!
                  </span>
                ) : <span />}

                <button type="submit" disabled={gdriveLoading} className="btn btn-secondary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
                  {gdriveLoading ? 'Saving...' : 'Save Drive Config'}
                </button>
              </div>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Sync Invoices Now</span>
                <button
                  onClick={handleBackupToDrive}
                  disabled={backupLoading}
                  className="btn btn-primary"
                  style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={backupLoading ? 'spin' : ''} />
                  <span>{backupLoading ? 'Uploading Invoices...' : 'Backup All to Drive'}</span>
                </button>
              </div>

              {backupResult && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                  ✓ {backupResult}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
