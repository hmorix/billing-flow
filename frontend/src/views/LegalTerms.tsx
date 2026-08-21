import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FileText, Lock, Scale, Clock, ArrowLeft,
  CheckCircle2, Globe, AlertCircle, Printer, Download, Sparkles
} from 'lucide-react';
import { BillingFlowLogo } from '../components/BillingFlowLogo';

export const LegalTerms: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'estamp' | 'version'>('terms');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)', fontWeight: 800 }} className="text-gradient">
                  Legal Compliance, Terms &amp; Privacy Hub
                </h2>
                <span className="badge badge-info hide-mobile" style={{ fontSize: '0.7rem' }}>
                  Powered by HMorix Legal
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Official Terms of Service, DPDP/GDPR Data Privacy Policy &amp; Digital Legal Infrastructure Guidelines.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.8rem' }} onClick={() => window.print()}>
              <Printer size={14} /> Print Legal Copy
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-bar-scroll">
          <div style={{
            display: 'flex', background: 'var(--bg-tertiary)', padding: '4px',
            borderRadius: 'var(--radius-md)', gap: '4px', width: 'max-content', minWidth: '100%'
          }}>
            <button
              onClick={() => setActiveTab('terms')}
              className={`btn ${activeTab === 'terms' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
            >
              📜 Terms &amp; Conditions
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`btn ${activeTab === 'privacy' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
            >
              🛡️ Privacy Policy (DPDP / GDPR)
            </button>
            <button
              onClick={() => setActiveTab('estamp')}
              className={`btn ${activeTab === 'estamp' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
            >
              ⚖️ Digital e-Stamp &amp; Notary Rules
            </button>
            <button
              onClick={() => setActiveTab('version')}
              className={`btn ${activeTab === 'version' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
            >
              🔄 Version History &amp; Changelog
            </button>
          </div>
        </div>

        {/* Tab 1: Terms of Service */}
        {activeTab === 'terms' && (
          <div className="glass-card fade-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.7 }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Effective Date: August 2026</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px' }}>Master Terms &amp; Conditions of Service (सेवा की शर्तें)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Governed under the Information Technology Act, 2000 (India), Indian Contract Act, 1872, and Global Commercial Standards.
              </p>
            </div>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>1. Acceptance of Terms &amp; Tenant Eligibility</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                By registering an organization account, creating invoices, or generating digital legal agreements on BillingFlow (powered by HMorix), you represent and warrant that you are at least 18 years of age and possess full legal capacity to enter into legally binding contracts under the laws of your jurisdiction.
              </p>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>2. Electronic Records &amp; Non-Repudiation (इलेक्ट्रॉनिक अभिलेख व गैर-अस्वीकरण)</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                All agreements, invoices, timestamps, GPS geolocation tags, and cryptographic SHA-256 signatures generated via this platform constitute valid electronic records under Section 4 and Section 10A of the Information Technology Act, 2000 (India). Parties agree not to dispute the validity or enforceability of documents solely because they were executed electronically.
              </p>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>3. Payment Terms &amp; Deferred Billing Rules</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                For contracts generated under the "Work First, Pay Later" or "50-50 Milestone" structures, failure to disburse agreed payments within the specified timeframe shall incur late interest of 1.5% per month and may result in immediate suspension or revocation of intellectual property usage rights.
              </p>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>4. Dispute Resolution &amp; Jurisdiction (विवाद समाधान एवं क्षेत्राधिकार)</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Any dispute, controversy, or claim arising out of or relating to this platform or agreements executed herein shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India, and governed by the laws of India.
              </p>
            </section>
          </div>
        )}

        {/* Tab 2: Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="glass-card fade-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.7 }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>DPDP Act (India) &amp; GDPR Compliant</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px' }}>Privacy Policy &amp; Data Security (गोपनीयता नीति)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                How HMorix Legal &amp; FinTech Infrastructure collects, protects, and handles your billing, contract, and identity data.
              </p>
            </div>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>1. Data We Collect &amp; Process</h4>
              <ul style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Account Credentials:</strong> Full name, verified business email, organization slug, encrypted passwords.</li>
                <li><strong>Billing &amp; Invoice Data:</strong> Client contact details, line items, currency codes (INR default), tax identifiers.</li>
                <li><strong>Legal Execution Metadata:</strong> High-precision GPS coordinates (at time of contract signing), signer photos/ID attachments, SHA-256 digital hashes.</li>
              </ul>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>2. Zero Data Selling Policy</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                We strictly do <strong>not</strong> sell, rent, monetize, or disclose your client databases, invoices, or contract terms to any third-party advertisers or data brokers. All data belongs solely to the tenant organization.
              </p>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>3. Cryptographic Storage &amp; Encryption Standards</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                All sensitive data is encrypted in transit using TLS 1.3 and at rest using AES-256 standards. Agreement signatures and notarization records are sealed using irreversible SHA-256 cryptographic hashing.
              </p>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>4. Right to Data Erasure &amp; Portability</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Under the DPDP Act and GDPR, tenant administrators may request complete data export (JSON/CSV) or permanent account deletion at any time via the Settings console.
              </p>
            </section>
          </div>
        )}

        {/* Tab 3: Digital e-Stamp Policy */}
        {activeTab === 'estamp' && (
          <div className="glass-card fade-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.7 }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>e-Stamp &amp; Notarization Standards</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px' }}>Digital e-Stamp &amp; Witness Execution Guidelines</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Legal status of simulated e-Stamp paper, multi-party signatures, and non-repudiable audit trails.
              </p>
            </div>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)' }}>1. Nature of Simulated e-Stamp Header</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                The simulated Indian Government e-Stamp header generated on agreement PDFs provides a standardized, formal digital document format specifying State Jurisdiction and Stamp Duty fees. For transactions legally requiring physical non-judicial stamp duty under the Indian Stamp Act, 1899, users should affix registered treasury stamps.
              </p>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)' }}>2. Multi-Party Attestation on Every Page</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Every page of generated agreements includes formal signature spaces for the <strong>First Party (Authority)</strong>, <strong>Second Party (Customer)</strong>, <strong>Witness 1</strong>, and <strong>Witness 2</strong>, alongside the official circular <strong>HMorix Tamper-Evident Notary Stamp</strong>.
              </p>
            </section>

            <section>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)' }}>3. Non-Alteration Proof via QR &amp; Hash</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Any person scanning the QR code or visiting <code>/verify/:hash</code> can verify the original unedited terms, party names, timestamp, and GPS coordinates recorded at the moment of contract execution.
              </p>
            </section>
          </div>
        )}

        {/* Tab 4: Version History & Future Updates */}
        {activeTab === 'version' && (
          <div className="glass-card fade-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.7 }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Policy Version Control</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px' }}>Legal Terms Changelog &amp; Future Update Policy</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Transparent record of all legal, security, and policy modifications.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>Version 2.4.0 (Current Release)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>August 2026</span>
                </div>
                <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Added Devanagari Hindi Unicode font support for all legal contract PDFs.</li>
                  <li>Added 4-party attestation block (Authority + Customer + 2 Witnesses) on every PDF page.</li>
                  <li>Integrated official circular HMorix Notary Stamp and non-repudiation seals.</li>
                  <li>Implemented modular JSON agreement templates engine with dynamic API loading.</li>
                  <li>Enforced 50-item data pagination for ultra-fast performance without browser lag.</li>
                </ul>
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Version 2.0.0</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>July 2026</span>
                </div>
                <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Initial rollout of multi-tenant billing, 8+ PDF invoice templates, and Cloudflare D1 integration.</li>
                </ul>
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              🔔 <strong>Future Policy Notifications:</strong> Any material amendments to our Terms of Service or Privacy Policy will be notified via email to registered tenant administrators at least 15 calendar days prior to taking effect.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
