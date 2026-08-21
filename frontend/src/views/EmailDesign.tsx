import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Check, CheckCircle2, ShieldAlert, Mail, Eye, Palette,
  Zap, Star, Globe, Sunset, Moon, Leaf, Cpu, Crown, Gem, Waves, Building2, Flame
} from 'lucide-react';

// ─── Template Definitions ────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Clean Blue Corporate',
    icon: Building2,
    headerBg: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    accentColor: '#1e40af',
    accentLight: '#dbeafe',
    textColor: '#374151',
    category: 'Corporate',
    categoryColor: '#3b82f6',
  },
  {
    id: 'modern_dark',
    name: 'Modern Dark',
    tagline: 'Premium Dark Mode',
    icon: Moon,
    headerBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
    accentColor: '#a78bfa',
    accentLight: '#1e293b',
    textColor: '#cbd5e1',
    category: 'Dark',
    categoryColor: '#a78bfa',
  },
  {
    id: 'vibrant_purple',
    name: 'Vibrant Purple',
    tagline: 'Bold Gradient Style',
    icon: Zap,
    headerBg: 'linear-gradient(135deg, #4c1d95, #7c3aed, #a855f7)',
    accentColor: '#7c3aed',
    accentLight: '#f3e8ff',
    textColor: '#6d28d9',
    category: 'Vibrant',
    categoryColor: '#7c3aed',
  },
  {
    id: 'ocean_wave',
    name: 'Ocean Wave',
    tagline: 'Coastal Teal & Cyan',
    icon: Waves,
    headerBg: 'linear-gradient(135deg, #0891b2, #06b6d4, #22d3ee)',
    accentColor: '#0891b2',
    accentLight: '#ecfeff',
    textColor: '#0e7490',
    category: 'Cool',
    categoryColor: '#06b6d4',
  },
  {
    id: 'corporate_red',
    name: 'Corporate Red',
    tagline: 'Bold Authoritative',
    icon: Flame,
    headerBg: 'linear-gradient(135deg, #991b1b, #dc2626)',
    accentColor: '#dc2626',
    accentLight: '#fef2f2',
    textColor: '#374151',
    category: 'Corporate',
    categoryColor: '#dc2626',
  },
  {
    id: 'emerald_green',
    name: 'Emerald Green',
    tagline: 'Fresh Growth Style',
    icon: Leaf,
    headerBg: 'linear-gradient(135deg, #059669, #10b981, #34d399)',
    accentColor: '#059669',
    accentLight: '#f0fdf4',
    textColor: '#065f46',
    category: 'Nature',
    categoryColor: '#10b981',
  },
  {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    tagline: 'Warm Amber Gradient',
    icon: Sunset,
    headerBg: 'linear-gradient(135deg, #ea580c, #f97316, #fbbf24)',
    accentColor: '#ea580c',
    accentLight: '#fff7ed',
    textColor: '#78350f',
    category: 'Warm',
    categoryColor: '#f97316',
  },
  {
    id: 'midnight_blue',
    name: 'Midnight Blue',
    tagline: 'Deep Navy Sophistication',
    icon: Star,
    headerBg: 'linear-gradient(135deg, #0a1540, #0f1f5c, #1d4ed8)',
    accentColor: '#1d4ed8',
    accentLight: '#e0e7ff',
    textColor: '#c7d2fe',
    category: 'Dark',
    categoryColor: '#3b82f6',
  },
  {
    id: 'rose_gold',
    name: 'Rose Gold',
    tagline: 'Elegant Pink & Gold',
    icon: Gem,
    headerBg: 'linear-gradient(135deg, #be185d, #e11d48, #c026d3)',
    accentColor: '#be185d',
    accentLight: '#fff1f2',
    textColor: '#9d174d',
    category: 'Elegant',
    categoryColor: '#e11d48',
  },
  {
    id: 'forest_sage',
    name: 'Forest Sage',
    tagline: 'Earthy Olive & Green',
    icon: Leaf,
    headerBg: 'linear-gradient(135deg, #14532d, #166534, #15803d)',
    accentColor: '#14532d',
    accentLight: '#f0fdf4',
    textColor: '#166534',
    category: 'Nature',
    categoryColor: '#16a34a',
  },
  {
    id: 'neon_cyber',
    name: 'Neon Cyber',
    tagline: 'Dark Cyberpunk Neon',
    icon: Cpu,
    headerBg: 'linear-gradient(135deg, #000000, #0d0d0d)',
    accentColor: '#00ff88',
    accentLight: '#001a0a',
    textColor: '#00ff88',
    category: 'Futuristic',
    categoryColor: '#00ff88',
  },
  {
    id: 'golden_luxury',
    name: 'Golden Luxury',
    tagline: 'Prestige Gold & Black',
    icon: Crown,
    headerBg: 'linear-gradient(135deg, #1a1200, #2d1f00, #3d2a00)',
    accentColor: '#d4af37',
    accentLight: '#2d1f00',
    textColor: '#d4af37',
    category: 'Luxury',
    categoryColor: '#d4af37',
  },
];

