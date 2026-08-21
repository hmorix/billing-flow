import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ShieldCheck, MapPin, Camera, Upload, ArrowLeft,
  Sparkles, Save, CheckCircle2, AlertCircle, Globe, RefreshCw,
  Layers, Users, Award, Receipt, CheckSquare, Square
} from 'lucide-react';
import { CURRENCIES, type SupportedCurrency } from '../utils/i18n';

interface AgreementTemplate {
  id: string;
  titleEn: string;
  titleHi: string;
  agreementType: string;
  defaultAmount: number;
  currency: string;
  validityPeriod: string;
  paymentTerms: string;
  stampDutyDefault?: number;
  stateJurisdiction?: string;
  requiresWitnesses?: boolean;
  termsEn: string;
  termsHi: string;
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
    titleEn: 'Work First, Pay Later Agreement',
    titleHi: 'कार्य पश्चात भुगतान अनुबंध',
    agreementType: 'Work First Pay Later',
    defaultAmount: 25000,
    currency: 'INR',
    validityPeriod: '30 Days post deliverable submission',
    paymentTerms: '100% Payment due within 7 days of milestone deliverable approval',
    stampDutyDefault: 100,
    stateJurisdiction: 'Delhi, India',
    requiresWitnesses: true,
    termsEn: `1. SCOPE OF ENGAGEMENT: The First Party (Service Provider) agrees to render professional services as specified.
2. DEFERRED PAYMENT TERMS: The Second Party shall pay the agreed total contract amount within 7 business days following delivery and acceptance of work.
3. DELIVERABLE ACCEPTANCE: Second Party has 5 business days to review deliverables. Lack of written feedback constitutes formal acceptance.
4. REMEDIES ON DEFAULT: Failure to disburse full payment within the stipulated period renders the intellectual property license revoked and attracts 1.5% monthly late interest.
5. GOVERNING LAW & JURISDICTION: This legal contract is executed under HMorix Digital Legal Framework and shall be governed by the laws of India.`,
    termsHi: `१. कार्य का दायरा: प्रथम पक्ष (सेवा प्रदाता) निर्धारित पेशेवर सेवाएं प्रदान करने के लिए सहमत है।
२. कार्योपरांत भुगतान शर्तें: द्वितीय पक्ष (ग्राहक) कार्य पूरा होने व स्वीकृति के ७ कार्य दिवसों के भीतर पूर्ण भुगतान करेगा।
३. कार्य समीक्षा: द्वितीय पक्ष को कार्य की समीक्षा हेतु ५ दिनों का समय प्राप्त होगा।
४. विलंब व ब्याज: निर्धारित अवधि में भुगतान न करने पर बौद्धिक संपदा का अधिकार निलंबित होगा तथा १.५% मासिक ब्याज देय होगा।
५. विधि एवं क्षेत्राधिकार: यह डिजिटल अनुबंध HMorix कानूनी ढांचे के अंतर्गत निष्पादित एवं भारत के कानूनों द्वारा शासित है।`
  },
  {
    id: 'milestone_50_50',
    titleEn: '50-50 Milestone Split Payment Agreement',
    titleHi: '50-50 चरणबद्ध भुगतान अनुबंध',
    agreementType: '50-50 Milestone Payment',
    defaultAmount: 50000,
    currency: 'INR',
    validityPeriod: '45 Calendar Days',
    paymentTerms: '50% Advance on project kickoff, 50% upon final deliverable handover',
    stampDutyDefault: 100,
    stateJurisdiction: 'Delhi, India',
    requiresWitnesses: true,
    termsEn: `1. PAYMENT SPLIT STRUCTURE: 50% non-refundable advance mobilization fee prior to commencement; balance 50% upon delivery of the final deliverable.
2. REVISIONS & AMENDMENTS: Up to two rounds of minor revisions are included. Additional scope adjustments will be billed pro-rata.
3. IP OWNERSHIP: Full ownership rights transfer to the Second Party solely upon 100% clearance of the balance amount.
4. CANCELLATION: In event of premature termination by Second Party, advance mobilization fee is forfeited.`,
    termsHi: `१. भुगतान संरचना: ५०% अग्रिम राशि कार्य प्रारंभ होने से पूर्व देय होगी; शेष ५०% राशि कार्य पूर्ण होने पर देय होगी।
२. संशोधन: दो दौर के संशोधन सम्मिलित हैं। अतिरिक्त कार्य के लिए अलग से शुल्क लिया जाएगा।
३. स्वामित्व: पूर्ण भुगतान प्राप्त होने के उपरांत ही स्वामित्व अधिकार द्वितीय पक्ष को हस्तांतरित होंगे।
४. रद्दीकरण: ग्राहक द्वारा कार्य रद्द करने पर अग्रिम राशि वापस नहीं होगी।`
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
  const [languageMode, setLanguageMode] = useState<'bilingual' | 'en' | 'hi'>('bilingual');
  const [attachLegalAppendix, setAttachLegalAppendix] = useState<boolean>(true);

  // Form Fields
  const [title, setTitle] = useState('Work First, Pay Later Agreement / कार्य पश्चात भुगतान अनुबंध');
  const [agreementType, setAgreementType] = useState('Work First Pay Later');
  const [firstPartyName, setFirstPartyName] = useState('Acme Solutions / Service Provider');
  const [firstPartyContact, setFirstPartyContact] = useState('+91 9876543210');
  const [firstPartyAddress, setFirstPartyAddress] = useState('Connaught Place, New Delhi, DL 110001, India');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Authorized Signatory');
  
  const [secondPartyName, setSecondPartyName] = useState('');
  const [secondPartyContact, setSecondPartyContact] = useState('');
  const [secondPartyAddress, setSecondPartyAddress] = useState('');
  
  const [witness1Name, setWitness1Name] = useState('');
  const [witness1Contact, setWitness1Contact] = useState('');
  const [witness2Name, setWitness2Name] = useState('');
  const [witness2Contact, setWitness2Contact] = useState('');

  const [totalAmount, setTotalAmount] = useState<number>(25000);
  const [currency, setCurrency] = useState('INR');
  const [validityPeriod, setValidityPeriod] = useState('30 Days post deliverable submission');
  const [paymentTerms, setPaymentTerms] = useState('100% Payment due within 7 days of milestone deliverable approval');
  const [stateJurisdiction, setStateJurisdiction] = useState('Delhi, India');
  const [stampDutyAmount, setStampDutyAmount] = useState(100);
  const [termsContent, setTermsContent] = useState('');

  // Geolocation and Media states
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>('Detecting location...');
  const [geoLoading, setGeoLoading] = useState(false);
  const [signerPhoto, setSignerPhoto] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAgreement, setCreatedAgreement] = useState<any | null>(null);

  // Fast Concurrent Data Loading
  useEffect(() => {
    const loadAllInitialData = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Load templates
      try {
        const res = await fetch(`${apiUrl}/api/agreements/templates`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setTemplates(list);
            applyTemplate(list[0], languageMode);
          }
        }
      } catch (e) {
        applyTemplate(FALLBACK_TEMPLATES[0], languageMode);
      }

      // Load clients & invoices if authenticated
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
        setGeoAddress('Location capture permission denied / unavailable');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const applyTemplate = (tpl: AgreementTemplate, lang: 'bilingual' | 'en' | 'hi') => {
    setSelectedTemplateId(tpl.id);
    setTitle(lang === 'hi' ? tpl.titleHi : lang === 'en' ? tpl.titleEn : `${tpl.titleEn} / ${tpl.titleHi}`);
    setAgreementType(tpl.agreementType);
    setTotalAmount(tpl.defaultAmount || 0);
    setValidityPeriod(tpl.validityPeriod || '');
    setPaymentTerms(tpl.paymentTerms || '');
    if (tpl.stampDutyDefault) setStampDutyAmount(tpl.stampDutyDefault);
    if (tpl.stateJurisdiction) setStateJurisdiction(tpl.stateJurisdiction);
    
    if (lang === 'bilingual') {
      setTermsContent(`${tpl.termsEn}\n\n────────────────────────\n\n${tpl.termsHi}`);
    } else if (lang === 'en') {
      setTermsContent(tpl.termsEn);
    } else {
      setTermsContent(tpl.termsHi);
    }
  };

  const handleTemplateChange = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) applyTemplate(tpl, languageMode);
  };

  const handleLanguageChange = (lang: 'bilingual' | 'en' | 'hi') => {
    setLanguageMode(lang);
    const tpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (tpl) applyTemplate(tpl, lang);
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
      setTitle(`Agreement for Invoice #${found.invoice_number} / ${found.client_name}`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignerPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      title,
      agreementType,
      linkedInvoiceNumber: linkedInvoiceNumber || null,
      firstPartyName,
      firstPartyContact,
      firstPartyAddress,
      signatoryDesignation,
      secondPartyName,
      secondPartyContact,
      secondPartyAddress,
      witness1Name,
      witness1Contact,
      witness2Name,
      witness2Contact,
      totalAmount: Number(totalAmount || 0),
      currency,
      validityPeriod,
      paymentTerms,
      stateJurisdiction,
      stampDutyAmount: Number(stampDutyAmount || 100),
      termsContent,
      language: languageMode,
      attachLegalAppendix,
      signerPhotoUrl: signerPhoto,
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
              Ref: <strong style={{ color: 'var(--primary)' }}>{createdAgreement.agreement_number}</strong> • Powered by HMorix Legal Infrastructure
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '520px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SHA-256 Digital Footprint:</div>
            <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--primary)', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '6px' }}>
              {createdAgreement.digital_hash}
            </code>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              📍 Location Geo-Stamp: {createdAgreement.geo_address || 'GPS Coordinates Recorded'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => handleDownloadPdf(createdAgreement.id, createdAgreement.agreement_number)}
            >
              <FileText size={16} />
              <span>Download e-Stamp PDF (with Hindi Font, Signatures &amp; Appendix)</span>
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '10px 20px' }}
              onClick={() => window.open(verifyUrl, '_blank')}
            >
              <span>View Verification Seal</span>
            </button>
            {isAuthenticated ? (
              <button className="btn btn-secondary" onClick={() => navigate('/agreements')}>
                Back to Agreements
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                Create Account to Save All
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
              Digital Legal Agreement &amp; Contract Studio
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Under HMorix Legal Infrastructure • Unicode Devanagari Hindi Engine • 4-Party Signatures on Every Page
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.15)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Auto-Fetch Client & Invoice Smart Link Bar */}
      {isAuthenticated && (clients.length > 0 || invoices.length > 0) && (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--primary)" />
            <strong style={{ fontSize: '0.85rem' }}>Auto-Fill from Existing Client or Invoice (No Re-entry Needed)</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {/* Auto-Fetch Client */}
            {clients.length > 0 && (
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={12} color="var(--primary)" /> ⚡ Select Saved Client
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
                  <Receipt size={12} color="var(--accent)" /> 📄 Link Existing Invoice / Contract
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
            Agreement Archetype ({templates.length} Modular Templates Loaded)
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['bilingual', 'en', 'hi'] as const).map(l => (
              <button
                key={l}
                type="button"
                className={`btn ${languageMode === l ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                onClick={() => handleLanguageChange(l)}
              >
                {l === 'bilingual' ? '🌐 Bilingual (EN + हिन्दी)' : l === 'en' ? 'English' : 'हिन्दी (Hindi)'}
              </button>
            ))}
          </div>
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
        
        {/* Parties Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            1. Contract Parties &amp; Jurisdiction
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* First Party */}
            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>FIRST PARTY (SERVICE PROVIDER / PARTY A)</div>
              <input type="text" required placeholder="Full Legal Name / Business Name" className="form-input" value={firstPartyName} onChange={e => setFirstPartyName(e.target.value)} />
              <input type="text" placeholder="Signatory Designation (e.g. Managing Director)" className="form-input" value={signatoryDesignation} onChange={e => setSignatoryDesignation(e.target.value)} />
              <input type="text" placeholder="Phone / Email" className="form-input" value={firstPartyContact} onChange={e => setFirstPartyContact(e.target.value)} />
              <input type="text" placeholder="Official Registered Address" className="form-input" value={firstPartyAddress} onChange={e => setFirstPartyAddress(e.target.value)} />
            </div>

            {/* Second Party */}
            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>SECOND PARTY (CLIENT / PARTY B)</div>
              <input type="text" required placeholder="Client Full Name / Company Name" className="form-input" value={secondPartyName} onChange={e => setSecondPartyName(e.target.value)} />
              <input type="text" placeholder="Client Phone / Email" className="form-input" value={secondPartyContact} onChange={e => setSecondPartyContact(e.target.value)} />
              <input type="text" placeholder="Client Billing / Physical Address" className="form-input" value={secondPartyAddress} onChange={e => setSecondPartyAddress(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Commercials & Terms */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            2. Commercial Value, SLA &amp; Payment Schedule
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
              <label className="form-label">Payment Terms Structure</label>
              <input type="text" className="form-input" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Service Validity / Timeline</label>
              <input type="text" className="form-input" value={validityPeriod} onChange={e => setValidityPeriod(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Binding Terms &amp; Legal Clauses (Hindi / English)</label>
            <textarea
              required
              rows={8}
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
                Attach Full Master Terms of Service &amp; Privacy Policy Appendix to PDF
              </strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Appends comprehensive IT Act 2000 legal terms, DPDP data protection clauses &amp; dispute arbitration rules.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Party Witnesses Block */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              3. Independent Witnesses Attestation (Printed on Every Page)
            </h4>
            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>Attestation Seal</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>WITNESS 1 (साक्षी १)</span>
              <input type="text" placeholder="Witness 1 Full Legal Name" className="form-input" value={witness1Name} onChange={e => setWitness1Name(e.target.value)} />
              <input type="text" placeholder="Witness 1 Contact / Aadhaar / Govt ID" className="form-input" value={witness1Contact} onChange={e => setWitness1Contact(e.target.value)} />
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>WITNESS 2 (साक्षी २)</span>
              <input type="text" placeholder="Witness 2 Full Legal Name" className="form-input" value={witness2Name} onChange={e => setWitness2Name(e.target.value)} />
              <input type="text" placeholder="Witness 2 Contact / Aadhaar / Govt ID" className="form-input" value={witness2Contact} onChange={e => setWitness2Contact(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Live Location & Verification Security Capture */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            4. Digital Footprint, GPS Location &amp; Photo ID Capture
          </h4>

          <div className="form-grid-2">
            {/* Geolocation */}
            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--primary)" /> Real-Time Geolocation Geo-Tagging
                </span>
                <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={captureLocation}>
                  <RefreshCw size={10} /> Refresh GPS
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                {geoLoading ? 'Acquiring high-accuracy GPS coordinates...' : geoAddress}
              </p>
            </div>

            {/* Photo / Camera capture */}
            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={14} color="var(--accent)" /> Signer Photo / Document Attachment
              </span>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <Upload size={14} />
                <span>{signerPhoto ? 'Photo Attached ✓' : 'Upload ID or Take Live Camera Photo'}</span>
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* Submit & Generate button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(isAuthenticated ? '/agreements' : '/')}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
            {isSubmitting ? 'Notarizing & Generating e-Stamp...' : 'Generate & Sign Digital Agreement'}
          </button>
        </div>

      </form>
    </div>
  );
};
