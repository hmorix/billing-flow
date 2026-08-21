import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, Copy, Check, ArrowLeft, Terminal, Shield, FileText,
  Users, Building, DollarSign, Send, Globe, KeyRound
} from 'lucide-react';
import { BillingFlowLogo } from '../components/BillingFlowLogo';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'Authentication' | 'Invoices' | 'Agreements & Notarization' | 'Clients' | 'Analytics';
  description: string;
  authRequired: boolean;
  headers?: Record<string, string>;
  requestBody?: any;
  responseBody: any;
  statusCodes: Array<{ code: number; description: string }>;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // ─── AUTH ───
  {
    category: 'Authentication',
    method: 'POST',
    path: '/api/auth/register',
    description: 'Register a new multi-tenant organization and administrator user.',
    authRequired: false,
    requestBody: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPassword123!',
      companyName: 'Acme Technologies LLC'
    },
    responseBody: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 'usr_89a12c',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        isVerified: false
      },
      organization: {
        id: 'org_55f89a',
        name: 'Acme Technologies LLC',
        subscriptionPlan: 'free',
        subscriptionStatus: 'active'
      }
    },
    statusCodes: [
      { code: 200, description: 'Organization registered successfully with active JWT token.' },
      { code: 400, description: 'Missing required parameters or email already registered.' }
    ]
  },
  {
    category: 'Authentication',
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate with email & password to obtain a bearer JWT session token.',
    authRequired: false,
    requestBody: {
      email: 'john@example.com',
      password: 'StrongPassword123!'
    },
    responseBody: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 'usr_89a12c',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin'
      }
    },
    statusCodes: [
      { code: 200, description: 'Session initialized successfully.' },
      { code: 401, description: 'Invalid email or password.' }
    ]
  },

  // ─── INVOICES ───
  {
    category: 'Invoices',
    method: 'GET',
    path: '/api/invoices',
    description: 'Retrieve all invoices for the authenticated organization.',
    authRequired: true,
    headers: { Authorization: 'Bearer <token>' },
    responseBody: [
      {
        id: 'inv_49a01b',
        invoice_number: 'INV-2026-0001',
        client_name: 'Acme Corp',
        issue_date: '2026-08-21',
        due_date: '2026-09-20',
        status: 'sent',
        currency: 'INR',
        tax_rate: 18,
        discount: 0,
        items: [
          { description: 'Cloud Architecture Setup', quantity: 1, unit_price: 50000 }
        ]
      }
    ],
    statusCodes: [
      { code: 200, description: 'List of tenant invoices.' },
      { code: 401, description: 'Unauthorized or missing token.' }
    ]
  },
  {
    category: 'Invoices',
    method: 'POST',
    path: '/api/invoices',
    description: 'Create a new invoice with line items, tax rate, and currency.',
    authRequired: true,
    headers: { Authorization: 'Bearer <token>', 'Content-Type': 'application/json' },
    requestBody: {
      clientId: 'cli_3840af',
      invoiceNumber: 'INV-0089',
      issueDate: '2026-08-21',
      dueDate: '2026-09-21',
      taxRate: 18,
      discount: 1000,
      currency: 'INR',
      notes: 'Payment via NEFT/RTGS. GST 18% applied.',
      items: [
        { description: 'Web Application Development', quantity: 40, unit_price: 1500 },
        { description: 'Database Tuning', quantity: 1, unit_price: 15000 }
      ]
    },
    responseBody: {
      id: 'inv_88b19a',
      invoice_number: 'INV-0089',
      status: 'draft',
      totalAmount: 87320,
      created_at: '2026-08-21T14:30:00Z'
    },
    statusCodes: [
      { code: 201, description: 'Invoice created successfully.' },
      { code: 400, description: 'Invalid input fields or missing client ID.' }
    ]
  },
  {
    category: 'Invoices',
    method: 'GET',
    path: '/api/invoices/:id/pdf',
    description: 'Export official styled invoice PDF with dynamic QR payment code.',
    authRequired: true,
    headers: { Authorization: 'Bearer <token>' },
    responseBody: 'Binary Stream: application/pdf (Content-Disposition: attachment; filename="Invoice_INV-0089.pdf")',
    statusCodes: [
      { code: 200, description: 'PDF stream.' },
      { code: 404, description: 'Invoice ID not found.' }
    ]
  },

  // ─── AGREEMENTS & NOTARIZATION ───
  {
    category: 'Agreements & Notarization',
    method: 'POST',
    path: '/api/agreements/public',
    description: 'Public unauthenticated endpoint to generate a legally sealed digital agreement.',
    authRequired: false,
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      title: 'Work First, Pay Later Agreement',
      agreementType: 'Work First Pay Later',
      firstPartyName: 'HMorix Tech Solutions',
      firstPartyContact: '+91 9876543210',
      secondPartyName: 'Apex Enterprises LLC',
      secondPartyContact: '+91 9123456780',
      totalAmount: 45000,
      currency: 'INR',
      validityPeriod: '30 Days',
      paymentTerms: '100% due within 7 days of delivery',
      termsContent: 'Binding legal terms in Hindi and English...',
      stateJurisdiction: 'Delhi, India',
      stampDutyAmount: 100,
      geoLat: 28.6139,
      geoLng: 77.2090,
      geoAddress: 'New Delhi, DL, India'
    },
    responseBody: {
      id: 'agr_99b01a',
      agreement_number: 'HM-AGR-881920',
      digital_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'executed',
      verification_url: 'https://billingflow.hmorix.com/verify/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    statusCodes: [
      { code: 201, description: 'Agreement legally signed and sealed with SHA-256 digital fingerprint.' },
      { code: 400, description: 'Missing required contract terms or party names.' }
    ]
  },
  {
    category: 'Agreements & Notarization',
    method: 'GET',
    path: '/api/agreements/verify/:hash',
    description: 'Public cryptographic validation endpoint for verifying agreement integrity.',
    authRequired: false,
    responseBody: {
      verified: true,
      message: 'Official Legal Agreement Verified & Authenticated by HMorix Legal Infrastructure.',
      agreement: {
        agreementNumber: 'HM-AGR-881920',
        title: 'Work First, Pay Later Agreement',
        firstParty: 'HMorix Tech Solutions',
        secondParty: 'Apex Enterprises LLC',
        totalAmount: 45000,
        currency: 'INR',
        digitalHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        geoAddress: 'New Delhi, DL, India',
        executedAt: '2026-08-21T14:45:00Z'
      }
    },
    statusCodes: [
      { code: 200, description: 'Document verified.' },
      { code: 404, description: 'Digital hash not found or document was altered.' }
    ]
  },
  {
    category: 'Agreements & Notarization',
    method: 'GET',
    path: '/api/agreements/:id/pdf',
    description: 'Download signed PDF with simulated Indian e-Stamp Paper header and QR code.',
    authRequired: false,
    responseBody: 'Binary Stream: application/pdf (Content-Disposition: attachment; filename="Agreement_HM-AGR-881920.pdf")',
    statusCodes: [
      { code: 200, description: 'Signed e-Stamp PDF.' },
      { code: 404, description: 'Agreement ID not found.' }
    ]
  },

  // ─── CLIENTS ───
  {
    category: 'Clients',
    method: 'GET',
    path: '/api/clients',
    description: 'Fetch client contact and billing directory.',
    authRequired: true,
    headers: { Authorization: 'Bearer <token>' },
    responseBody: [
      {
        id: 'cli_3840af',
        name: 'Jane Smith',
        email: 'jane@acme.com',
        company_name: 'Acme Corp',
        tax_id: 'US87654321',
        phone: '+1 555 0192',
        address: '100 Broadway, New York, NY'
      }
    ],
    statusCodes: [{ code: 200, description: 'Client records.' }]
  },
  {
    category: 'Clients',
    method: 'POST',
    path: '/api/clients',
    description: 'Register a new customer profile.',
    authRequired: true,
    headers: { Authorization: 'Bearer <token>', 'Content-Type': 'application/json' },
    requestBody: {
      name: 'Rohan Sharma',
      email: 'rohan@enterprise.in',
      companyName: 'Sharma & Sons Ltd',
      taxId: '07AAAAA0000A1Z5',
      phone: '+91 9811122233',
      address: 'Sector 62, Noida, UP 201309, India'
    },
    responseBody: {
      id: 'cli_91a02c',
      name: 'Rohan Sharma',
      created_at: '2026-08-21T14:50:00Z'
    },
    statusCodes: [{ code: 201, description: 'Client profile registered.' }]
  },

  // ─── ANALYTICS ───
  {
    category: 'Analytics',
    method: 'GET',
    path: '/api/analytics/dashboard',
    description: 'Fetch monthly collections, MRR, balance due, and status distribution.',
    authRequired: true,
    headers: { Authorization: 'Bearer <token>' },
    responseBody: {
      totalRevenue: 345000,
      totalPending: 85000,
      totalOverdue: 25000,
      totalInvoicesCount: 42,
      counts: { draft: 5, sent: 12, paid: 23, overdue: 2 }
    },
    statusCodes: [{ code: 200, description: 'Real-time analytics summary.' }]
  }
];

