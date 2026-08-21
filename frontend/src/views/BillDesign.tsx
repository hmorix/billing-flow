import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Palette, CheckCircle2, ShieldAlert, Sparkles, Plus,
  Rocket, FileText, Trash2, Edit2, Clock, Globe, RefreshCw
} from 'lucide-react';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  typography: string;
  badge: string;
  backgroundColor: string;
}

interface CustomTemplate {
  id: string;
  name: string;
  status: 'draft' | 'published';
  config: string;
  created_at: string;
  updated_at: string;
}

const BUILT_IN_TEMPLATES: TemplateOption[] = [
  {
    id: 'modern_purple',
    name: 'Modern Purple',
    description: 'Clean, modern layout with soft indigo accents, address cards, and generous white space. Perfect for SaaS & consulting.',
    primaryColor: '#6366f1',
    typography: 'Helvetica',
    badge: 'Default · Clean',
    backgroundColor: '#ffffff'
  },
  {
    id: 'minimalist_dark',
    name: 'Minimalist Dark',
    description: 'High-contrast design with a deep slate sidebar, structured layout, and scan-to-pay QR code area.',
    primaryColor: '#0f172a',
    typography: 'Helvetica Modern',
    badge: 'High Contrast',
    backgroundColor: '#f1f5f9'
  },
  {
    id: 'retro_bold',
    name: 'Retro Bold',
    description: 'Vintage typewriter style on warm cream with rich crimson rules, Courier monospaced grid, and signature seal.',
    primaryColor: '#be123c',
    typography: 'Courier Monospace',
    badge: 'Vintage Grid',
    backgroundColor: '#faf8f5'
  },
  {
    id: 'corporate_crimson',
    name: 'Corporate Crimson',
    description: 'Executive purchase-order layout with burgundy header bars, shipping terms grid, and authorized signature block.',
    primaryColor: '#881337',
    typography: 'Helvetica Formal',
    badge: 'Corporate PO',
    backgroundColor: '#ffffff'
  },
  {
    id: 'emerald_clean',
    name: 'Emerald Clean',
    description: 'Crisp tech-startup style with emerald green accents, mint row highlights, and top accent bar. Great for agencies.',
    primaryColor: '#059669',
    typography: 'Helvetica',
    badge: 'Tech · Agency',
    backgroundColor: '#ffffff'
  },
  {
    id: 'ocean_breeze',
    name: 'Ocean Breeze',
    description: 'Azure cyan corporate lines with a clean two-tone layout, bold invoice number block, and sky-blue row fills.',
    primaryColor: '#0284c7',
    typography: 'Helvetica',
    badge: 'Corporate · Azure',
    backgroundColor: '#ffffff'
  },
  {
    id: 'monochrome_luxury',
    name: 'Monochrome Luxury',
    description: 'High-fashion minimal black & white with uppercase typography, razor-thin rules, and luxury brand aesthetics.',
    primaryColor: '#09090b',
    typography: 'Helvetica (Uppercase)',
    badge: 'Luxury · Mono',
    backgroundColor: '#ffffff'
  },
  {
    id: 'golden_elegance',
    name: 'Golden Elegance',
    description: 'Warm ivory background with rich amber gold accents, golden row highlights, and estate-level warmth.',
    primaryColor: '#b45309',
    typography: 'Helvetica',
    badge: 'Luxury · Gold',
    backgroundColor: '#fffbeb'
  },
  {
    id: 'sidebar_mono',
    name: 'Sidebar Monochrome',
    description: 'Dark left sidebar with QR code area, dates and client info in panel. Clean white body with large INVOICE title and detailed footer.',
    primaryColor: '#1a1a1a',
    typography: 'Helvetica Clean',
    badge: 'QR · Sidebar',
    backgroundColor: '#ffffff'
  },
  {
    id: 'clean_purple_pro',
    name: 'Clean Purple Pro',
    description: 'Circle logo mark top-left, large bold INVOICE header, purple table headers with clean line-separated rows and colored totals.',
    primaryColor: '#4338ca',
    typography: 'Helvetica Modern',
    badge: 'Corporate · Purple',
    backgroundColor: '#ffffff'
  },
  {
    id: 'orange_accent',
    name: 'Orange Accent',
    description: 'Brand name top-left with geometric orange corner accents, bold INVOICE in orange, QTY-first table columns and orange GRAND TOTAL box.',
    primaryColor: '#f97316',
    typography: 'Helvetica',
    badge: 'Bold · Orange',
    backgroundColor: '#ffffff'
  },
  {
    id: 'navy_geometric',
    name: 'Navy Geometric',
    description: 'Full-width dark navy header with geometric circle motifs, left payment sidebar, items table, and navy footer bar with contact info.',
    primaryColor: '#1e3a5f',
    typography: 'Helvetica',
    badge: 'Geometric · Navy',
    backgroundColor: '#ffffff'
  },
  {
    id: 'teal_corporate',
    name: 'Teal Corporate',
    description: 'Dark charcoal top-left block for company, teal right header with invoice details, numbered item rows, and teal total bar. Executive look.',
    primaryColor: '#00897b',
    typography: 'Helvetica',
    badge: 'Teal · Executive',
    backgroundColor: '#ffffff'
  }
];