// ─── Full HTML Preview Generator ──────────────────────────────────────────────

function generatePreviewHTML(templateId: string): string {
  const data = {
    orgName: 'Acme Corporation',
    clientName: 'John Smith',
    invoiceNumber: 'INV-0042',
    issueDate: 'July 15, 2026',
    dueDate: 'August 15, 2026',
    currency: 'USD',
    total: '3,450.00',
  };

  const templates: Record<string, string> = {
    professional: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px 32px;text-align:center"><h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:700">${data.orgName}</h1><p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:0.8rem">Invoice Reminder</p></div><div style="padding:28px 32px"><p style="color:#374151;font-size:0.95rem;margin:0 0 8px">Dear <strong>${data.clientName}</strong>,</p><p style="color:#6b7280;font-size:0.88rem;line-height:1.6;margin:0 0 20px">This is a friendly reminder that the following invoice is currently outstanding.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:20px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:7px 0;color:#6b7280;font-size:0.85rem;font-weight:500">Invoice #</td><td style="padding:7px 0;color:#111827;font-weight:700;text-align:right">${data.invoiceNumber}</td></tr><tr><td style="padding:7px 0;color:#6b7280;font-size:0.85rem">Issue Date</td><td style="padding:7px 0;color:#374151;text-align:right">${data.issueDate}</td></tr><tr><td style="padding:7px 0;color:#6b7280;font-size:0.85rem">Due Date</td><td style="padding:7px 0;color:#dc2626;font-weight:600;text-align:right">${data.dueDate}</td></tr><tr style="border-top:2px solid #e2e8f0"><td style="padding:12px 0 0;color:#111827;font-size:1rem;font-weight:700">Total Due</td><td style="padding:12px 0 0;color:#1e40af;font-size:1.2rem;font-weight:800;text-align:right">${data.currency} ${data.total}</td></tr></table></div><p style="color:#374151;font-size:0.85rem;margin:0">Sincerely,<br><strong>${data.orgName} Billing Team</strong></p></div><div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center"><p style="color:#9ca3af;font-size:0.72rem;margin:0">Automated invoice reminder from ${data.orgName}</p></div></div></div>`,

    modern_dark: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f172a;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155"><div style="padding:28px 32px;border-bottom:1px solid #334155;display:flex;align-items:center;gap:14px"><div style="width:42px;height:42px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="color:#fff;font-weight:800;font-size:1.1rem">${data.orgName.charAt(0)}</span></div><div><h1 style="color:#f1f5f9;margin:0;font-size:1.1rem;font-weight:700">${data.orgName}</h1><p style="color:#64748b;margin:2px 0 0;font-size:0.75rem">Payment Reminder</p></div></div><div style="padding:28px 32px"><p style="color:#cbd5e1;font-size:0.95rem;margin:0 0 20px">Dear <strong style="color:#f1f5f9">${data.clientName}</strong>, you have an outstanding invoice.</p><div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:18px;margin-bottom:20px"><div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #1e293b"><span style="color:#64748b;font-size:0.82rem">Invoice</span><span style="color:#e2e8f0;font-weight:600">${data.invoiceNumber}</span></div><div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #1e293b"><span style="color:#64748b;font-size:0.82rem">Issued</span><span style="color:#e2e8f0">${data.issueDate}</span></div><div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #1e293b"><span style="color:#64748b;font-size:0.82rem">Due By</span><span style="color:#f87171;font-weight:600">${data.dueDate}</span></div><div style="display:flex;justify-content:space-between;padding:14px 0 0"><span style="color:#a78bfa;font-size:0.95rem;font-weight:700">Amount Due</span><span style="color:#a78bfa;font-size:1.3rem;font-weight:800">${data.currency} ${data.total}</span></div></div><p style="color:#64748b;font-size:0.82rem;margin:0">Best regards,<br><span style="color:#e2e8f0;font-weight:600">${data.orgName}</span></p></div></div></div>`,

    vibrant_purple: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7);padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto"><div style="text-align:center;padding:24px 0 18px"><h1 style="color:#fff;margin:0;font-size:1.7rem;font-weight:800">${data.orgName}</h1><p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:0.75rem;text-transform:uppercase;letter-spacing:2px">Invoice Reminder</p></div><div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:28px"><p style="color:rgba(255,255,255,0.9);font-size:0.95rem;margin:0 0 20px">Hello <strong style="color:#fff">${data.clientName}</strong>,</p><div style="background:rgba(0,0,0,0.25);border-radius:14px;padding:20px;margin-bottom:20px"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="color:rgba(255,255,255,0.5);font-size:0.82rem">Invoice Number</span><span style="color:#fff;font-weight:700">${data.invoiceNumber}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="color:rgba(255,255,255,0.5);font-size:0.82rem">Issue Date</span><span style="color:rgba(255,255,255,0.85)">${data.issueDate}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:18px"><span style="color:rgba(255,255,255,0.5);font-size:0.82rem">Due Date</span><span style="color:#fca5a5;font-weight:600">${data.dueDate}</span></div><div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;text-align:center"><p style="color:rgba(255,255,255,0.6);font-size:0.72rem;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">Total Amount Due</p><p style="color:#fff;font-size:1.8rem;font-weight:800;margin:0">${data.currency} ${data.total}</p></div></div><p style="color:rgba(255,255,255,0.6);font-size:0.82rem;text-align:center;margin:0">With gratitude — <strong style="color:rgba(255,255,255,0.9)">${data.orgName}</strong></p></div></div></div>`,

    ocean_wave: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#ecfeff;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(6,182,212,0.12)"><div style="background:linear-gradient(135deg,#0891b2,#06b6d4,#22d3ee);padding:32px;position:relative;overflow:hidden"><div style="position:absolute;top:-30px;right:-30px;width:100px;height:100px;background:rgba(255,255,255,0.1);border-radius:50%"></div><h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:800;position:relative">${data.orgName}</h1><p style="color:rgba(255,255,255,0.85);margin:5px 0 0;font-size:0.8rem;position:relative">📧 Invoice Reminder</p></div><div style="padding:28px 32px"><p style="color:#164e63;font-size:0.95rem;font-weight:600;margin:0 0 8px">Dear ${data.clientName},</p><p style="color:#0e7490;font-size:0.88rem;line-height:1.7;margin:0 0 20px">We're writing to remind you about the following outstanding invoice.</p><div style="border:2px solid #a5f3fc;border-radius:12px;overflow:hidden;margin-bottom:20px"><div style="background:#ecfeff;padding:11px 18px;border-bottom:1px solid #a5f3fc;display:flex;justify-content:space-between"><span style="color:#0e7490;font-size:0.82rem;font-weight:500">Invoice Reference</span><span style="color:#164e63;font-weight:700">${data.invoiceNumber}</span></div><div style="padding:11px 18px;border-bottom:1px solid #a5f3fc;display:flex;justify-content:space-between"><span style="color:#0e7490;font-size:0.82rem">Issue Date</span><span style="color:#374151">${data.issueDate}</span></div><div style="background:#ecfeff;padding:11px 18px;border-bottom:1px solid #a5f3fc;display:flex;justify-content:space-between"><span style="color:#0e7490;font-size:0.82rem">Due Date</span><span style="color:#dc2626;font-weight:600">${data.dueDate}</span></div><div style="background:linear-gradient(135deg,#0891b2,#06b6d4);padding:18px;text-align:center"><p style="color:rgba(255,255,255,0.8);font-size:0.72rem;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px">Amount Due</p><p style="color:#fff;font-size:1.7rem;font-weight:800;margin:0">${data.currency} ${data.total}</p></div></div><p style="color:#164e63;font-size:0.85rem;margin:0">Warm regards,<br><strong>${data.orgName}</strong></p></div></div></div>`,

    corporate_red: `<div style="font-family:Arial,sans-serif;background:#fef2f2;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border-top:5px solid #dc2626"><div style="padding:24px 32px 18px;border-bottom:1px solid #fee2e2;display:flex;justify-content:space-between;align-items:center"><div><h1 style="color:#991b1b;margin:0;font-size:1.3rem;font-weight:800">${data.orgName}</h1><p style="color:#ef4444;margin:3px 0 0;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:1px">Payment Reminder</p></div><div style="background:#dc2626;color:#fff;padding:6px 14px;border-radius:6px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1px">Action Required</div></div><div style="padding:24px 32px"><p style="color:#1f2937;font-size:0.95rem;margin:0 0 16px">Dear <strong>${data.clientName}</strong>,</p><p style="color:#6b7280;font-size:0.88rem;line-height:1.6;margin:0 0 20px">This notice informs you that the invoice below is pending payment. Please process at your earliest convenience.</p><table style="width:100%;border-collapse:collapse;margin-bottom:20px"><thead><tr style="background:#dc2626"><th style="padding:10px 14px;color:#fff;text-align:left;font-size:0.82rem;font-weight:600">Field</th><th style="padding:10px 14px;color:#fff;text-align:right;font-size:0.82rem;font-weight:600">Detail</th></tr></thead><tbody><tr style="background:#fef2f2"><td style="padding:10px 14px;color:#6b7280;font-size:0.82rem;border-bottom:1px solid #fee2e2">Invoice Number</td><td style="padding:10px 14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #fee2e2">${data.invoiceNumber}</td></tr><tr><td style="padding:10px 14px;color:#6b7280;font-size:0.82rem;border-bottom:1px solid #fee2e2">Issue Date</td><td style="padding:10px 14px;color:#374151;text-align:right;border-bottom:1px solid #fee2e2">${data.issueDate}</td></tr><tr style="background:#fef2f2"><td style="padding:10px 14px;color:#6b7280;font-size:0.82rem;border-bottom:1px solid #fee2e2">Payment Due</td><td style="padding:10px 14px;color:#dc2626;font-weight:700;text-align:right;border-bottom:1px solid #fee2e2">${data.dueDate}</td></tr><tr style="background:#dc2626"><td style="padding:12px 14px;color:#fff;font-weight:700">TOTAL DUE</td><td style="padding:12px 14px;color:#fff;font-size:1.15rem;font-weight:800;text-align:right">${data.currency} ${data.total}</td></tr></tbody></table><p style="color:#374151;font-size:0.85rem;margin:0">Respectfully,<br><strong>${data.orgName} Finance Department</strong></p></div></div></div>`,

    emerald_green: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f0fdf4;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(16,185,129,0.1)"><div style="background:linear-gradient(135deg,#059669,#10b981,#34d399);padding:28px 32px;display:flex;align-items:center;gap:14px"><div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="color:#fff;font-weight:800;font-size:1.1rem">${data.orgName.charAt(0)}</span></div><div><h1 style="color:#fff;margin:0;font-size:1.1rem;font-weight:700">${data.orgName}</h1><p style="color:rgba(255,255,255,0.75);margin:2px 0 0;font-size:0.78rem">Invoice Reminder</p></div></div><div style="padding:28px 32px"><div style="background:#f0fdf4;border-left:4px solid #10b981;padding:12px 16px;border-radius:0 10px 10px 0;margin-bottom:20px"><p style="color:#065f46;font-size:0.92rem;margin:0">Hello <strong>${data.clientName}</strong> — You have a pending invoice.</p></div><div style="background:#f9fafb;border:1px solid #d1fae5;border-radius:12px;overflow:hidden;margin-bottom:20px"><div style="padding:12px 18px;border-bottom:1px solid #d1fae5;display:flex;justify-content:space-between;align-items:center"><span style="color:#6b7280;font-size:0.82rem">Invoice #</span><span style="color:#065f46;font-weight:700">${data.invoiceNumber}</span></div><div style="padding:12px 18px;border-bottom:1px solid #d1fae5;display:flex;justify-content:space-between"><span style="color:#6b7280;font-size:0.82rem">Issue Date</span><span style="color:#374151">${data.issueDate}</span></div><div style="padding:12px 18px;border-bottom:1px solid #d1fae5;display:flex;justify-content:space-between"><span style="color:#6b7280;font-size:0.82rem">Due Date</span><span style="color:#dc2626;font-weight:600">${data.dueDate}</span></div><div style="background:linear-gradient(135deg,#059669,#10b981);padding:18px;display:flex;justify-content:space-between;align-items:center"><span style="color:rgba(255,255,255,0.85);font-weight:600">Total Due</span><span style="color:#fff;font-size:1.4rem;font-weight:800">${data.currency} ${data.total}</span></div></div><p style="color:#374151;font-size:0.85rem;margin:0">Thank you,<br><strong style="color:#059669">${data.orgName}</strong></p></div></div></div>`,

    sunset_orange: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(180deg,#fff7ed,#fef3c7);padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(249,115,22,0.15);border:1px solid #fed7aa"><div style="background:linear-gradient(135deg,#ea580c,#f97316,#fbbf24);padding:32px;text-align:center"><h1 style="color:#fff;margin:0;font-size:1.6rem;font-weight:800">${data.orgName}</h1><div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:20px;padding:3px 14px;margin-top:8px"><span style="color:#fff;font-size:0.72rem;font-weight:600;letter-spacing:1px">🔔 PAYMENT REMINDER</span></div></div><div style="padding:28px 32px"><p style="color:#431407;font-size:0.95rem;margin:0 0 16px">Hi <strong>${data.clientName}</strong>,</p><div style="border-radius:14px;overflow:hidden;border:2px solid #fed7aa;margin-bottom:20px"><div style="background:#fff7ed;padding:12px 18px;display:flex;justify-content:space-between;border-bottom:1px solid #fed7aa"><span style="color:#92400e;font-size:0.82rem;font-weight:500">Invoice</span><span style="color:#431407;font-weight:700">${data.invoiceNumber}</span></div><div style="padding:12px 18px;display:flex;justify-content:space-between;border-bottom:1px solid #fed7aa"><span style="color:#92400e;font-size:0.82rem">Issued On</span><span style="color:#374151">${data.issueDate}</span></div><div style="background:#fff7ed;padding:12px 18px;display:flex;justify-content:space-between;border-bottom:2px solid #fed7aa"><span style="color:#92400e;font-size:0.82rem">Due By</span><span style="color:#dc2626;font-weight:600">${data.dueDate}</span></div><div style="background:linear-gradient(135deg,#ea580c,#f97316);padding:20px;text-align:center"><p style="color:rgba(255,255,255,0.8);font-size:0.72rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Amount Due</p><p style="color:#fff;font-size:1.8rem;font-weight:800;margin:0">${data.currency} ${data.total}</p></div></div><p style="color:#78350f;font-size:0.85rem;margin:0">Warmly,<br><strong style="color:#ea580c">${data.orgName} Team</strong></p></div></div></div>`,

    midnight_blue: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#0a0f2e;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:linear-gradient(180deg,#0f1f5c,#0a1540);border-radius:16px;overflow:hidden;border:1px solid #1e3a8a"><div style="padding:28px 32px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between;align-items:center"><div><h1 style="color:#e0e7ff;margin:0;font-size:1.2rem;font-weight:700">${data.orgName}</h1><p style="color:#6272a4;margin:3px 0 0;font-size:0.78rem">Billing Department</p></div><div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:5px 12px;border-radius:6px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px">Invoice Due</div></div><div style="padding:28px 32px"><p style="color:#c7d2fe;font-size:0.95rem;margin:0 0 16px">Dear <strong style="color:#e0e7ff">${data.clientName}</strong>,</p><div style="background:rgba(255,255,255,0.03);border:1px solid #1e3a8a;border-radius:12px;overflow:hidden;margin-bottom:20px"><div style="padding:12px 18px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between"><span style="color:#6272a4;font-size:0.82rem">Invoice Number</span><span style="color:#c7d2fe;font-weight:600">${data.invoiceNumber}</span></div><div style="padding:12px 18px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between"><span style="color:#6272a4;font-size:0.82rem">Date Issued</span><span style="color:#a5b4fc">${data.issueDate}</span></div><div style="padding:12px 18px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between"><span style="color:#6272a4;font-size:0.82rem">Payment Due</span><span style="color:#fca5a5;font-weight:600">${data.dueDate}</span></div><div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:20px;display:flex;justify-content:space-between;align-items:center"><span style="color:rgba(255,255,255,0.8);font-weight:600">Total Outstanding</span><span style="color:#fff;font-size:1.4rem;font-weight:800">${data.currency} ${data.total}</span></div></div><p style="color:#6272a4;font-size:0.82rem;margin:0">Regards,<br><strong style="color:#c7d2fe">${data.orgName} Finance</strong></p></div></div></div>`,

    rose_gold: `<div style="font-family:'Georgia',serif;background:linear-gradient(135deg,#fff1f2,#fdf4ff);padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(244,63,94,0.12);border:1px solid #fecdd3"><div style="background:linear-gradient(135deg,#be185d,#e11d48,#c026d3);padding:32px;text-align:center"><p style="color:rgba(255,255,255,0.7);margin:0 0 5px;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;font-family:'Segoe UI',sans-serif">Invoice Reminder</p><h1 style="color:#fff;margin:0;font-size:1.6rem;font-weight:700;font-style:italic">${data.orgName}</h1></div><div style="padding:28px 32px"><p style="color:#881337;font-size:0.95rem;margin:0 0 16px;font-style:italic">Dear <em>${data.clientName}</em>,</p><div style="border:1px solid #fecdd3;border-radius:14px;overflow:hidden;margin-bottom:20px"><div style="background:#fff1f2;padding:12px 18px;display:flex;justify-content:space-between;border-bottom:1px solid #fecdd3;font-family:'Segoe UI',sans-serif"><span style="color:#9d174d;font-size:0.82rem">Invoice Ref</span><span style="color:#881337;font-weight:700">${data.invoiceNumber}</span></div><div style="padding:12px 18px;display:flex;justify-content:space-between;border-bottom:1px solid #fecdd3;font-family:'Segoe UI',sans-serif"><span style="color:#9d174d;font-size:0.82rem">Date of Issue</span><span style="color:#374151">${data.issueDate}</span></div><div style="background:#fff1f2;padding:12px 18px;display:flex;justify-content:space-between;border-bottom:1px solid #fecdd3;font-family:'Segoe UI',sans-serif"><span style="color:#9d174d;font-size:0.82rem">Due Date</span><span style="color:#dc2626;font-weight:600">${data.dueDate}</span></div><div style="background:linear-gradient(135deg,#be185d,#e11d48);padding:20px;text-align:center"><p style="color:rgba(255,255,255,0.75);font-size:0.7rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;font-family:'Segoe UI',sans-serif">Total Due</p><p style="color:#fff;font-size:1.8rem;font-weight:700;margin:0">${data.currency} ${data.total}</p></div></div><p style="color:#9d174d;font-size:0.85rem;font-style:italic;margin:0">With appreciation,<br><strong style="font-style:normal">${data.orgName}</strong></p></div></div></div>`,

    forest_sage: `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f8f1;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#fafdf9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(22,101,52,0.1);border:1px solid #bbf7d0"><div style="background:linear-gradient(135deg,#14532d,#166534,#15803d);padding:28px 32px"><h1 style="color:#dcfce7;margin:0;font-size:1.3rem;font-weight:700">${data.orgName}</h1><p style="color:#86efac;margin:5px 0 0;font-size:0.78rem">🌿 Invoice Reminder Notice</p></div><div style="padding:28px 32px"><p style="color:#14532d;font-size:0.95rem;margin:0 0 16px">Hello <strong>${data.clientName}</strong>,</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;overflow:hidden;margin-bottom:20px"><div style="padding:12px 18px;border-bottom:1px solid #bbf7d0;display:flex;justify-content:space-between"><span style="color:#166534;font-size:0.82rem;font-weight:500">Invoice No.</span><span style="color:#14532d;font-weight:700">${data.invoiceNumber}</span></div><div style="padding:12px 18px;border-bottom:1px solid #bbf7d0;display:flex;justify-content:space-between"><span style="color:#166534;font-size:0.82rem">Issued</span><span style="color:#374151">${data.issueDate}</span></div><div style="padding:12px 18px;border-bottom:1px solid #bbf7d0;display:flex;justify-content:space-between"><span style="color:#166534;font-size:0.82rem">Due By</span><span style="color:#dc2626;font-weight:600">${data.dueDate}</span></div><div style="background:linear-gradient(135deg,#14532d,#166534);padding:18px;display:flex;justify-content:space-between;align-items:center"><span style="color:#86efac;font-weight:600">Amount Due</span><span style="color:#fff;font-size:1.4rem;font-weight:800">${data.currency} ${data.total}</span></div></div><p style="color:#166534;font-size:0.85rem;margin:0">Kind regards,<br><strong style="color:#14532d">${data.orgName}</strong></p></div></div></div>`,

    neon_cyber: `<div style="font-family:'Courier New',monospace;background:#000;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:#0d0d0d;border-radius:4px;overflow:hidden;box-shadow:0 0 40px rgba(0,255,136,0.2);border:1px solid #00ff88"><div style="padding:22px 28px;border-bottom:1px solid #00ff88;display:flex;justify-content:space-between;align-items:center"><div><h1 style="color:#00ff88;margin:0;font-size:1.1rem;font-weight:700;text-transform:uppercase;letter-spacing:3px">${data.orgName}</h1><p style="color:#004422;margin:3px 0 0;font-size:0.65rem;letter-spacing:2px">// INVOICE_REMINDER.exe</p></div><div style="border:1px solid #ff0080;color:#ff0080;padding:3px 10px;font-size:0.65rem;letter-spacing:2px;text-transform:uppercase">PENDING</div></div><div style="padding:24px 28px"><p style="color:#00ff88;font-size:0.88rem;margin:0 0 6px;letter-spacing:1px">&gt; TARGET: <strong style="color:#fff">${data.clientName}</strong></p><p style="color:#444;font-size:0.78rem;margin:0 0 20px;line-height:1.8">&gt; NOTIFICATION: Outstanding invoice detected. Immediate action required.</p><div style="border:1px solid #333;border-radius:4px;overflow:hidden;margin-bottom:20px;font-size:0.8rem"><div style="padding:10px 14px;border-bottom:1px solid #1a1a1a;display:flex;justify-content:space-between"><span style="color:#555">INVOICE_ID</span><span style="color:#00ff88">${data.invoiceNumber}</span></div><div style="padding:10px 14px;border-bottom:1px solid #1a1a1a;display:flex;justify-content:space-between;background:#0a0a0a"><span style="color:#555">ISSUE_DATE</span><span style="color:#888">${data.issueDate}</span></div><div style="padding:10px 14px;border-bottom:1px solid #1a1a1a;display:flex;justify-content:space-between"><span style="color:#555">DUE_DATE</span><span style="color:#ff0080;font-weight:700">${data.dueDate}</span></div><div style="background:#001a0a;padding:18px 14px;border-top:1px solid #00ff88;display:flex;justify-content:space-between;align-items:center"><span style="color:#00ff88;letter-spacing:2px;text-transform:uppercase;font-size:0.82rem">AMOUNT_DUE</span><span style="color:#00ff88;font-size:1.5rem;font-weight:700">${data.currency} ${data.total}</span></div></div><p style="color:#333;font-size:0.72rem;letter-spacing:1px;margin:0">&gt; END OF TRANSMISSION // ${data.orgName}_BILLING</p></div></div></div>`,

    golden_luxury: `<div style="font-family:'Georgia',serif;background:#1a1200;padding:30px 20px;min-height:100%"><div style="max-width:560px;margin:0 auto;background:linear-gradient(180deg,#1c1400,#0f0b00);border-radius:12px;overflow:hidden;border:1px solid #b8860b"><div style="border-bottom:1px solid #b8860b;padding:28px 36px;text-align:center"><h1 style="color:#d4af37;margin:0;font-size:1.5rem;font-weight:700;letter-spacing:4px;text-transform:uppercase">${data.orgName}</h1><p style="color:#8b6914;margin:6px 0 0;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;font-family:'Segoe UI',sans-serif">Invoice Reminder</p></div><div style="padding:32px 36px"><p style="color:#d4af37;font-size:0.95rem;margin:0 0 14px;font-style:italic">Dear ${data.clientName},</p><div style="border:1px solid #b8860b;border-radius:8px;overflow:hidden;margin-bottom:24px"><div style="padding:12px 18px;border-bottom:1px solid #2d2000;display:flex;justify-content:space-between;font-family:'Segoe UI',sans-serif"><span style="color:#8b6914;font-size:0.78rem;letter-spacing:1px;text-transform:uppercase">Invoice Ref</span><span style="color:#d4af37;font-weight:600">${data.invoiceNumber}</span></div><div style="background:rgba(212,175,55,0.04);padding:12px 18px;border-bottom:1px solid #2d2000;display:flex;justify-content:space-between;font-family:'Segoe UI',sans-serif"><span style="color:#8b6914;font-size:0.78rem;letter-spacing:1px;text-transform:uppercase">Issued</span><span style="color:#a8956a">${data.issueDate}</span></div><div style="padding:12px 18px;border-bottom:1px solid #b8860b;display:flex;justify-content:space-between;font-family:'Segoe UI',sans-serif"><span style="color:#8b6914;font-size:0.78rem;letter-spacing:1px;text-transform:uppercase">Due Date</span><span style="color:#ef4444;font-weight:600">${data.dueDate}</span></div><div style="background:linear-gradient(135deg,#2d1f00,#1a1200);padding:22px;text-align:center;border-top:1px solid #b8860b"><p style="color:#8b6914;font-size:0.68rem;letter-spacing:3px;text-transform:uppercase;margin:0 0 5px;font-family:'Segoe UI',sans-serif">Total Amount Due</p><p style="color:#d4af37;font-size:2rem;font-weight:700;margin:0">${data.currency} ${data.total}</p></div></div><p style="color:#8b6914;font-size:0.82rem;font-style:italic;margin:0;text-align:right">With the highest regard,<br><strong style="color:#d4af37;font-style:normal;letter-spacing:1px">${data.orgName}</strong></p></div><div style="border-top:1px solid #2d2000;padding:14px 36px;text-align:center"><p style="color:#3d2d00;font-size:0.68rem;letter-spacing:2px;text-transform:uppercase;margin:0;font-family:'Segoe UI',sans-serif">Automated Billing Notice • ${data.orgName}</p></div></div></div>`,
  };

  return templates[templateId] || templates['professional'];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const EmailDesign: React.FC = () => {
  const { organization, apiFetch, updateOrganization } = useAuth();
  const navigate = useNavigate();

  const [selectedTemplate, setSelectedTemplate] = useState(organization?.emailTemplate || 'professional');
  const [previewTemplate, setPreviewTemplate] = useState(organization?.emailTemplate || 'professional');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedTemplate(id);
    setPreviewTemplate(id);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await apiFetch('/api/organization/email-template', {
        method: 'PUT',
        body: JSON.stringify({ template: selectedTemplate }),
      });
      updateOrganization({ emailTemplate: selectedTemplate });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save email template.');
    } finally {
      setSaving(false);
    }
  };

  const activeTpl = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)!;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
          <button
            onClick={() => navigate('/settings')}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)', fontWeight: 700, margin: 0 }} className="text-gradient">
              Email Template Designer
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
              Pick and preview how invoice reminder emails appear to clients.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saved && (
            <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {saving ? 'Saving...' : (<><Check size={16} /> Apply Template</>)}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      <div className="dashboard-main-grid" style={{ alignItems: 'start' }}>

        {/* Left: Template selector list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Palette size={18} color="var(--primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Choose Template</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>Click any template to preview it live</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {EMAIL_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              const Icon = tpl.icon;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelect(tpl.id)}
                  style={{
                    border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    background: isSelected ? 'rgba(99,102,241,0.06)' : 'var(--bg-secondary)',
                    boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    position: 'relative',
                  }}
                >
                  {/* Gradient mini header */}
                  <div style={{ height: '52px', background: tpl.headerBg, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 10px' }}>
                    <div style={{ width: '52%', height: '6px', background: 'rgba(255,255,255,0.9)', borderRadius: '3px', marginBottom: '4px' }} />
                    <div style={{ width: '32%', height: '4px', background: 'rgba(255,255,255,0.45)', borderRadius: '2px' }} />
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--primary)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} color="#fff" />
                      </div>
                    )}
                  </div>
                  {/* Mini body skeleton */}
                  <div style={{ padding: '7px 10px 8px', background: 'var(--bg-primary)' }}>
                    <div style={{ height: '3px', background: 'var(--border-color)', borderRadius: '2px', marginBottom: '3px', width: '75%' }} />
                    <div style={{ height: '3px', background: 'var(--border-color)', borderRadius: '2px', width: '50%', marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{tpl.name}</p>
                    <div style={{ display: 'inline-block', background: tpl.categoryColor + '22', color: tpl.categoryColor, padding: '1px 6px', borderRadius: '4px', fontSize: '0.58rem', fontWeight: 600, marginTop: '3px' }}>{tpl.category}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Currently active badge */}
          {organization?.emailTemplate && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', marginTop: '4px' }}>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>Currently active:</p>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {EMAIL_TEMPLATES.find(t => t.id === organization.emailTemplate)?.name || 'Professional'}
              </p>
            </div>
          )}
        </div>

        {/* Right: Live HTML Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '20px' }}>
          {/* Preview header */}
          <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={18} color="var(--primary)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600 }}>Live Preview — {activeTpl.name}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeTpl.tagline}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview with sample data</span>
            </div>
          </div>

          {/* Fake email client chrome */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            {/* Email client top bar */}
            <div style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', padding: '10px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: '6px', padding: '4px 12px', fontSize: '0.72rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                📧 Reminder: Invoice INV-0042 is pending payment — from Acme Corporation
              </div>
            </div>
            {/* Email meta */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}><strong>From:</strong> Acme Corporation Billing &lt;billing@acme.com&gt;</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}> | <strong>To:</strong> john.smith@client.com</span>
            </div>
            {/* The iframe preview */}
            <div style={{ height: '580px', overflow: 'hidden', position: 'relative' }}>
              <iframe
                key={previewTemplate}
                srcDoc={generatePreviewHTML(previewTemplate)}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title={`Email preview: ${activeTpl.name}`}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Save button at bottom */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            {saved && (
              <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Template applied successfully!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '10px 28px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}
            >
              {saving ? 'Saving...' : (<><Check size={16} /> Apply Template</>)}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmailDesign;
