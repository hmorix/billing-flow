import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ShieldCheck, MapPin, Camera, Upload, ArrowLeft,
  Sparkles, CheckCircle2, AlertCircle, RefreshCw,
  Users, Receipt, CheckSquare, Square, Lock, Scale, AlertTriangle
} from 'lucide-react';
import { CURRENCIES, type SupportedCurrency } from '../utils/i18n';

interface AgreementTemplate {
  id: string;
  titleEn: string;
  agreementType: string;
  defaultAmount: number;
  currency: string;
  validityPeriod: string;
  paymentTerms: string;
  refundPolicy: string;
  latePaymentTerms: string;
  cancellationPolicy: string;
  stampDutyDefault?: number;
  stateJurisdiction?: string;
  requiresWitnesses?: boolean;
  termsEn: string;
}

interface ClientOption {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
  phone?: string | null;
  address?: string;
}

interface InvoiceOption {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_address?: string;
  client_phone?: string;
  currency: string;
  due_date: string;
  status: string;
  items?: any[];
}

const FALLBACK_TEMPLATES: AgreementTemplate[] = [
  {
    id: 'work_first_pay_later',
    titleEn: 'Work First, Pay Later Commercial Agreement',
    agreementType: 'Work First Pay Later',
    defaultAmount: 25000,
    currency: 'INR',
    validityPeriod: '30 Days post deliverable submission',
    paymentTerms: '100% Payment due within 7 days of milestone deliverable approval',
    refundPolicy: 'No refund on advance mobilization fees once project kickoff has commenced. In cases where no deliverables have been produced and cancellation is requested within 7 days of execution, a partial refund may be processed minus a 20% administrative handling charge, complying with the Consumer Protection Act, 2019.',
    latePaymentTerms: 'In the event of overdue payment beyond 7 business days, a late penalty of 1.5% per month (18% per annum) shall be levied on outstanding balances pursuant to the Interest Act, 1978 and Section 73 of the Indian Contract Act, 1872.',
    cancellationPolicy: 'Either party may terminate this agreement with 15 days prior written notice. Early termination by the Client results in forfeiture of advance deposits and requires pro-rata settlement for completed milestones under Section 74 of the Indian Contract Act, 1872.',
    stampDutyDefault: 100,
    stateJurisdiction: 'Delhi, India',
    requiresWitnesses: true,
    termsEn: `1. SCOPE OF ENGAGEMENT: The First Party (Service Provider) agrees to render professional services and deliverables as specified in the agreed project scope.
2. DEFERRED PAYMENT TERMS: The Second Party (Client) shall pay the agreed total contract sum within 7 business days following delivery, review, and formal acceptance of deliverables.
3. DELIVERABLE ACCEPTANCE: Second Party has 5 business days to review deliverables. Absence of written objection within this window constitutes formal deemed acceptance.
4. REMEDIES ON DEFAULT: Failure to disburse full payment within the stipulated period renders all intellectual property licenses immediately revoked, and unpaid balances incur 1.5% monthly statutory late interest.
5. GOVERNING LAW & JURISDICTION: This digital legal contract is executed under the Information Technology Act, 2000 and shall be governed exclusively by the laws of India.`
  },
  {
    id: 'milestone_50_50',
    titleEn: '50-50 Milestone Split Payment Contract',
    agreementType: '50-50 Milestone Payment',
    defaultAmount: 50000,
    currency: 'INR',
    validityPeriod: '45 Calendar Days',
    paymentTerms: '50% Non-refundable advance upon kickoff, 50% balance upon final deliverable handover',
    refundPolicy: 'The 50% advance mobilization deposit is non-refundable upon project initiation. Balance payments are released only upon milestone satisfaction.',
    latePaymentTerms: 'Late milestone release attracts 1.5% per month interest. Delivery timelines extend automatically during payment delays.',
    cancellationPolicy: 'Cancellation prior to final delivery forfeits the 50% advance payment. Ownership rights remain exclusively with the Service Provider until 100% settlement.',
    stampDutyDefault: 100,
    stateJurisdiction: 'Delhi, India',
    requiresWitnesses: true,
    termsEn: `1. PAYMENT SPLIT STRUCTURE: 50% non-refundable advance mobilization fee prior to commencement; balance 50% upon delivery and testing of final deliverables.
2. REVISIONS & AMENDMENTS: Up to two rounds of minor revisions are included. Additional scope adjustments will be billed pro-rata.
3. IP OWNERSHIP: Full ownership rights and copyright transfer to the Second Party solely upon 100% clearance of the balance amount.
4. CANCELLATION: In event of premature termination by Second Party, the advance mobilization fee is forfeited as liquidated damages.`
  },
  {
    id: 'freelance_retainer',
    titleEn: 'Monthly Professional Services Retainer Agreement',
    agreementType: 'Monthly Retainer',
    defaultAmount: 35000,
    currency: 'INR',
    validityPeriod: 'Monthly Recurring (Renewable)',
    paymentTerms: 'Advance payment due on the 1st day of each billing cycle month',
    refundPolicy: 'Monthly retainer fees are non-refundable once the billing cycle commences as developer hours are dedicated and reserved.',
    latePaymentTerms: 'Retainer services will be suspended if payment is not received within 5 business days of the invoice date.',
    cancellationPolicy: 'Notice of cancellation must be provided at least 30 calendar days before the upcoming billing cycle.',
    stampDutyDefault: 100,
    stateJurisdiction: 'Delhi, India',
    requiresWitnesses: true,
    termsEn: `1. RETAINER SERVICES: First Party agrees to provide up to the agreed monthly hours of dedicated technical/consulting services.
2. TIMELINE & AVAILABILITY: Support is available during standard Indian business hours (10:00 AM - 7:00 PM IST).
3. UNUSED HOURS: Unused retainer hours do not rollover to subsequent billing cycles unless agreed in writing.
4. CONFIDENTIALITY: Both parties agree to strict non-disclosure of proprietary information under the DPDP Act 2023.`
  }
];