// ─── Mini Invoice Preview ─────────────────────────────────────────────────────
const MiniInvoicePreview: React.FC<{ tpl: TemplateOption }> = ({ tpl }) => {
  const isRetro = tpl.id === 'retro_bold';
  const isGolden = tpl.id === 'golden_elegance';

  return (
    <div style={{
      height: '165px', background: tpl.backgroundColor, borderRadius: '6px',
      border: '1px solid var(--border-color)',
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
      padding: '10px', overflow: 'hidden', position: 'relative',
      fontFamily: isRetro ? 'Courier New, monospace' : 'sans-serif', fontSize: '5px', color: '#1f2937'
    }}>

      {/* ── 1. Modern Purple ── */}
      {tpl.id === 'modern_purple' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: tpl.primaryColor, fontSize: '6px' }}>ACME CORP</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ background: '#059669', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '4px', fontWeight: 'bold' }}>PAID</div>
              <span style={{ fontWeight: 'bold', fontSize: '7px', color: tpl.primaryColor }}>INVOICE</span>
            </div>
          </div>
          <div style={{ height: '0.5px', background: '#e5e7eb', marginBottom: '4px' }} />
          <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
            <div style={{ flex: 1, background: '#f8fafc', padding: '3px', borderRadius: '2px' }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', marginBottom: '1px' }}>FROM</div>
              <div style={{ fontWeight: 'bold' }}>Acme Corp</div>
              <div style={{ color: '#6b7280' }}>123 Main St</div>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', padding: '3px', borderRadius: '2px' }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', marginBottom: '1px' }}>TO</div>
              <div style={{ fontWeight: 'bold' }}>John Doe</div>
              <div style={{ color: '#6b7280' }}>456 Oak Ave</div>
            </div>
          </div>
          <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderRadius: '2px', marginBottom: '2px' }}>
            <span>Description</span><span>Total</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
            <span>Consulting Service</span><span>$1,500.00</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', background: '#f5f3ff', borderBottom: '1px solid #f3f4f6' }}>
            <span>Design Work</span><span>$800.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 7px', borderRadius: '2px', fontWeight: 'bold' }}>TOTAL: $2,300.00</div>
          </div>
        </>
      )}

      {/* ── 2. Minimalist Dark ── */}
      {tpl.id === 'minimalist_dark' && (
        <div style={{ display: 'flex', height: '100%', margin: '-10px' }}>
          <div style={{ width: '33%', background: '#0f172a', color: '#94a3b8', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '2px' }} />
            <div style={{ background: '#059669', color: '#fff', padding: '1px 3px', borderRadius: '2px', fontSize: '4px', fontWeight: 'bold', display: 'inline-block' }}>PAID</div>
            <div><div style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '4px' }}>DATE</div><div>Jul 22, 2026</div></div>
            <div><div style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '4px' }}>BILLED TO</div><div style={{ color: '#fff' }}>John Doe</div></div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ border: '0.5px solid #475569', width: '24px', height: '24px', borderRadius: '2px' }} />
              <div style={{ fontSize: '4px', color: '#64748b', marginTop: '2px' }}>Scan to Pay</div>
            </div>
          </div>
          <div style={{ width: '67%', padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '5.5px', color: '#0f172a' }}>Acme Corporation</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', lineHeight: 1 }}>INVOICE</div>
            <div style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '2px', fontSize: '4px', color: '#475569', marginBottom: '2px' }}>INV-2026-001 · USD</div>
            <div style={{ background: '#0f172a', color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Item</span><span>Total</span>
            </div>
            <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e2e8f0' }}>
              <span>Consulting</span><span>$1,500</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold', color: '#0f172a', paddingTop: '2px' }}>
              Total: $1,500.00
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Retro Bold ── */}
      {tpl.id === 'retro_bold' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: tpl.primaryColor, lineHeight: 1 }}>INVOICE</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '5.5px' }}>ACME &amp; CO.</div>
              <div style={{ color: '#3f3f46', fontSize: '4px' }}>123 MAIN ST</div>
            </div>
          </div>
          <div style={{ height: '1px', background: '#18181b', marginBottom: '2px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '4.5px', marginBottom: '3px', fontWeight: 'bold' }}>
            <span>INV NO: #001</span><span>DATE: 22 JUL 2026</span>
          </div>
          <div style={{ height: '0.5px', background: '#18181b', marginBottom: '3px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #18181b' }}>
            <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px solid #18181b' }}>
              <div style={{ width: '55%', padding: '2px 3px', borderRight: '1px solid #18181b' }}>DESCRIPTION</div>
              <div style={{ width: '20%', padding: '2px', borderRight: '1px solid #18181b', textAlign: 'center' }}>QTY</div>
              <div style={{ width: '25%', padding: '2px 3px', textAlign: 'right' }}>SUBTOTAL</div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #18181b' }}>
              <div style={{ width: '55%', padding: '2px 3px', borderRight: '1px solid #18181b' }}>CONSULTING</div>
              <div style={{ width: '20%', padding: '2px', borderRight: '1px solid #18181b', textAlign: 'center' }}>1</div>
              <div style={{ width: '25%', padding: '2px 3px', textAlign: 'right' }}>$1,500</div>
            </div>
            <div style={{ display: 'flex', fontWeight: 'bold' }}>
              <div style={{ width: '75%', padding: '2px 3px', borderRight: '1px solid #18181b', textAlign: 'right', color: tpl.primaryColor }}>GRAND TOTAL</div>
              <div style={{ width: '25%', padding: '2px 3px', textAlign: 'right', color: tpl.primaryColor }}>$1,500</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3px' }}>
            <div style={{ borderTop: '0.5px solid #18181b', width: '55px', textAlign: 'center', paddingTop: '1px', color: '#18181b' }}>AUTH SIGNATURE</div>
          </div>
        </>
      )}

      {/* ── 4. Corporate Crimson ── */}
      {tpl.id === 'corporate_crimson' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <span style={{ fontWeight: 'bold', color: tpl.primaryColor, fontSize: '5.5px' }}>ACME STATIONERY</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ background: '#059669', color: '#fff', padding: '1px 3px', borderRadius: '2px', fontSize: '4px', fontWeight: 'bold' }}>PAID</div>
              <span style={{ fontSize: '4.5px', color: tpl.primaryColor }}>Jul 22, 2026</span>
            </div>
          </div>
          <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 5px', fontWeight: 'bold', fontSize: '5.5px', marginBottom: '3px' }}>
            INVOICE / PO #1258820
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
            <div style={{ flex: 1, fontSize: '4px', color: '#4b5563' }}><span style={{ fontWeight: 'bold', color: tpl.primaryColor }}>BILL TO: </span>John Doe</div>
            <div style={{ flex: 1, fontSize: '4px', color: '#4b5563' }}><span style={{ fontWeight: 'bold', color: tpl.primaryColor }}>ISSUED BY: </span>Acme Corp</div>
          </div>
          <div style={{ display: 'flex', background: '#f8fafc', padding: '2px', marginBottom: '3px', justifyContent: 'space-between', fontSize: '4px' }}>
            <span>STD DELIVERY</span><span>NET 30</span><span>USD</span><span>Aug 22</span>
          </div>
          <div>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>DESCRIPTION</span><span>TOTAL</span>
            </div>
            <div style={{ padding: '2px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Consulting Service</span><span>$1,500.00</span>
            </div>
            <div style={{ padding: '2px', display: 'flex', justifyContent: 'space-between', background: '#fff1f2' }}>
              <span>Design Work</span><span>$800.00</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 6px', fontSize: '4.5px', fontWeight: 'bold' }}>TOTAL DUE: $2,300.00</div>
          </div>
        </>
      )}

      {/* ── 5. Emerald Clean ── */}
      {tpl.id === 'emerald_clean' && (
        <>
          <div style={{ height: '4px', background: tpl.primaryColor, margin: '-10px -10px 8px', borderRadius: '6px 6px 0 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold', color: tpl.primaryColor, fontSize: '6px' }}>ACME AGENCY</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ background: '#059669', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '4px', fontWeight: 'bold' }}>PAID</div>
              <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#0f172a' }}>INVOICE</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
            <div style={{ flex: 1, background: '#ecfdf5', padding: '3px', borderRadius: '2px' }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px' }}>ISSUED BY</div>
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Acme Agency</div>
            </div>
            <div style={{ flex: 1, background: '#ecfdf5', padding: '3px', borderRadius: '2px' }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px' }}>PREPARED FOR</div>
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>John Doe</div>
            </div>
          </div>
          <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderRadius: '2px', marginBottom: '2px' }}>
            <span>Description</span><span>Amount</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e2e8f0' }}>
            <span>Web Development</span><span>$3,200.00</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', background: '#f0fdf4', borderBottom: '0.5px solid #e2e8f0' }}>
            <span>SEO Audit</span><span>$500.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 7px', borderRadius: '2px', fontWeight: 'bold' }}>TOTAL DUE: $3,700.00</div>
          </div>
        </>
      )}

      {/* ── 6. Ocean Breeze ── */}
      {tpl.id === 'ocean_breeze' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: tpl.primaryColor, fontSize: '6px' }}>AZURE TECH</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ background: '#d97706', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '4px', fontWeight: 'bold' }}>UNPAID</div>
              <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#0369a1' }}>INVOICE</span>
            </div>
          </div>
          <div style={{ height: '1.5px', background: tpl.primaryColor, marginBottom: '5px', borderRadius: '1px' }} />
          <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px' }}>CLIENT INFORMATION</div>
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>John Doe</div>
              <div style={{ color: '#475569', fontSize: '4px' }}>456 Oak Ave</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px' }}>PAYMENT DETAILS</div>
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Azure Tech Ltd</div>
              <div style={{ color: '#475569', fontSize: '4px' }}>Bank: 9876-5432-10</div>
            </div>
          </div>
          <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderRadius: '2px', marginBottom: '2px' }}>
            <span>Item</span><span>Total</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e2e8f0' }}>
            <span>Cloud Hosting</span><span>$220.00</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', background: '#f0f9ff', borderBottom: '0.5px solid #e2e8f0' }}>
            <span>SSL Certificate</span><span>$80.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 7px', borderRadius: '2px', fontWeight: 'bold' }}>AMOUNT DUE: $300.00</div>
          </div>
        </>
      )}

      {/* ── 7. Monochrome Luxury ── */}
      {tpl.id === 'monochrome_luxury' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#09090b', fontSize: '6.5px', letterSpacing: '0.3px' }}>ACME MAISON</div>
              <div style={{ color: '#71717a', fontSize: '4px' }}>LUXURY ENTERPRISE</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: '#059669', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '4px', fontWeight: 'bold', display: 'inline-block', marginBottom: '2px' }}>PAID</div>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#09090b' }}>INVOICE</div>
            </div>
          </div>
          <div style={{ height: '1.5px', background: '#09090b', marginBottom: '5px' }} />
          <div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#09090b', fontWeight: 'bold', fontSize: '4px', letterSpacing: '0.4px' }}>PREPARED FOR</div>
              <div style={{ fontWeight: 'bold', color: '#09090b', letterSpacing: '0.2px' }}>JOHN DOE</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#09090b', fontWeight: 'bold', fontSize: '4px', letterSpacing: '0.4px' }}>ISSUED BY</div>
              <div style={{ fontWeight: 'bold', color: '#09090b', letterSpacing: '0.2px' }}>ACME MAISON</div>
            </div>
          </div>
          <div style={{ background: '#09090b', color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '2px' }}>
            <span>DESCRIPTION</span><span>AMOUNT</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e4e4e7', letterSpacing: '0.15px' }}>
            <span>BRAND IDENTITY</span><span>$8,500.00</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e4e4e7', letterSpacing: '0.15px' }}>
            <span>STRATEGY DECK</span><span>$2,000.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <div style={{ background: '#09090b', color: '#fff', padding: '2px 7px', fontWeight: 'bold' }}>TOTAL DUE: $10,500.00</div>
          </div>
        </>
      )}

      {/* ── 8. Golden Elegance ── */}
      {tpl.id === 'golden_elegance' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: tpl.primaryColor, fontSize: '6px' }}>GOLDEN ESTATE</span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ background: '#059669', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '4px', fontWeight: 'bold' }}>PAID</div>
              <span style={{ fontWeight: 'bold', fontSize: '7px', color: '#78350f' }}>INVOICE</span>
            </div>
          </div>
          <div style={{ height: '1px', background: tpl.primaryColor, marginBottom: '5px' }} />
          <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px' }}>BILLED TO:</div>
              <div style={{ fontWeight: 'bold', color: '#451a03' }}>Lord John Doe</div>
              <div style={{ color: '#78350f', fontSize: '4px' }}>The Grand Estate</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px' }}>PAYMENT DETAILS:</div>
              <div style={{ fontWeight: 'bold', color: '#451a03' }}>Golden Estate</div>
              <div style={{ color: '#78350f', fontSize: '4px' }}>Bank: 5544-3322-11</div>
            </div>
          </div>
          <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderRadius: '2px', marginBottom: '2px' }}>
            <span>Item Description</span><span>Total</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #fde68a' }}>
            <span>Estate Consultation</span><span>$5,000.00</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', background: '#fef3c7', borderBottom: '0.5px solid #fde68a' }}>
            <span>Legal Advisory</span><span>$3,500.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 7px', borderRadius: '2px', fontWeight: 'bold' }}>TOTAL DUE: $8,500.00</div>
          </div>
        </>
      )}

      {/* ── 9. Sidebar Monochrome ── */}
      {tpl.id === 'sidebar_mono' && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '38%', height: '100%', background: tpl.primaryColor, padding: '6px', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', height: '30px', background: '#333', marginBottom: '5px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', padding: '2px' }}>
              {[...Array(16)].map((_, i) => <div key={i} style={{ background: i % 2 === 0 ? '#fff' : '#333' }} />)}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '4px', fontWeight: 'bold' }}>DATE:</div>
            <div style={{ color: '#fff', fontSize: '4.5px', marginBottom: '3px' }}>01 January 2025</div>
            <div style={{ color: '#9ca3af', fontSize: '4px', fontWeight: 'bold' }}>TO:</div>
            <div style={{ color: '#fff', fontSize: '5px', fontWeight: 'bold' }}>John Doe</div>
            <div style={{ color: '#9ca3af', fontSize: '4px' }}>john@email.com</div>
          </div>
          <div style={{ marginLeft: '40%' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1a1a1a', lineHeight: 1 }}>INVOICE</div>
            <div style={{ color: '#9ca3af', fontSize: '4px', marginBottom: '4px' }}>Payment Info</div>
            <div style={{ background: '#f3f4f6', padding: '2px 3px', marginBottom: '4px', fontSize: '4px' }}>
              <span>Inv: #001</span>
            </div>
            <div style={{ background: '#1a1a1a', color: '#fff', padding: '2px 3px', display: 'flex', justifyContent: 'space-between', fontSize: '4px', marginBottom: '2px' }}>
              <span>Description</span><span>Total</span>
            </div>
            <div style={{ padding: '1px 3px', display: 'flex', justifyContent: 'space-between', fontSize: '4px', borderBottom: '0.5px solid #e5e7eb' }}>
              <span>Web Design</span><span>$1,200</span>
            </div>
            <div style={{ padding: '1px 3px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', fontSize: '4px' }}>
              <span>Consulting</span><span>$800</span>
            </div>
          </div>
        </>
      )}

      {/* ── 10. Clean Purple Pro ── */}
      {tpl.id === 'clean_purple_pro' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: tpl.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '7px', fontWeight: 'bold' }}>A</div>
              <span style={{ fontWeight: 'bold', fontSize: '6px', color: '#1e1b4b' }}>Acme Corp</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '10px', color: tpl.primaryColor }}>INVOICE</span>
          </div>
          <div style={{ height: '0.5px', background: '#e5e7eb', marginBottom: '5px' }} />
          <div style={{ display: 'flex', gap: '4px', marginBottom: '5px', fontSize: '4px' }}>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 'bold', marginBottom: '1px' }}>Office Address</div><div style={{ color: '#4b5563' }}>123 Business Ave</div></div>
            <div style={{ flex: 1 }}><div style={{ color: '#6b7280' }}>To:</div><div style={{ fontWeight: 'bold' }}>Client Name</div><div style={{ color: '#4b5563' }}>client@email.com</div></div>
          </div>
          <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontSize: '4px', fontWeight: 'bold', marginBottom: '2px' }}>
            <span>Description</span><span>Price</span><span>Qty</span><span>Total</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e5e7eb', fontSize: '4px' }}>
            <span style={{ flex: 2 }}>Website Design</span><span>$2,000</span><span>1</span><span>$2,000</span>
          </div>
          <div style={{ padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontSize: '4px', borderBottom: '0.5px solid #e5e7eb' }}>
            <span style={{ flex: 2 }}>Branding Kit</span><span>$500</span><span>2</span><span>$1,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 6px', fontSize: '4.5px', fontWeight: 'bold' }}>TOTAL DUE: $3,000</div>
          </div>
        </>
      )}

      {/* ── 11. Orange Accent ── */}
      {tpl.id === 'orange_accent' && (
        <>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '25%', height: '40%', background: tpl.primaryColor, borderRadius: '0 6px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12%', height: '30%', background: tpl.primaryColor, borderRadius: '0 0 0 6px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '6px', color: '#1a1a1a' }}>MyBrand Co.</div>
              <div style={{ fontSize: '4px', color: '#6b7280' }}>123 Main Street</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: tpl.primaryColor, lineHeight: 1 }}>INVOICE</div>
              <div style={{ fontSize: '4px', color: '#1a1a1a' }}>Jan 01, 2025</div>
            </div>
          </div>
          <div style={{ height: '0.5px', background: '#d1d5db', marginBottom: '4px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '4px', color: '#9ca3af', fontWeight: 'bold', marginBottom: '2px' }}>
            <span>QTY</span><span style={{ flex: 2, textAlign: 'center' }}>DESCRIPTION</span><span>PRICE</span><span>TOTAL</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '4px', padding: '1px 0', borderBottom: '0.5px solid #e5e7eb' }}>
            <span>2</span><span style={{ flex: 2, textAlign: 'center' }}>Logo Design</span><span>$500</span><span style={{ fontWeight: 'bold' }}>$1,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 6px', fontSize: '4.5px', fontWeight: 'bold' }}>GRAND TOTAL: $1,000</div>
          </div>
        </>
      )}

      {/* ── 12. Navy Geometric ── */}
      {tpl.id === 'navy_geometric' && (
        <>
          <div style={{ background: tpl.primaryColor, margin: '-10px -10px 5px -10px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '4px', top: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: '#2563a8', opacity: 0.8 }} />
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '6px' }}>LOGO</span>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '9px' }}>INVOICE:</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', fontSize: '4px' }}>
            <div style={{ width: '38%', background: '#f1f5f9', padding: '3px' }}>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px' }}>PAYMENT</div>
              <div style={{ color: tpl.primaryColor, fontWeight: 'bold', fontSize: '4px', marginBottom: '2px' }}>METHOD</div>
              <div style={{ color: '#4b5563' }}>Bank Account</div>
              <div style={{ color: '#4b5563' }}>PayPal</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 3px', display: 'flex', justifyContent: 'space-between', fontSize: '4px', fontWeight: 'bold', marginBottom: '1px' }}>
                <span>PRODUCT</span><span>TOTAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 3px', fontSize: '4px', borderBottom: '0.5px solid #e5e7eb' }}>
                <span>Web App</span><span style={{ color: tpl.primaryColor, fontWeight: 'bold' }}>$3,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 3px', fontSize: '4px', background: '#f8fafc' }}>
                <span>Mobile</span><span style={{ color: tpl.primaryColor, fontWeight: 'bold' }}>$2,000</span>
              </div>
            </div>
          </div>
          <div style={{ background: tpl.primaryColor, margin: '0 -10px', padding: '3px 10px' }}>
            <div style={{ color: '#93c5fd', fontSize: '4px', textAlign: 'center' }}>contact@company.com | +123 456 789</div>
          </div>
        </>
      )}

      {/* ── 13. Teal Corporate ── */}
      {tpl.id === 'teal_corporate' && (
        <>
          <div style={{ display: 'flex', margin: '-10px -10px 6px -10px', height: '42px' }}>
            <div style={{ background: '#1a1a2e', width: '42%', padding: '5px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '5.5px' }}>Acme Corp</div>
              <div style={{ color: '#9ca3af', fontSize: '3.5px' }}>Company Tagline</div>
            </div>
            <div style={{ background: tpl.primaryColor, flex: 1, padding: '5px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '10px', lineHeight: 1 }}>INVOICE</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '3.5px' }}>#INV-2025-001</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', fontSize: '4px' }}>
            <div style={{ flex: 1 }}><div style={{ color: tpl.primaryColor, fontWeight: 'bold' }}>INVOICE TO:</div><div style={{ fontWeight: 'bold' }}>John Doe</div><div style={{ color: '#4b5563' }}>Client Corp</div></div>
            <div style={{ flex: 1 }}><div style={{ color: tpl.primaryColor, fontWeight: 'bold' }}>PAYMENT METHOD</div><div style={{ color: '#4b5563' }}>Account: 12345678</div></div>
          </div>
          <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 4px', display: 'flex', justifyContent: 'space-between', fontSize: '4px', fontWeight: 'bold', marginBottom: '1px' }}>
            <span>NO.</span><span style={{ flex: 2 }}>DESCRIPTION</span><span>PRICE</span><span>TOTAL</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 4px', fontSize: '4px', borderBottom: '0.5px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280' }}>01</span><span style={{ flex: 2 }}>Web Dev</span><span>$3,000</span><span style={{ color: tpl.primaryColor, fontWeight: 'bold' }}>$3,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <div style={{ background: tpl.primaryColor, color: '#fff', padding: '2px 5px', fontSize: '4.5px', fontWeight: 'bold' }}>Total: $3,000</div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: 'draft' | 'published' }> = ({ status }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)',
    color: status === 'published' ? 'var(--success)' : '#d97706',
    fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px',
    borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.3px'
  }}>
    {status === 'published' ? <Globe size={9} /> : <Clock size={9} />}
    &nbsp;{status}
  </span>
);

// ─── Main BillDesign Page ─────────────────────────────────────────────────────
export const BillDesign: React.FC = () => {
  const { apiFetch, organization, updateOrganization } = useAuth();
  const navigate = useNavigate();

  const [activeTemplate, setActiveTemplate] = useState<string>(organization?.invoiceTemplate || 'modern_purple');
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const fetchCustomTemplates = useCallback(async () => {
    setIsFetching(true);
    try {
      const data = await apiFetch('/api/organization/templates');
      setCustomTemplates(Array.isArray(data) ? data : []);
    } catch {
      setCustomTemplates([]);
    } finally {
      setIsFetching(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchCustomTemplates(); }, [fetchCustomTemplates]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleActivate = async (templateId: string, name: string) => {
    setLoadingId(templateId);
    setError(null);
    try {
      await apiFetch('/api/organization/template', {
        method: 'PUT',
        body: JSON.stringify({ template: templateId })
      });
      updateOrganization({ invoiceTemplate: templateId });
      setActiveTemplate(templateId);
      showSuccess(`"${name}" is now your active invoice design!`);
    } catch (err: any) {
      setError(err.message || 'Failed to activate template.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleStatus = async (tpl: CustomTemplate) => {
    const newStatus = tpl.status === 'draft' ? 'published' : 'draft';
    setLoadingId(tpl.id + '_status');
    try {
      await apiFetch(`/api/organization/templates/${tpl.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setCustomTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, status: newStatus } : t));
      showSuccess(`"${tpl.name}" set to ${newStatus}.`);
    } catch (err: any) {
      setError(err.message || 'Status update failed.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (tpl: CustomTemplate) => {
    if (!window.confirm(`Delete template "${tpl.name}"? This cannot be undone.`)) return;
    setDeletingId(tpl.id);
    try {
      await apiFetch(`/api/organization/templates/${tpl.id}`, { method: 'DELETE' });
      setCustomTemplates(prev => prev.filter(t => t.id !== tpl.id));
      if (activeTemplate === tpl.id) {
        setActiveTemplate('modern_purple');
        updateOrganization({ invoiceTemplate: 'modern_purple' });
      }
      showSuccess(`"${tpl.name}" was deleted.`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete template.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }} className="text-gradient">Invoice Bill Design</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Choose or build a visual layout for all generated PDF invoices.
          </p>
        </div>
        <button
          onClick={() => navigate('/settings/design/builder')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <Plus size={16} />
          <span>Create Custom Template</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="fade-in" style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)', color: 'var(--danger)', padding: '14px 18px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} /><span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="fade-in" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)', padding: '14px 18px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{successMessage} <Sparkles size={14} /></span>
        </div>
      )}

      {/* ─── Built-in Templates Grid ─── */}
      <section>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
          Built-in Templates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: '24px' }}>
          {BUILT_IN_TEMPLATES.map((tpl) => {
            const isActive = activeTemplate === tpl.id;
            const isActivating = loadingId === tpl.id;
            return (
              <div
                key={tpl.id}
                className="glass-card"
                style={{
                  display: 'flex', flexDirection: 'column', gap: '16px', padding: '22px',
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  transform: isActive ? 'scale(1.02)' : 'none',
                  transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                }}
              >
                {isActive && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '3px 9px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 size={10} /> ACTIVE
                  </div>
                )}
                <div style={{ marginTop: isActive ? '10px' : 0 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{tpl.badge}</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{tpl.name}</h4>
                </div>
                <MiniInvoicePreview tpl={tpl} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, flexGrow: 1 }}>{tpl.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tpl.primaryColor }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tpl.typography}</span>
                  </div>
                  <button
                    disabled={isActive || !!isActivating}
                    onClick={() => handleActivate(tpl.id, tpl.name)}
                    className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ padding: '5px 13px', fontSize: '0.75rem' }}
                  >
                    {isActivating ? 'Activating…' : isActive ? '✓ Active' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Custom Templates Panel ─── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            My Custom Templates
          </h3>
          <button
            onClick={fetchCustomTemplates}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', padding: '4px 8px' }}
          >
            <RefreshCw size={12} /><span>Refresh</span>
          </button>
        </div>

        {isFetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : customTemplates.length === 0 ? (
          <div style={{ background: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palette size={28} color="var(--primary)" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>No Custom Templates Yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                Design your own branded invoice layout with the visual builder.
              </p>
            </div>
            <button onClick={() => navigate('/settings/design/builder')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Plus size={16} /><span>Create First Template</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customTemplates.map((tpl) => {
              const isActive = activeTemplate === tpl.id;
              const isDeleting = deletingId === tpl.id;
              const isActivating = loadingId === tpl.id;
              const isTogglingStatus = loadingId === tpl.id + '_status';
              const cfg = (() => { try { return JSON.parse(tpl.config); } catch { return {}; } })();

              return (
                <div
                  key={tpl.id}
                  className="glass-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 22px',
                    border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {/* Color chip */}
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '10px', flexShrink: 0,
                    background: cfg.primaryColor || '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 14px ${cfg.primaryColor || '#6366f1'}55`
                  }}>
                    <FileText size={19} color="#fff" />
                  </div>

                  {/* Meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</span>
                      {isActive && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '8px', flexShrink: 0 }}>ACTIVE</span>}
                      <StatusBadge status={tpl.status} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>Font: {cfg.fontFamily || 'Helvetica'}</span>
                      <span>Updated: {new Date(tpl.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={() => handleToggleStatus(tpl)}
                      disabled={!!isTogglingStatus}
                      title={tpl.status === 'draft' ? 'Publish template' : 'Move to draft'}
                      className="btn btn-secondary"
                      style={{ padding: '5px 11px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {tpl.status === 'draft' ? <Rocket size={12} /> : <Clock size={12} />}
                      {isTogglingStatus ? '…' : tpl.status === 'draft' ? 'Publish' : 'Draft'}
                    </button>

                    <button
                      onClick={() => navigate(`/settings/design/builder/${tpl.id}`)}
                      title="Edit in builder"
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px' }}
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      disabled={isActive || !!isActivating}
                      onClick={() => handleActivate(tpl.id, tpl.name)}
                      className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '5px 13px', fontSize: '0.75rem' }}
                    >
                      {isActivating ? '…' : isActive ? '✓ Active' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleDelete(tpl)}
                      disabled={!!isDeleting}
                      title="Delete template"
                      className="btn btn-danger"
                      style={{ padding: '6px 10px' }}
                    >
                      {isDeleting ? '…' : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
