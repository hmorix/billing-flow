import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { BillingFlowLogo } from '../components/BillingFlowLogo';
import {
  FileText, ShieldCheck, Sparkles, ArrowRight, CheckCircle2,
  Share2, Globe, Lock, Zap, Code2, Database, DollarSign,
  Sun, Moon, Users, ChevronRight, Check, MapPin, Camera
} from 'lucide-react';
import { formatCurrency, type SupportedCurrency } from '../utils/i18n';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'invoice' | 'agreement' | 'whatsapp' | 'api'>('invoice');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BillingFlowLogo size={34} subtext="Powered by HMorix" />
          <div className="hide-mobile" style={{ display: 'flex', gap: '20px', marginLeft: '24px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
            <Link to="/agreements/new" style={{ color: 'inherit', textDecoration: 'none' }}>Digital Agreements</Link>
            <Link to="/api-docs" style={{ color: 'inherit', textDecoration: 'none' }}>API Docs</Link>
            <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={toggleTheme} className="theme-toggle-btn" style={{ padding: '8px', borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
          </button>
          <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem' }} onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn btn-primary hide-mobile" style={{ padding: '7px 16px', fontSize: '0.85rem' }} onClick={() => navigate('/login')}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section style={{
        padding: 'clamp(40px, 8vw, 80px) 20px 40px',
        maxWidth: '1200px', margin: '0 auto', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
      }}>
        {/* Powered by HMorix Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.1))',
          border: '1px solid rgba(99,102,241,0.25)',
          padding: '6px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)'
        }}>
          <Sparkles size={14} />
          <span>Next-Gen FinTech &amp; Legal Infrastructure • Powered by <strong>HMorix</strong></span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5.5vw, 3.6rem)', fontWeight: 900,
          lineHeight: 1.15, maxWidth: '920px', margin: 0
        }}>
          Enterprise Invoicing &amp; <span className="text-gradient">Digital Legal Agreements</span> Built for Scale
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', color: 'var(--text-secondary)',
          maxWidth: '720px', lineHeight: 1.6, margin: 0
        }}>
          Complete multi-tenant billing manager with 8+ PDF styles, bilingual Indian e-Stamp legal contracts, GPS location stamps, WhatsApp automation, and developer-first API endpoints.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/login')}
          >
            <span>Start Free Trial</span>
            <ArrowRight size={18} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '14px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/agreements/new')}
          >
            <ShieldCheck size={18} color="var(--primary)" />
            <span>Create Legal Agreement (No Signup)</span>
          </button>
        </div>

        {/* Feature Pill Tags */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
          {['INR ₹ Default for India', 'Bilingual Hindi & English', 'SHA-256 Tamper-Proof Stamp', 'WhatsApp Dispatch', 'REST API & Webhooks', 'GPS Geo-Tagging'].map(tag => (
            <span key={tag} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', color: 'var(--text-muted)'
            }}>
              ✓ {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ─── INTERACTIVE LIVE SHOWCASE TAB SECTION ─── */}
      <section style={{ maxWidth: '1100px', margin: '20px auto 60px', padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tab Switcher */}
          <div className="tab-bar-scroll">
            <div style={{
              display: 'flex', background: 'var(--bg-tertiary)', padding: '4px',
              borderRadius: 'var(--radius-md)', gap: '4px', width: 'max-content', minWidth: '100%'
            }}>
              <button
                onClick={() => setActiveTab('invoice')}
                className={`btn ${activeTab === 'invoice' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
              >
                📄 Multi-Currency Invoice (INR ₹ / USD)
              </button>
              <button
                onClick={() => setActiveTab('agreement')}
                className={`btn ${activeTab === 'agreement' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
              >
                📜 Indian e-Stamp Legal Agreement
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`btn ${activeTab === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
              >
                💬 WhatsApp Formatted Dispatch
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`btn ${activeTab === 'api' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 16px', fontSize: '0.82rem' }}
              >
                ⚡ REST API &amp; JSON Endpoints
              </button>
            </div>
          </div>

          {/* Tab 1: Invoice Preview */}
          {activeTab === 'invoice' && (
            <div className="fade-in" style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>HMORIX ENTERPRISE</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Billed to: Acme Corp International</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>INV-2026-0042</div>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>INR ₹ / Multi-Currency</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr', gap: '10px', fontSize: '0.82rem', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                <span>Item Description</span><span>Qty</span><span style={{ textAlign: 'right' }}>Total</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr', gap: '10px', fontSize: '0.82rem' }}>
                <span>Full-Stack SaaS Platform Architecture &amp; Deployment</span><span>1</span><span style={{ textAlign: 'right' }}>₹ 1,50,000.00</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr', gap: '10px', fontSize: '0.82rem' }}>
                <span>Multi-Tenant Legal &amp; e-Stamp Agreement Engine</span><span>1</span><span style={{ textAlign: 'right' }}>₹ 75,000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount Due (GST 18% Incl.)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>₹ 2,65,500.00</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Legal Agreement Preview */}
          {activeTab === 'agreement' && (
            <div className="fade-in" style={{
              background: '#fffdfa', color: '#1f2937', border: '2px solid #be123c',
              borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'serif'
            }}>
              {/* e-Stamp Header */}
              <div style={{ background: '#881337', color: '#fff', padding: '8px', textAlign: 'center', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.5px' }}>GOVERNMENT OF NATIONAL CAPITAL TERRITORY OF DELHI</div>
                <div style={{ fontSize: '0.68rem', color: '#fecdd3' }}>e-Stamp Certificate • Non-Judicial Non-Repudiable Agreement</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                <div><strong>Certificate No:</strong> IN-DL2026-9812450012</div>
                <div><strong>Stamp Duty:</strong> ₹ 100.00 (One Hundred Only)</div>
                <div><strong>First Party:</strong> SERVICE PROVIDER (HMORIX)</div>
                <div><strong>Second Party:</strong> CLIENT ORGANISATION</div>
              </div>
              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                WORK FIRST, PAY LATER AGREEMENT / कार्य पश्चात भुगतान अनुबंध
              </div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: '#374151' }}>
                "The Second Party agrees to disburse the agreed milestone consideration upon receipt and acceptance of deliverables. This document is authenticated with GPS Geolocation (28.6139° N, 77.2090° E) &amp; SHA-256 digital stamp under HMorix."
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem' }}>
                <span>🔒 SHA-256: <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ Verified Tamper-Proof</span>
              </div>
            </div>
          )}

          {/* Tab 3: WhatsApp Preview */}
          {activeTab === 'whatsapp' && (
            <div className="fade-in" style={{
              background: '#0b141a', color: '#e9edef', borderRadius: '12px', padding: '20px',
              maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'sans-serif'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #202c33', paddingBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>BillingFlow WhatsApp Assistant</div>
                  <div style={{ fontSize: '0.72rem', color: '#8696a0' }}>One-click formatted dispatch (No payment link)</div>
                </div>
              </div>
              <div style={{ background: '#202c33', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', lineHeight: 1.5 }}>
                📄 *INVOICE NOTIFICATION — INV-2026-0042*<br />
                ────────────────────────<br />
                Dear *Acme Corp*,<br />
                Greetings from *HMorix Enterprise*.<br />
                • *Total Due:* *₹ 2,65,500.00*<br />
                • *Due Date:* 30-Aug-2026<br />
                • *Deliverables:* SaaS Platform Architecture<br />
                ────────────────────────<br />
                _Generated via BillingFlow • Powered by HMorix_
              </div>
            </div>
          )}

          {/* Tab 4: API Explorer Preview */}
          {activeTab === 'api' && (
            <div className="fade-in" style={{
              background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-info" style={{ fontWeight: 800 }}>POST</span>
                <code style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>/api/agreements/public</code>
              </div>
              <pre style={{
                background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px',
                fontSize: '0.75rem', color: 'var(--text-primary)', overflowX: 'auto', margin: 0
              }}>
{`{
  "title": "Work First Pay Later Agreement",
  "agreementType": "Work First Pay Later",
  "firstPartyName": "HMorix Tech",
  "secondPartyName": "Client LLC",
  "totalAmount": 25000,
  "currency": "INR",
  "stampDutyAmount": 100,
  "stateJurisdiction": "Delhi, India",
  "termsContent": "Binding bilingual legal terms..."
}`}
              </pre>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Response: 201 Created (SHA-256 Sealed)</span>
                <Link to="/api-docs" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                  Open Full Interactive API Explorer →
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800 }}>
            Engineered for Modern Global &amp; Indian Enterprises
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Everything you need to bill clients, secure contracts, and collect payments.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Bilingual Legal Agreements</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Draft "Work First Pay Later", "50-50 Milestone", and "SLA Validity" contracts in Hindi and English with simulated Indian e-Stamp Paper.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>GPS Geo-Tagging &amp; Photo ID</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Embed live device camera photo verification and exact GPS latitude/longitude coordinates directly into legal contracts.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Multi-Currency &amp; Languages</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Default Indian Rupee (INR ₹) plus USD, EUR, GBP, AED, and JPY. Support for Hindi, Spanish, French, German, and Arabic.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(217,119,6,0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>WhatsApp Clean Dispatch</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Send beautifully structured invoice summaries and agreement notices via WhatsApp without forced payment links.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>SHA-256 Tamper-Proof Seal</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Every document is assigned a unique cryptographic digital hash. Scan the QR code to verify validity even after physical printing.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Developer REST API</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Seamlessly generate invoices, trigger email reminders, and verify agreements programmatically with full API documentation.
            </p>
          </div>

        </div>
      </section>

      {/* ─── PRICING TIERS ─── */}
      <section id="pricing" style={{ maxWidth: '1100px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800 }}>Simple, Transparent Pricing</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Choose the right tier for your organization or start free.
          </p>
        </div>

        <div className="billing-plans-grid">
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Starter Free</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>For freelancers &amp; solo founders</p>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px' }}>$0 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ mo</span></div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>✓ 10 Invoices total</li>
              <li>✓ 3 Clients Maximum</li>
              <li>✓ Public Legal Agreements</li>
              <li>✓ Standard PDF templates</li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={() => navigate('/login')}>
              Get Started Free
            </button>
          </div>

          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', border: '2px solid var(--primary)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Growth Professional</h4>
                <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>Popular</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>For growing agencies &amp; studios</p>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px' }}>$49 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ mo</span></div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>✓ Unlimited Invoices &amp; Clients</li>
              <li>✓ Unlimited Legal Agreements &amp; e-Stamps</li>
              <li>✓ WhatsApp Automation</li>
              <li>✓ Custom Template Builder</li>
              <li>✓ Email Reminder Automations</li>
            </ul>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={() => navigate('/login')}>
              Upgrade to Growth
            </button>
          </div>

          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Enterprise Scale</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>For corporate multi-entity brands</p>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px' }}>$199 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ mo</span></div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>✓ Everything in Growth</li>
              <li>✓ Dedicated API Key &amp; Webhooks</li>
              <li>✓ Custom Indian e-Stamp Jurisdictions</li>
              <li>✓ 24/7 Priority SLA &amp; Support</li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={() => navigate('/login')}>
              Contact Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER & CREDIT ─── */}
      <footer style={{
        background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)',
        padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
      }}>
        <BillingFlowLogo size={32} subtext="Powered by HMorix" />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: 0 }}>
          Designed and engineered for high-growth enterprises and global professionals. Powered by <strong>HMorix Legal &amp; FinTech Infrastructure</strong>.
        </p>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Link to="/api-docs" style={{ color: 'inherit', textDecoration: 'none' }}>API Reference</Link>
          <Link to="/agreements/new" style={{ color: 'inherit', textDecoration: 'none' }}>Create Agreement</Link>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Tenant Sign In</Link>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          © {new Date().getFullYear()} BillingFlow. All rights reserved. Powered by HMorix.
        </span>
      </footer>

    </div>
  );
};