export const AgreementCreate: React.FC = () => {
  const { isAuthenticated, apiFetch } = useAuth();
  const navigate = useNavigate();

  // Fast Async Data Stores
  const [templates, setTemplates] = useState<AgreementTemplate[]>(FALLBACK_TEMPLATES);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState<string>('');

  const [selectedTemplateId, setSelectedTemplateId] = useState('work_first_pay_later');
  const [attachLegalAppendix, setAttachLegalAppendix] = useState<boolean>(true);

  // Section 1: Basic Agreement Configuration
  const [title, setTitle] = useState('Work First, Pay Later Commercial Agreement');
  const [agreementType, setAgreementType] = useState('Work First Pay Later');
  const [stateJurisdiction, setStateJurisdiction] = useState('Delhi, India');
  const [stampDutyAmount, setStampDutyAmount] = useState(100);

  // Section 2: First Party Details (Service Provider)
  const [firstPartyName, setFirstPartyName] = useState('Acme Solutions Pvt Ltd');
  const [firstPartyFatherName, setFirstPartyFatherName] = useState('');
  const [firstPartyAadhaar, setFirstPartyAadhaar] = useState('');
  const [firstPartyMobile, setFirstPartyMobile] = useState('+91 9876543210');
  const [firstPartyContact, setFirstPartyContact] = useState('billing@acmesolutions.in');
  const [firstPartyAddress, setFirstPartyAddress] = useState('Connaught Place, New Delhi, DL 110001, India');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Director / Authorized Signatory');
  const [signerPhoto, setSignerPhoto] = useState<string | null>(null);

  // Section 3: Second Party Details (Client)
  const [secondPartyName, setSecondPartyName] = useState('');
  const [secondPartyFatherName, setSecondPartyFatherName] = useState('');
  const [secondPartyAadhaar, setSecondPartyAadhaar] = useState('');
  const [secondPartyMobile, setSecondPartyMobile] = useState('');
  const [secondPartyContact, setSecondPartyContact] = useState('');
  const [secondPartyAddress, setSecondPartyAddress] = useState('');
  const [secondPartyPhoto, setSecondPartyPhoto] = useState<string | null>(null);

  // Section 4: Commercials & Policies
  const [totalAmount, setTotalAmount] = useState<number>(25000);
  const [currency, setCurrency] = useState('INR');
  const [validityPeriod, setValidityPeriod] = useState('30 Days post deliverable submission');
  const [paymentTerms, setPaymentTerms] = useState('100% Payment due within 7 days of milestone deliverable approval');
  const [refundPolicy, setRefundPolicy] = useState(
    'No refund on advance mobilization fees once project kickoff has commenced. In cases where no deliverables have been produced and cancellation is requested within 7 days of execution, a partial refund may be processed minus a 20% administrative handling charge, complying with the Consumer Protection Act, 2019.'
  );
  const [latePaymentTerms, setLatePaymentTerms] = useState(
    'In the event of overdue payment beyond 7 business days, a late penalty of 1.5% per month (18% per annum) shall be levied on outstanding balances pursuant to the Interest Act, 1978 and Section 73 of the Indian Contract Act, 1872.'
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Either party may terminate this agreement with 15 days prior written notice. Early termination by the Client results in forfeiture of advance deposits and requires pro-rata settlement for completed milestones under Section 74 of the Indian Contract Act, 1872.'
  );
  const [termsContent, setTermsContent] = useState('');

  // Section 5: Witnesses
  const [witness1Name, setWitness1Name] = useState('');
  const [witness1Contact, setWitness1Contact] = useState('');
  const [witness2Name, setWitness2Name] = useState('');
  const [witness2Contact, setWitness2Contact] = useState('');

  // Section 6: Geolocation & Verification
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>('Detecting location...');
  const [geoLoading, setGeoLoading] = useState(false);

  // Section 7: Mandatory Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAgreement, setCreatedAgreement] = useState<any | null>(null);

  // Helper: Format Aadhaar input with dashes (XXXX-XXXX-XXXX)
  const handleAadhaarChange = (val: string, setter: (v: string) => void) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const parts = raw.match(/.{1,4}/g);
    setter(parts ? parts.join('-') : raw);
  };

  // Load initial templates & data
  useEffect(() => {
    const loadAllInitialData = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      try {
        const res = await fetch(`${apiUrl}/api/agreements/templates`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setTemplates(list);
            applyTemplate(list[0]);
          }
        }
      } catch (e) {
        applyTemplate(FALLBACK_TEMPLATES[0]);
      }

      if (isAuthenticated) {
        try {
          const [clientsData, invoicesData] = await Promise.allSettled([
            apiFetch('/api/clients'),
            apiFetch('/api/invoices')
          ]);

          if (clientsData.status === 'fulfilled' && Array.isArray(clientsData.value)) {
            setClients(clientsData.value);
          }
          if (invoicesData.status === 'fulfilled') {
            const val = invoicesData.value;
            const invList = Array.isArray(val) ? val : (val.results || []);
            setInvoices(invList);
          }
        } catch (e) {
          console.error('Failed to load user clients/invoices:', e);
        }
      }
    };

    loadAllInitialData();
    captureLocation();
  }, [isAuthenticated]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoAddress('Geolocation not supported by browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
        setGeoAddress(`GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)} (Accuracy ~${Math.round(pos.coords.accuracy)}m)`);
        setGeoLoading(false);
      },
      () => {
        setGeoAddress('Location permission denied / unavailable');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const applyTemplate = (tpl: AgreementTemplate) => {
    setSelectedTemplateId(tpl.id);
    setTitle(tpl.titleEn || 'Commercial Agreement');
    setAgreementType(tpl.agreementType);
    setTotalAmount(tpl.defaultAmount || 0);
    setValidityPeriod(tpl.validityPeriod || '');
    setPaymentTerms(tpl.paymentTerms || '');
    if (tpl.refundPolicy) setRefundPolicy(tpl.refundPolicy);
    if (tpl.latePaymentTerms) setLatePaymentTerms(tpl.latePaymentTerms);
    if (tpl.cancellationPolicy) setCancellationPolicy(tpl.cancellationPolicy);
    if (tpl.stampDutyDefault) setStampDutyAmount(tpl.stampDutyDefault);
    if (tpl.stateJurisdiction) setStateJurisdiction(tpl.stateJurisdiction);
    setTermsContent(tpl.termsEn || '');
  };

  const handleTemplateChange = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) applyTemplate(tpl);
  };

  // Auto-Fetch & Auto-Fill Client when Selected
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;

    const found = clients.find(c => c.id === clientId);
    if (found) {
      setSecondPartyName(found.company_name ? `${found.name} (${found.company_name})` : found.name);
      setSecondPartyContact(found.phone || found.email || '');
      setSecondPartyAddress(found.address || '');
    }
  };

  // Auto-Fill from Linked Invoice
  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    if (!invoiceId) {
      setLinkedInvoiceNumber('');
      return;
    }

    const found = invoices.find(inv => inv.id === invoiceId);
    if (found) {
      setLinkedInvoiceNumber(found.invoice_number);
      if (found.client_name) {
        setSecondPartyName(found.client_company ? `${found.client_name} (${found.client_company})` : found.client_name);
      }
      if (found.client_phone || found.client_email) {
        setSecondPartyContact(found.client_phone || found.client_email || '');
      }
      if (found.client_address) {
        setSecondPartyAddress(found.client_address);
      }
      if (found.currency) {
        setCurrency(found.currency.toUpperCase());
      }
      if (found.due_date) {
        setPaymentTerms(`Payment due by ${new Date(found.due_date).toLocaleDateString('en-IN')} as per Invoice #${found.invoice_number}`);
      }
      setTitle(`Commercial Agreement for Invoice #${found.invoice_number} - ${found.client_name}`);
    }
  };

  // Helper: Compress and resize image client-side to prevent HTTP 413 Payload Too Large errors
  const compressImage = (file: File, maxWidth = 350, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setter(compressed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declarationAccepted) {
      setError('You must accept the Mandatory Legal Declaration before generating and signing this agreement.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload = {
      title,
      agreementType,
      linkedInvoiceNumber: linkedInvoiceNumber || null,
      firstPartyName,
      firstPartyFatherName: firstPartyFatherName || null,
      firstPartyAadhaar: firstPartyAadhaar.replace(/\D/g, '') || null,
      firstPartyMobile: firstPartyMobile || null,
      firstPartyContact: firstPartyContact || null,
      firstPartyAddress: firstPartyAddress || null,
      signatoryDesignation: signatoryDesignation || null,
      signerPhotoUrl: signerPhoto,

      secondPartyName,
      secondPartyFatherName: secondPartyFatherName || null,
      secondPartyAadhaar: secondPartyAadhaar.replace(/\D/g, '') || null,
      secondPartyMobile: secondPartyMobile || null,
      secondPartyContact: secondPartyContact || null,
      secondPartyAddress: secondPartyAddress || null,
      secondPartyPhotoUrl: secondPartyPhoto,

      witness1Name: witness1Name || null,
      witness1Contact: witness1Contact || null,
      witness2Name: witness2Name || null,
      witness2Contact: witness2Contact || null,

      totalAmount: Number(totalAmount || 0),
      currency,
      validityPeriod,
      paymentTerms,
      refundPolicy,
      latePaymentTerms,
      cancellationPolicy,
      termsContent,
      language: 'en',
      stateJurisdiction,
      stampDutyAmount: Number(stampDutyAmount || 100),
      attachLegalAppendix,

      geoLat,
      geoLng,
      geoAddress
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      let resData;

      if (isAuthenticated) {
        resData = await apiFetch('/api/agreements', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        const res = await fetch(`${apiUrl}/api/agreements/public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create agreement');
        }
        resData = await res.json();
      }

      setCreatedAgreement(resData);
    } catch (err: any) {
      setError(err.message || 'Failed to create legal agreement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id: string, number: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const token = localStorage.getItem('token');
    const endpoint = `${apiUrl}/api/agreements/${id}/pdf`;
    
    try {
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('PDF Generation Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agreement_${number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Error downloading agreement: ${err.message}`);
    }
  };

  // SUCCESS VIEW
  if (createdAgreement) {
    const verifyUrl = `${window.location.origin}/verify/${createdAgreement.digital_hash}`;
    return (
      <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card fade-in" style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="badge badge-success" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
              ✓ Legally Executed &amp; Cryptographically Sealed
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Agreement Successfully Generated!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>
              Ref: <strong style={{ color: 'var(--primary)' }}>{createdAgreement.agreement_number}</strong> • Governed under Information Technology Act, 2000
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '520px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SHA-256 Cryptographic Digital Footprint:</div>
            <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--primary)', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '6px' }}>
              {createdAgreement.digital_hash}
            </code>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              📍 GPS Geolocation Audit: {createdAgreement.geo_address || 'Recorded in Certificate'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => handleDownloadPdf(createdAgreement.id, createdAgreement.agreement_number)}
            >
              <FileText size={16} />
              <span>Download Official e-Stamp Legal PDF</span>
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '10px 20px' }}
              onClick={() => window.open(verifyUrl, '_blank')}
            >
              <span>View Verification Portal</span>
            </button>
            {isAuthenticated ? (
              <button className="btn btn-secondary" onClick={() => navigate('/agreements')}>
                Back to Agreements List
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                Create Free Account to Manage Contracts
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => navigate(isAuthenticated ? '/agreements' : '/')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)', fontWeight: 700 }} className="text-gradient">
              Professional Legal Agreement &amp; Contract Studio
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Under Indian Legal Framework (IT Act 2000 &amp; Indian Contract Act 1872) • Mandatory Certificate No., SHA-256 &amp; Geolocation on Every Page
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.15)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Auto-Fetch Client & Invoice Smart Link Bar */}
      {isAuthenticated && (clients.length > 0 || invoices.length > 0) && (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--primary)" />
            <strong style={{ fontSize: '0.85rem' }}>Auto-Fill from Existing Client or Invoice</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {/* Auto-Fetch Client */}
            {clients.length > 0 && (
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={12} color="var(--primary)" /> Select Saved Client
                </label>
                <select
                  className="form-input"
                  style={{ fontSize: '0.82rem' }}
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                >
                  <option value="">-- Choose Existing Client to Auto-Fill --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ''} - {c.email || c.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Select Invoice */}
            {invoices.length > 0 && (
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={12} color="var(--accent)" /> Link Existing Invoice
                </label>
                <select
                  className="form-input"
                  style={{ fontSize: '0.82rem' }}
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                >
                  <option value="">-- Choose Invoice to Auto-Link --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      Invoice #{inv.invoice_number} ({inv.client_name}) - Due {new Date(inv.due_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preset Agreement Selector */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Agreement Archetypes ({templates.length} Standard Contract Frameworks)
          </span>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            Language: English Only
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {templates.map(t => (
            <div
              key={t.id}
              onClick={() => handleTemplateChange(t.id)}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: selectedTemplateId === t.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: selectedTemplateId === t.id ? 'rgba(99,102,241,0.06)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedTemplateId === t.id ? 'var(--primary)' : 'var(--text-primary)' }}>
                {t.agreementType}
              </h5>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }} className="text-truncate">
                {t.validityPeriod}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* SECTION 1: Agreement Configuration */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="var(--primary)" /> 1. Agreement Configuration &amp; Jurisdiction
          </h4>

          <div className="form-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Agreement Title *</label>
              <input type="text" required className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">State / Jurisdiction (e-Stamp) *</label>
              <input type="text" required className="form-input" value={stateJurisdiction} onChange={e => setStateJurisdiction(e.target.value)} />
            </div>
          </div>
        </div>

        {/* SECTION 2: First Party Details (Service Provider) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} /> 2. First Party Details (Service Provider / Party A)
          </h4>

          <div className="form-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Legal Name / Business Entity *</label>
              <input type="text" required placeholder="Full Name or Registered Company" className="form-input" value={firstPartyName} onChange={e => setFirstPartyName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Father's / Spouse Name</label>
              <input type="text" placeholder="e.g. S/o Late Shri Rajesh Sharma" className="form-input" value={firstPartyFatherName} onChange={e => setFirstPartyFatherName(e.target.value)} />
            </div>
          </div>

          <div className="grid-3-col">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Aadhaar Card No. (12 Digits)</label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                className="form-input"
                value={firstPartyAadhaar}
                onChange={e => handleAadhaarChange(e.target.value, setFirstPartyAadhaar)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mobile Number *</label>
              <input type="text" required placeholder="+91 98765 43210" className="form-input" value={firstPartyMobile} onChange={e => setFirstPartyMobile(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email / Contact</label>
              <input type="text" placeholder="contact@domain.com" className="form-input" value={firstPartyContact} onChange={e => setFirstPartyContact(e.target.value)} />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Signatory Designation / Capacity</label>
              <input type="text" placeholder="e.g. Managing Director / Proprietor" className="form-input" value={signatoryDesignation} onChange={e => setSignatoryDesignation(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Party Signer Live Photo / ID Attachment</label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '9px 12px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <Camera size={15} color="var(--primary)" />
                <span>{signerPhoto ? 'Party A Photo Attached ✓' : 'Upload ID or Take Live Camera Photo'}</span>
                <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, setSignerPhoto)} />
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Official Registered Address *</label>
            <input type="text" required placeholder="Complete physical address with PIN Code" className="form-input" value={firstPartyAddress} onChange={e => setFirstPartyAddress(e.target.value)} />
          </div>
        </div>

        {/* SECTION 3: Second Party Details (Client) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} /> 3. Second Party Details (Client / Customer / Party B)
          </h4>

          <div className="form-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Client Full Legal Name / Business Name *</label>
              <input type="text" required placeholder="Client Legal Name / Entity" className="form-input" value={secondPartyName} onChange={e => setSecondPartyName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Father's / Spouse Name</label>
              <input type="text" placeholder="e.g. S/o Shri Rameshwar Prasad" className="form-input" value={secondPartyFatherName} onChange={e => setSecondPartyFatherName(e.target.value)} />
            </div>
          </div>

          <div className="grid-3-col">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Aadhaar Card No. (12 Digits)</label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                className="form-input"
                value={secondPartyAadhaar}
                onChange={e => handleAadhaarChange(e.target.value, setSecondPartyAadhaar)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mobile Number *</label>
              <input type="text" required placeholder="+91 91234 56789" className="form-input" value={secondPartyMobile} onChange={e => setSecondPartyMobile(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email / Contact</label>
              <input type="text" placeholder="client@domain.com" className="form-input" value={secondPartyContact} onChange={e => setSecondPartyContact(e.target.value)} />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Client Billing / Registered Address *</label>
              <input type="text" required placeholder="Complete Billing Address with State & PIN Code" className="form-input" value={secondPartyAddress} onChange={e => setSecondPartyAddress(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Second Party Signer Live Photo / ID Attachment</label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '9px 12px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <Camera size={15} color="var(--accent)" />
                <span>{secondPartyPhoto ? 'Party B Photo Attached ✓' : 'Upload ID or Take Live Camera Photo'}</span>
                <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, setSecondPartyPhoto)} />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: Commercials, Refund & Late Payment Policies */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="var(--success)" /> 4. Commercial Terms, Refund &amp; Late Payment Policies
          </h4>

          <div className="grid-3-col">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contract Value / Amount</label>
              <input type="number" min="0" className="form-input" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Currency</label>
              <select className="form-input" value={currency} onChange={e => setCurrency(e.target.value)}>
                {Object.keys(CURRENCIES).map(c => (
                  <option key={c} value={c}>{CURRENCIES[c as SupportedCurrency].name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Stamp Duty Fee (₹)</label>
              <input type="number" min="10" className="form-input" value={stampDutyAmount} onChange={e => setStampDutyAmount(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Terms Structure *</label>
              <input type="text" required className="form-input" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Service Validity / Delivery Timeline *</label>
              <input type="text" required className="form-input" value={validityPeriod} onChange={e => setValidityPeriod(e.target.value)} />
            </div>
          </div>

          {/* Refund Policy */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Refund Policy &amp; Resolution Rules (Consumer Protection Act, 2019) *</label>
            <textarea
              required
              rows={3}
              className="form-input"
              style={{ fontSize: '0.83rem', resize: 'vertical' }}
              value={refundPolicy}
              onChange={e => setRefundPolicy(e.target.value)}
            />
          </div>

          {/* Late Payment Terms */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Late Payment Penalties &amp; Interest (Sec. 73 Indian Contract Act, 1872) *</label>
            <textarea
              required
              rows={3}
              className="form-input"
              style={{ fontSize: '0.83rem', resize: 'vertical' }}
              value={latePaymentTerms}
              onChange={e => setLatePaymentTerms(e.target.value)}
            />
          </div>

          {/* Cancellation Policy */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cancellation, Breach &amp; Early Termination Terms *</label>
            <textarea
              required
              rows={3}
              className="form-input"
              style={{ fontSize: '0.83rem', resize: 'vertical' }}
              value={cancellationPolicy}
              onChange={e => setCancellationPolicy(e.target.value)}
            />
          </div>

          {/* Binding Clauses */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Scope of Engagement &amp; Custom Legal Clauses (English Only) *</label>
            <textarea
              required
              rows={7}
              className="form-input"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', resize: 'vertical' }}
              value={termsContent}
              onChange={e => setTermsContent(e.target.value)}
            />
          </div>

          {/* Attach Legal Terms Checkbox */}
          <div
            onClick={() => setAttachLegalAppendix(!attachLegalAppendix)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
              background: attachLegalAppendix ? 'rgba(16,185,129,0.08)' : 'var(--bg-tertiary)',
              border: attachLegalAppendix ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)',
              borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            {attachLegalAppendix ? <CheckSquare size={18} color="var(--success)" /> : <Square size={18} color="var(--text-muted)" />}
            <div>
              <strong style={{ fontSize: '0.85rem', color: attachLegalAppendix ? 'var(--success)' : 'var(--text-primary)' }}>
                Attach Full Master Terms of Service &amp; Statutory Compliance Addendum
              </strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Includes comprehensive IT Act 2000 digital signature validity, DPDP Act 2023 privacy terms, GST compliance, and dispute arbitration rules.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: Independent Witnesses Attestation */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              5. Independent Witnesses Attestation (Printed on Every Page)
            </h4>
            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>4-Party Signature Block</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>WITNESS 1 (ATTESTOR)</span>
              <input type="text" placeholder="Witness 1 Full Legal Name" className="form-input" value={witness1Name} onChange={e => setWitness1Name(e.target.value)} />
              <input type="text" placeholder="Witness 1 Phone / Govt ID / Aadhaar" className="form-input" value={witness1Contact} onChange={e => setWitness1Contact(e.target.value)} />
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>WITNESS 2 (ATTESTOR)</span>
              <input type="text" placeholder="Witness 2 Full Legal Name" className="form-input" value={witness2Name} onChange={e => setWitness2Name(e.target.value)} />
              <input type="text" placeholder="Witness 2 Phone / Govt ID / Aadhaar" className="form-input" value={witness2Contact} onChange={e => setWitness2Contact(e.target.value)} />
            </div>
          </div>
        </div>

        {/* SECTION 6: Geolocation & Security Capture */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--primary)" /> 6. Real-Time Geolocation Audit &amp; Cryptographic Fingerprint
          </h4>

          <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--primary)" /> High-Accuracy GPS Geolocation Stamp
              </span>
              <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={captureLocation}>
                <RefreshCw size={10} /> Refresh GPS Location
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              {geoLoading ? 'Acquiring high-accuracy GPS coordinates...' : geoAddress}
            </p>
          </div>
        </div>

        {/* SECTION 7: Mandatory Legal Declaration & Execution */}
        <div className="glass-card" style={{ background: declarationAccepted ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.05)', border: declarationAccepted ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--primary)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              7. Mandatory Signatory Declaration &amp; Non-Repudiation Acknowledgment
            </h4>
          </div>

          <div
            onClick={() => setDeclarationAccepted(!declarationAccepted)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              cursor: 'pointer',
              border: declarationAccepted ? '1px solid var(--success)' : '1px solid var(--border-color)'
            }}
          >
            <div style={{ marginTop: '2px' }}>
              {declarationAccepted ? <CheckSquare size={20} color="var(--success)" /> : <Square size={20} color="var(--text-muted)" />}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <strong>Solemn Declaration under the Information Technology Act, 2000 &amp; Indian Contract Act, 1872:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                "I/We hereby solemnly declare and affirm that I have read, understood, and agreed to all terms, conditions, refund policies, late payment penalties, and cancellation terms stated in this agreement. All personal identifiers, Aadhaar numbers, and addresses provided herein are true and accurate. I am fully aware of the legal obligations of executing this digital contract and intend to be bound by its terms."
              </p>
            </div>
          </div>
        </div>

        {/* Submit & Generate button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(isAuthenticated ? '/agreements' : '/')}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !declarationAccepted}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '0.95rem',
              opacity: declarationAccepted ? 1 : 0.6,
              cursor: declarationAccepted ? 'pointer' : 'not-allowed'
            }}
          >
            {isSubmitting ? 'Notarizing & Generating e-Stamp...' : 'Generate & Sign Digital Agreement'}
          </button>
        </div>

      </form>
    </div>
  );
};
