import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ShieldCheck, MapPin, Camera, Upload, ArrowLeft,
  Sparkles, Save, CheckCircle2, AlertCircle, Globe, RefreshCw, Layers
} from 'lucide-react';
import { CURRENCIES, type SupportedCurrency } from '../utils/i18n';

// Pre-defined Bilingual Legal Clauses & Templates
const AGREEMENT_TEMPLATES = [
  {
    id: 'work_first_pay_later',
    title: 'Work First, Pay Later Agreement / कार्य पश्चात भुगतान अनुबंध',
    type: 'Work First Pay Later',
    defaultAmount: 25000,
    validity: '30 Days post deliverable submission',
    paymentTerms: '100% Payment due within 7 days of milestone deliverable approval',
    termsEn: `1. SCOPE OF ENGAGEMENT: The First Party agrees to render professional services as specified.
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
    title: '50-50 Milestone Split Agreement / 50-50 चरणबद्ध भुगतान अनुबंध',
    type: '50-50 Milestone Payment',
    defaultAmount: 50000,
    validity: '45 Calendar Days',
    paymentTerms: '50% Advance on project kickoff, 50% upon final deliverable handover',
    termsEn: `1. PAYMENT SPLIT STRUCTURE: 50% non-refundable advance mobilization fee prior to commencement; balance 50% upon delivery of the final deliverable.
2. REVISIONS & AMENDMENTS: Up to two rounds of minor revisions are included. Additional scope adjustments will be billed pro-rata.
3. IP OWNERSHIP: Full ownership rights transfer to the Second Party solely upon 100% clearance of the balance amount.
4. CANCELLATION: In event of premature termination by Second Party, advance mobilization fee is forfeited.`,
    termsHi: `१. भुगतान संरचना: ५०% अग्रिम राशि कार्य प्रारंभ होने से पूर्व देय होगी; शेष ५०% राशि कार्य पूर्ण होने पर देय होगी।
२. संशोधन: दो दौर के संशोधन सम्मिलित हैं। अतिरिक्त कार्य के लिए अलग से शुल्क लिया जाएगा।
३. स्वामित्व: पूर्ण भुगतान प्राप्त होने के उपरांत ही स्वामित्व अधिकार द्वितीय पक्ष को हस्तांतरित होंगे।
४. रद्दीकरण: ग्राहक द्वारा कार्य रद्द करने पर अग्रिम राशि वापस नहीं होगी।`
  },
  {
    id: 'service_package_sla',
    title: 'Service Package & SLA Validity Agreement / सेवा पैकेज व अवधि अनुबंध',
    type: 'Service Package & SLA',
    defaultAmount: 35000,
    validity: '3 Months (90 Days Active SLA)',
    paymentTerms: 'Monthly recurring retainer or 100% upfront package clearance',
    termsEn: `1. SERVICE DURATION & SLA: Active for the specified validity period from commencement date.
2. RESPONSE TIMES: First Party commits to an initial turnaround response time within 24 business hours.
3. SCOPE EXCLUSIONS: Third-party API charges, government filing fees, and hosting licenses are explicitly excluded.
4. RENEWAL: Automatically renewable upon mutually agreed terms prior to the conclusion of the validity window.`,
    termsHi: `१. सेवा अवधि: अनुबंध में निर्धारित समयावधि तक सेवाएं सक्रिय रहेंगी।
२. प्रतिक्रिया समय: २४ कार्य घंटों के भीतर सेवा सहायता व प्रतिक्रिया दी जाएगी।
३. अतिरिक्त शुल्क: तृतीय पक्ष API, सरकारी शुल्क तथा सर्वर खर्च पैकेज में शामिल नहीं हैं।
४. नवीनीकरण: अवधि समाप्त होने से पूर्व आपसी सहमति से नवीनीकृत किया जा सकेगा।`
  },
  {
    id: 'sworn_affidavit',
    title: 'Sworn Affidavit & Declaration / शपथ पत्र एवं घोषणा',
    type: 'Sworn Affidavit',
    defaultAmount: 0,
    validity: 'Permanent / Legally Binding Declaration',
    paymentTerms: 'Non-Commercial / Legal Declaration of Facts',
    termsEn: `1. SOLEMN DECLARATION: The Deponent solemnly declares that all representations, addresses, and identity credentials provided herein are true, correct, and verified to the best of their knowledge.
2. INDEMNITY: The Deponent holds harmless all service providers and declares no concealment of material facts.
3. DIGITAL NOTARIZATION: Executed and verified electronically with cryptographic signature hash under HMorix digital verification.`,
    termsHi: `१. सत्यनिष्ठा घोषणा: शपथकर्ता घोषणा करता है कि प्रस्तुत सभी विवरण, पते व पहचान पत्र सत्य एवं प्रमाणिक हैं।
२. दायित्व: किसी भी असत्य जानकारी हेतु शपथकर्ता स्वयं कानूनी रूप से उत्तरदायी होगा।
३. डिजिटल नोटराइजेशन: HMorix डिजिटल सत्यापन द्वारा इलेक्ट्रॉनिक रूप से सत्यापित।`
  }
];

export const AgreementCreate: React.FC = () => {
  const { isAuthenticated, apiFetch } = useAuth();
  const navigate = useNavigate();

  // Selected preset
  const [selectedTemplateId, setSelectedTemplateId] = useState(AGREEMENT_TEMPLATES[0].id);
  const [languageMode, setLanguageMode] = useState<'bilingual' | 'en' | 'hi'>('bilingual');

  // Form Fields
  const [title, setTitle] = useState(AGREEMENT_TEMPLATES[0].title);
  const [agreementType, setAgreementType] = useState(AGREEMENT_TEMPLATES[0].type);
  const [firstPartyName, setFirstPartyName] = useState('Acme Solutions / Service Provider');
  const [firstPartyContact, setFirstPartyContact] = useState('+91 9876543210');
  const [firstPartyAddress, setFirstPartyAddress] = useState('Connaught Place, New Delhi, DL 110001, India');
  const [secondPartyName, setSecondPartyName] = useState('');
  const [secondPartyContact, setSecondPartyContact] = useState('');
  const [secondPartyAddress, setSecondPartyAddress] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(AGREEMENT_TEMPLATES[0].defaultAmount);
  const [currency, setCurrency] = useState('INR');
  const [validityPeriod, setValidityPeriod] = useState(AGREEMENT_TEMPLATES[0].validity);
  const [paymentTerms, setPaymentTerms] = useState(AGREEMENT_TEMPLATES[0].paymentTerms);
  const [stateJurisdiction, setStateJurisdiction] = useState('Delhi, India');
  const [stampDutyAmount, setStampDutyAmount] = useState(100);
  const [termsContent, setTermsContent] = useState(
    `${AGREEMENT_TEMPLATES[0].termsEn}\n\n${AGREEMENT_TEMPLATES[0].termsHi}`
  );

  // Geolocation and Media states
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>('Detecting location...');
  const [geoLoading, setGeoLoading] = useState(false);
  const [signerPhoto, setSignerPhoto] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAgreement, setCreatedAgreement] = useState<any | null>(null);

  // Auto-detect Geolocation on mount
  useEffect(() => {
    captureLocation();
  }, []);

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
      (err) => {
        setGeoAddress('Location capture permission denied / unavailable');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle template switch
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = AGREEMENT_TEMPLATES.find(t => t.id === tplId);
    if (tpl) {
      setTitle(tpl.title);
      setAgreementType(tpl.type);
      setTotalAmount(tpl.defaultAmount);
      setValidityPeriod(tpl.validity);
      setPaymentTerms(tpl.paymentTerms);
      updateTermsByLanguage(tpl, languageMode);
    }
  };

  const handleLanguageChange = (lang: 'bilingual' | 'en' | 'hi') => {
    setLanguageMode(lang);
    const tpl = AGREEMENT_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (tpl) {
      updateTermsByLanguage(tpl, lang);
    }
  };

  const updateTermsByLanguage = (tpl: typeof AGREEMENT_TEMPLATES[0], lang: 'bilingual' | 'en' | 'hi') => {
    if (lang === 'bilingual') {
      setTermsContent(`${tpl.termsEn}\n\n────────────────────────\n\n${tpl.termsHi}`);
    } else if (lang === 'en') {
      setTermsContent(tpl.termsEn);
    } else {
      setTermsContent(tpl.termsHi);
    }
  };

  // Photo capture
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

  // Submit and create agreement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      title,
      agreementType,
      firstPartyName,
      firstPartyContact,
      firstPartyAddress,
      secondPartyName,
      secondPartyContact,
      secondPartyAddress,
      totalAmount: Number(totalAmount || 0),
      currency,
      validityPeriod,
      paymentTerms,
      stateJurisdiction,
      stampDutyAmount: Number(stampDutyAmount || 100),
      termsContent,
      language: languageMode,
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
        // Public guest endpoint
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
              <span>Download e-Stamp PDF</span>
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
              Digital Legal Agreement &amp; Affidavit Studio
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Under HMorix Digital Legal Infrastructure • Indian e-Stamp &amp; Notary Notarization with GPS Geo-tagging
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.15)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Preset Agreement Selector */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Select Agreement Archetype
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
          {AGREEMENT_TEMPLATES.map(t => (
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
                {t.type}
              </h5>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }} className="text-truncate">
                {t.validity}
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
            <label className="form-label">Binding Terms &amp; Legal Clauses (Editable)</label>
            <textarea
              required
              rows={8}
              className="form-input"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', resize: 'vertical' }}
              value={termsContent}
              onChange={e => setTermsContent(e.target.value)}
            />
          </div>
        </div>

        {/* Live Location & Verification Security Capture */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            3. Digital Footprint, GPS Location &amp; Photo ID Capture
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