export const ApiDocs: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const categories = ['All', 'Authentication', 'Invoices', 'Agreements & Notarization', 'Clients', 'Analytics'];

  const filtered = selectedCategory === 'All'
    ? API_ENDPOINTS
    : API_ENDPOINTS.filter(e => e.category === selectedCategory);

  const handleCopyCurl = (ep: ApiEndpoint) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.billingflow.hmorix.com';
    let curl = `curl -X ${ep.method} "${apiUrl}${ep.path}"`;
    if (ep.authRequired) curl += ` \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN"`;
    if (ep.requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.requestBody)}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedPath(ep.method + ep.path);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)', fontWeight: 800 }} className="text-gradient">
                  REST API &amp; Webhook Documentation
                </h2>
                <span className="badge badge-info hide-mobile" style={{ fontSize: '0.7rem' }}>
                  Powered by HMorix
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Interact programmatically with Invoicing, Legal Agreements, e-Stamps, and Verification systems.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <code style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--primary)' }}>
              Base URL: {import.meta.env.VITE_API_URL || 'https://api.billingflow.hmorix.com'}
            </code>
          </div>
        </div>

        {/* Category Pills */}
        <div className="tab-bar-scroll">
          <div style={{ display: 'flex', gap: '6px', width: 'max-content' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map((ep, idx) => {
            const isCopied = copiedPath === ep.method + ep.path;
            return (
              <div key={idx} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Endpoint Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem',
                      background: ep.method === 'GET' ? 'rgba(16,185,129,0.15)' : ep.method === 'POST' ? 'rgba(99,102,241,0.15)' : ep.method === 'PUT' ? 'rgba(217,119,6,0.15)' : 'rgba(239,68,68,0.15)',
                      color: ep.method === 'GET' ? 'var(--success)' : ep.method === 'POST' ? 'var(--primary)' : ep.method === 'PUT' ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {ep.method}
                    </span>
                    <code style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ep.path}</code>
                    {ep.authRequired ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <KeyRound size={10} /> Auth Required (JWT)
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                        Public Endpoint
                      </span>
                    )}
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleCopyCurl(ep)}
                  >
                    {isCopied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    <span>{isCopied ? 'cURL Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {ep.description}
                </p>

                {/* Request Payload (if any) */}
                {ep.requestBody && (
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Request Input Payload (application/json)
                    </span>
                    <pre style={{
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                      padding: '12px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-primary)',
                      overflowX: 'auto', marginTop: '6px', margin: '6px 0 0 0'
                    }}>
                      {JSON.stringify(ep.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Outcome */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Response Output Outcome
                  </span>
                  <pre style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                    padding: '12px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-primary)',
                    overflowX: 'auto', marginTop: '6px', margin: '6px 0 0 0'
                  }}>
                    {typeof ep.responseBody === 'string' ? ep.responseBody : JSON.stringify(ep.responseBody, null, 2)}
                  </pre>
                </div>

                {/* HTTP Status Codes */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.75rem' }}>
                  {ep.statusCodes.map(sc => (
                    <span key={sc.code} style={{ color: sc.code < 300 ? 'var(--success)' : 'var(--danger)' }}>
                      <strong>{sc.code}</strong>: {sc.description}
                    </span>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
