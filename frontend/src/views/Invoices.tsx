import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, FileDown, Mail, CheckCircle2, Trash2, Eye, Receipt, ShieldAlert, Share2, ChevronLeft, ChevronRight, Link2, ExternalLink, Check, Cloud } from 'lucide-react';
import confetti from 'canvas-confetti';
import { shareViaWhatsApp, generateInvoiceWhatsAppText } from '../utils/whatsappService';

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  tax_rate: number;
  discount: number;
  currency: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  view_token?: string;
}

export const Invoices: React.FC = () => {
  const { apiFetch, organization } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7d' | '15d' | '1m'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);


  // Payment modal state
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Download format modal state
  const [downloadInvoice, setDownloadInvoice] = useState<Invoice | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'doc'>('pdf');
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/invoices');
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <span className="badge badge-success">Paid</span>;
      case 'overdue':
        return <span className="badge badge-danger">Overdue</span>;
      case 'sent':
        return <span className="badge badge-info">Sent</span>;
      default:
        return <span className="badge badge-warning">Draft</span>;
    }
  };

  const handleDownloadPDF = async (id: string, invoiceNumber: string) => {
    try {
      const blob = await apiFetch(`/api/invoices/${id}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Error: Failed to generate and download PDF invoice.');
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadInvoice) return;
    setIsDownloading(true);
    try {
      if (downloadFormat === 'pdf') {
        await handleDownloadPDF(downloadInvoice.id, downloadInvoice.invoice_number);
      } else {
        const data = await apiFetch(`/api/invoices/${downloadInvoice.id}`);
        if (downloadFormat === 'png') {
          generatePNG(data, organization);
        } else if (downloadFormat === 'doc') {
          generateWordDoc(data, organization);
        }
      }
      setDownloadInvoice(null);
    } catch (err: any) {
      alert(`Download failed: ${err.message || err}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const generatePNG = (inv: any, org: any) => {
    const scale = 3; // 3x scaling for ultra-crisp Full HD+ / 300 DPI quality
    const baseW = 860;
    
    // Dynamic height calculation
    const itemCount = (inv.items || []).length;
    const baseH = Math.max(1200, 750 + (itemCount * 45) + 380);

    const canvas = document.createElement('canvas');
    canvas.width = baseW * scale;
    canvas.height = baseH * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.textBaseline = 'top';

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseW, baseH);

    // Decorative top brand bar
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, 0, baseW, 8);

    // Header Left: Organization / Brand
    const orgName = org?.name || 'My Business LLC';
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(orgName, 44, 40);

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('TAX INVOICE / OFFICIAL BILL', 44, 72);

    let orgY = 94;
    if (org?.address) {
      ctx.fillStyle = '#4b5563';
      ctx.fillText(org.address, 44, orgY);
      orgY += 18;
    }
    const orgMeta = [
      org?.tax_id ? `GSTIN: ${org.tax_id}` : '',
      org?.phone ? `Ph: ${org.phone}` : '',
      org?.email ? `Email: ${org.email}` : ''
    ].filter(Boolean).join('  |  ');
    if (orgMeta) {
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(orgMeta, 44, orgY);
      orgY += 18;
    }

    // Header Right: Invoice Title & Meta
    ctx.textAlign = 'right';
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('INVOICE', baseW - 44, 40);

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(`Invoice No: ${inv.invoice_number}`, baseW - 44, 72);
    ctx.fillText(`Issue Date: ${new Date(inv.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, baseW - 44, 90);
    ctx.fillText(`Due Date: ${new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, baseW - 44, 108);

    // Status pill
    const statusText = (inv.status || 'UNPAID').toUpperCase();
    const statusColor = statusText === 'PAID' ? '#10b981' : statusText === 'OVERDUE' ? '#ef4444' : '#6366f1';
    ctx.fillStyle = statusColor;
    ctx.fillRect(baseW - 130, 130, 86, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(statusText, baseW - 87, 135);

    ctx.textAlign = 'left';

    // Divider Line
    const dividerY = Math.max(orgY + 12, 165);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(44, dividerY);
    ctx.lineTo(baseW - 44, dividerY);
    ctx.stroke();

    // Client & Billed To Card
    const cardY = dividerY + 16;
    const cardW = (baseW - 104) / 2;
    const cardH = 95;

    // Seller Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(44, cardY, cardW, cardH);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(44, cardY, cardW, cardH);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('BILLED FROM (SELLER)', 56, cardY + 10);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(orgName, 56, cardY + 28);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(org?.address || 'Headquarters Address', 56, cardY + 46);
    if (org?.tax_id) {
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`GSTIN: ${org.tax_id}`, 56, cardY + 68);
    }

    // Buyer Box
    const buyerX = 44 + cardW + 16;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(buyerX, cardY, cardW, cardH);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(buyerX, cardY, cardW, cardH);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('BILLED TO (BUYER / CLIENT)', buyerX + 12, cardY + 10);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(inv.client_name || 'Client', buyerX + 12, cardY + 28);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const clientSub = [inv.client_company, inv.client_address].filter(Boolean).join(' - ') || 'Client Address';
    ctx.fillText(clientSub, buyerX + 12, cardY + 46);
    if (inv.client_tax_id) {
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`GSTIN: ${inv.client_tax_id}`, buyerX + 12, cardY + 68);
    }

    // Table Header
    let tableY = cardY + cardH + 20;
    const tableW = baseW - 88;
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(44, tableY, tableW, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('#', 54, tableY + 9);
    ctx.fillText('ITEM / SERVICE DESCRIPTION', 84, tableY + 9);
    ctx.fillText('HSN/SAC', 420, tableY + 9);
    ctx.textAlign = 'right';
    ctx.fillText('RATE', 560, tableY + 9);
    ctx.textAlign = 'center';
    ctx.fillText('QTY', 620, tableY + 9);
    ctx.textAlign = 'right';
    ctx.fillText('GST %', 690, tableY + 9);
    ctx.fillText('TOTAL AMOUNT', baseW - 54, tableY + 9);
    ctx.textAlign = 'left';

    tableY += 32;

    // Items rendering
    let subtotal = 0;
    const currency = inv.currency || 'INR';

    (inv.items || []).forEach((item: any, idx: number) => {
      const rowH = 42;
      const total = Number(item.quantity) * Number(item.unit_price);
      subtotal += total;

      if (idx % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(44, tableY, tableW, rowH);
      }

      ctx.fillStyle = '#64748b';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(String(idx + 1), 54, tableY + 12);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(item.description || 'Item', 84, tableY + 7);

      const itemType = (item.item_type || '').toUpperCase();
      if (itemType && itemType !== 'CUSTOM') {
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`[${itemType}]`, 84, tableY + 24);
      }

      ctx.fillStyle = '#475569';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(item.sku_hsn || '-', 420, tableY + 12);

      ctx.textAlign = 'right';
      ctx.fillText(`${currency} ${Number(item.unit_price).toFixed(2)}`, 560, tableY + 12);
      ctx.textAlign = 'center';
      ctx.fillText(Number(item.quantity).toFixed(0), 620, tableY + 12);
      ctx.textAlign = 'right';
      ctx.fillText(`${Number(item.tax_rate || 0)}%`, 690, tableY + 12);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${currency} ${total.toFixed(2)}`, baseW - 54, tableY + 12);
      ctx.textAlign = 'left';

      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(44, tableY + rowH);
      ctx.lineTo(baseW - 44, tableY + rowH);
      ctx.stroke();

      tableY += rowH;
    });

    tableY += 16;

    // Calculations Summary
    const discount = Number(inv.discount || 0);
    const taxable = Math.max(0, subtotal - discount);
    const flatTaxRate = Number(inv.tax_rate || 0);
    const flatTax = taxable * (flatTaxRate / 100);
    const grandTotal = taxable + flatTax;

    const summaryW = 320;
    const summaryX = baseW - 44 - summaryW;
    let calcY = tableY;

    // Summary Stack Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(summaryX, calcY, summaryW, 140);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(summaryX, calcY, summaryW, 140);

    const drawSummaryRow = (label: string, val: string, isBold = false, color = '#1e293b') => {
      ctx.fillStyle = '#64748b';
      ctx.font = `${isBold ? 'bold ' : ''}12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(label, summaryX + 16, calcY + 12);
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.font = `${isBold ? 'bold ' : ''}12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(val, summaryX + summaryW - 16, calcY + 12);
      ctx.textAlign = 'left';
      calcY += 26;
    };

    drawSummaryRow('Subtotal:', `${currency} ${subtotal.toFixed(2)}`);
    if (discount > 0) {
      drawSummaryRow('Discount:', `-${currency} ${discount.toFixed(2)}`, false, '#ef4444');
    }
    if (flatTaxRate > 0) {
      drawSummaryRow(`GST Tax (${flatTaxRate}%):`, `+${currency} ${flatTax.toFixed(2)}`);
    }

    // Grand Total Banner
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(summaryX, calcY, summaryW, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('TOTAL DUE:', summaryX + 16, calcY + 10);
    ctx.textAlign = 'right';
    ctx.fillText(`${currency} ${grandTotal.toFixed(2)}`, summaryX + summaryW - 16, calcY + 10);
    ctx.textAlign = 'left';

    // Left Box: Bank Details & Notes
    const leftW = summaryX - 44 - 20;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(44, tableY, leftW, 140);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(44, tableY, leftW, 140);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PAYMENT / BANK DETAILS', 56, tableY + 10);

    let bY = tableY + 28;
    ctx.fillStyle = '#334155';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    if (org?.bank_name) { ctx.fillText(`Bank: ${org.bank_name}`, 56, bY); bY += 16; }
    if (org?.bank_account_no) { ctx.fillText(`A/C: ${org.bank_account_no}`, 56, bY); bY += 16; }
    if (org?.bank_ifsc) { ctx.fillText(`IFSC: ${org.bank_ifsc}`, 56, bY); bY += 16; }
    if (org?.bank_upi_id) { ctx.fillText(`UPI: ${org.bank_upi_id}`, 56, bY); bY += 16; }

    const bottomY = Math.max(calcY + 50, tableY + 160);

    // Terms / Notes
    if (inv.notes) {
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Terms & Conditions / Notes:', 44, bottomY);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(inv.notes, 44, bottomY + 16);
    }

    // Signatory
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`For ${orgName}`, baseW - 44, bottomY);
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(baseW - 200, bottomY + 36);
    ctx.lineTo(baseW - 44, bottomY + 36);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Authorized Signatory', baseW - 44, bottomY + 42);
    ctx.textAlign = 'left';

    // Trigger download
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `Invoice_${inv.invoice_number}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generateWordDoc = (inv: any, org: any) => {
    const orgName = org?.name || 'Company LLC';
    const orgAddress = org?.address || 'HQ Address';
    const orgTaxId = org?.tax_id ? `GSTIN / Tax ID: ${org.tax_id}` : '';
    const orgPhone = org?.phone ? `Ph: ${org.phone}` : '';
    const orgEmail = org?.email ? `Email: ${org.email}` : '';

    const clientName = inv.client_name || 'Client';
    const clientCompany = inv.client_company || '';
    const clientAddress = inv.client_address || '';
    const clientTaxId = inv.client_tax_id ? `GSTIN: ${inv.client_tax_id}` : '';

    const currency = inv.currency || 'INR';

    let itemsHtml = '';
    (inv.items || []).forEach((item: any, idx: number) => {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      itemsHtml += `
        <tr style="background-color: ${idx % 2 === 1 ? '#f9fafb' : '#ffffff'};">
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10pt;">${idx + 1}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-size: 10.5pt;">
            <strong>${item.description || 'Item'}</strong>
            ${item.item_type && item.item_type !== 'custom' ? `<span style="font-size: 8pt; color: #6366f1; font-weight: bold; margin-left: 6px;">[${item.item_type.toUpperCase()}]</span>` : ''}
          </td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-size: 10pt; color: #4b5563;">${item.sku_hsn || '-'}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-size: 10.5pt;">${currency} ${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-size: 10.5pt; font-weight: bold;">${item.quantity}</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-size: 10pt; color: #6366f1;">${Number(item.tax_rate || 0)}%</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 11pt; color: #111827;">${currency} ${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    const subtotal = (inv.items || []).reduce((acc: number, it: any) => acc + (Number(it.quantity) * Number(it.unit_price)), 0);
    const discount = Number(inv.discount || 0);
    const taxable = Math.max(0, subtotal - discount);
    const flatTaxRate = Number(inv.tax_rate || 0);
    const taxAmount = taxable * (flatTaxRate / 100);
    const total = taxable + taxAmount;

    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Invoice ${inv.invoice_number}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; }
          body {
            font-family: Calibri, Arial, Helvetica, sans-serif;
            color: #1f2937;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          h1, h2, h3, h4 { margin: 0; padding: 0; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { vertical-align: top; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .info-card { width: 48%; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th { background-color: #4f46e5; color: #ffffff; padding: 10px; font-weight: bold; font-size: 10pt; text-align: left; border: 1px solid #4338ca; }
          .totals-table { width: 340px; border-collapse: collapse; float: right; margin-bottom: 25px; }
          .totals-table td { padding: 6px 12px; font-size: 10.5pt; }
          .bank-table { width: 320px; border-collapse: collapse; float: left; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 9pt; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <!-- Top Header -->
          <table class="header-table">
            <tr>
              <td>
                <h1 style="color: #4f46e5; font-size: 22pt; margin-bottom: 4px;">${orgName}</h1>
                <div style="font-size: 9.5pt; color: #6b7280; font-weight: bold; margin-bottom: 6px;">TAX INVOICE / OFFICIAL BILL</div>
                <div style="font-size: 10pt; color: #4b5563;">${orgAddress}</div>
                <div style="font-size: 9.5pt; color: #374151; font-weight: bold; margin-top: 4px;">${[orgTaxId, orgPhone, orgEmail].filter(Boolean).join(' &bull; ')}</div>
              </td>
              <td style="text-align: right;">
                <h2 style="color: #1e1b4b; font-size: 22pt; margin-bottom: 6px;">INVOICE</h2>
                <div style="font-size: 10.5pt; color: #374151;"><strong>Invoice No:</strong> ${inv.invoice_number}</div>
                <div style="font-size: 10pt; color: #6b7280;"><strong>Issue Date:</strong> ${new Date(inv.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style="font-size: 10pt; color: #6b7280;"><strong>Due Date:</strong> ${new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style="margin-top: 6px;">
                  <span class="badge" style="background-color: ${inv.status === 'paid' ? '#dcfce7; color: #15803d' : '#ede9fe; color: #4338ca'};">
                    ${(inv.status || 'UNPAID').toUpperCase()}
                  </span>
                </div>
              </td>
            </tr>
          </table>

          <hr style="border: none; border-top: 2px solid #e2e8f0; margin-bottom: 18px;" />

          <!-- Billed From & Billed To Cards -->
          <table class="info-table">
            <tr>
              <td class="info-card" style="vertical-align: top;">
                <div style="font-size: 9pt; font-weight: bold; color: #4f46e5; margin-bottom: 4px;">BILLED FROM (SELLER)</div>
                <div style="font-size: 11pt; font-weight: bold; color: #111827;">${orgName}</div>
                <div style="font-size: 9.5pt; color: #4b5563; margin-top: 2px;">${orgAddress}</div>
                ${orgTaxId ? `<div style="font-size: 9.5pt; font-weight: bold; color: #1f2937; margin-top: 4px;">${orgTaxId}</div>` : ''}
              </td>
              <td style="width: 4%;"></td>
              <td class="info-card" style="vertical-align: top;">
                <div style="font-size: 9pt; font-weight: bold; color: #4f46e5; margin-bottom: 4px;">BILLED TO (BUYER / CLIENT)</div>
                <div style="font-size: 11pt; font-weight: bold; color: #111827;">${clientName}</div>
                ${clientCompany ? `<div style="font-size: 10pt; font-weight: bold; color: #4b5563;">${clientCompany}</div>` : ''}
                <div style="font-size: 9.5pt; color: #4b5563; margin-top: 2px;">${clientAddress}</div>
                ${clientTaxId ? `<div style="font-size: 9.5pt; font-weight: bold; color: #1f2937; margin-top: 4px;">${clientTaxId}</div>` : ''}
              </td>
            </tr>
          </table>

          <!-- Line Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>Item / Description</th>
                <th style="width: 80px; text-align: center;">HSN/SAC</th>
                <th style="width: 90px; text-align: right;">Unit Price</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 60px; text-align: right;">GST %</th>
                <th style="width: 100px; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Payment Details & Calculations Stack -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px;">
                  <div style="font-size: 9pt; font-weight: bold; color: #4f46e5; margin-bottom: 6px;">PAYMENT / BANK DETAILS</div>
                  <div style="font-size: 9.5pt; color: #374151; line-height: 1.5;">
                    ${org?.bank_name ? `<div><strong>Bank Name:</strong> ${org.bank_name}</div>` : ''}
                    ${org?.bank_account_no ? `<div><strong>Account No:</strong> ${org.bank_account_no}</div>` : ''}
                    ${org?.bank_ifsc ? `<div><strong>IFSC / SWIFT:</strong> ${org.bank_ifsc}</div>` : ''}
                    ${org?.bank_upi_id ? `<div><strong>UPI ID:</strong> ${org.bank_upi_id}</div>` : ''}
                  </div>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top;">
                <table class="totals-table" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                  <tr>
                    <td style="color: #6b7280;">Subtotal:</td>
                    <td style="text-align: right; font-weight: bold;">${currency} ${subtotal.toFixed(2)}</td>
                  </tr>
                  ${discount > 0 ? `
                    <tr>
                      <td style="color: #6b7280;">Discount:</td>
                      <td style="text-align: right; color: #ef4444; font-weight: bold;">-${currency} ${discount.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                  ${flatTaxRate > 0 ? `
                    <tr>
                      <td style="color: #6b7280;">GST Tax (${flatTaxRate}%):</td>
                      <td style="text-align: right; font-weight: bold;">+${currency} ${taxAmount.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                  <tr style="background-color: #4f46e5; color: #ffffff; font-weight: bold; font-size: 12pt;">
                    <td style="padding: 10px; color: #ffffff;">Total Due:</td>
                    <td style="padding: 10px; text-align: right; color: #ffffff;">${currency} ${total.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Notes & Terms -->
          ${inv.notes ? `
            <div style="margin-top: 15px; padding: 12px; background-color: #f9fafb; border-left: 4px solid #4f46e5; font-size: 9.5pt;">
              <strong style="color: #4f46e5; display: block; margin-bottom: 4px;">Terms &amp; Conditions / Notes:</strong>
              <div>${inv.notes}</div>
            </div>
          ` : ''}

          <!-- Signatory -->
          <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
            <tr>
              <td style="width: 60%; font-size: 9pt; color: #9ca3af;">
                Thank you for your business! Generated via BillingFlow.
              </td>
              <td style="width: 40%; text-align: right;">
                <div style="font-size: 10pt; font-weight: bold; color: #111827;">For ${orgName}</div>
                <div style="margin-top: 40px; border-top: 1px solid #9ca3af; display: inline-block; width: 160px; text-align: center; font-size: 9pt; color: #6b7280; padding-top: 4px;">
                  Authorized Signatory
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${inv.invoice_number}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchInvoices();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || err}`);
    }
  };

  const handleSendReminder = async (id: string) => {
    try {
      const res = await apiFetch(`/api/invoices/${id}/reminder`, {
        method: 'POST'
      });
      alert(`Reminder email logged successfully!\nTo: ${res.log.to_email}\nSubject: ${res.log.subject}`);
      fetchInvoices();
    } catch (err: any) {
      alert(`Failed to send reminder: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await apiFetch(`/api/invoices/${id}`, {
        method: 'DELETE'
      });
      fetchInvoices();
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      alert('Error: Failed to delete invoice.');
    }
  };

  const handleCopyPublicLink = (inv: Invoice) => {
    const publicUrl = `${window.location.origin}/view/invoice/${inv.view_token || inv.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedInvoiceId(inv.id);
    setTimeout(() => setCopiedInvoiceId(null), 2500);
  };

  const handleWhatsAppShare = async (inv: Invoice) => {
    try {
      const fullData = await apiFetch(`/api/invoices/${inv.id}`);
      const subtotal = (fullData.items || []).reduce((acc: number, it: any) => acc + (Number(it.quantity) * Number(it.unit_price)), 0);
      const discount = Number(fullData.discount || 0);
      const cgstRate = Number(fullData.cgst_rate || 0);
      const sgstRate = Number(fullData.sgst_rate || 0);
      const igstRate = Number(fullData.igst_rate || 0);
      const flatTaxRate = Number(fullData.tax_rate || 0);

      const taxable = Math.max(0, subtotal - discount);
      let totalTax = 0;
      if (cgstRate > 0 || sgstRate > 0) totalTax = taxable * ((cgstRate + sgstRate) / 100);
      else if (igstRate > 0) totalTax = taxable * (igstRate / 100);
      else if (flatTaxRate > 0) totalTax = taxable * (flatTaxRate / 100);

      const total = taxable + totalTax;
      const publicBillUrl = `${window.location.origin}/view/invoice/${fullData.view_token || fullData.id}`;

      const text = generateInvoiceWhatsAppText({
        invoiceNumber: fullData.invoice_number,
        clientName: fullData.client_name,
        clientPhone: fullData.client_phone,
        organizationName: organization?.name || 'Our Company',
        issueDate: fullData.issue_date,
        dueDate: fullData.due_date,
        currency: fullData.currency || 'INR',
        total,
        publicBillUrl,
        items: fullData.items,
        notes: fullData.notes || fullData.terms_conditions
      });

      // Try Direct PDF File Sharing via Native Web Share API (WhatsApp/Apps)
      try {
        const pdfBlob = await apiFetch(`/api/invoices/${inv.id}/pdf`);
        if (pdfBlob && typeof File !== 'undefined' && navigator.canShare) {
          const pdfFile = new File([pdfBlob], `Invoice_${fullData.invoice_number || inv.id}.pdf`, { type: 'application/pdf' });
          if (navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              title: `Tax Invoice #${fullData.invoice_number}`,
              text: text,
              files: [pdfFile]
            });
            return;
          }
        }
      } catch (shareErr) {
        // Fallback to WhatsApp URL below
      }

      // Fallback: Open WhatsApp link with pre-filled message
      shareViaWhatsApp(text, fullData.client_phone);
    } catch (err: any) {
      alert(`Failed to prepare WhatsApp message: ${err.message || err}`);
    }
  };

  const handleUploadToDrive = async (inv: Invoice) => {
    const webhookUrl = localStorage.getItem('gdrive_webhook_url');
    const folderId = localStorage.getItem('gdrive_folder_id');
    if (!webhookUrl) {
      alert('Please configure your Google Drive Webhook URL in Settings first.');
      navigate('/settings');
      return;
    }
    try {
      const res = await apiFetch(`/api/invoices/${inv.id}/sync-drive`, {
        method: 'POST',
        body: JSON.stringify({ webhookUrl, folderId: folderId || undefined })
      });
      alert(res.message || `Invoice #${inv.invoice_number} synced to Google Drive!`);
    } catch (err: any) {
      alert(`Failed to upload to Google Drive: ${err.message || err}`);
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPaymentMethod('stripe');
    setPaymentNotes('');
    setIsPaying(false);
  };
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    setIsPaying(true);
    try {
      await apiFetch(`/api/invoices/${paymentInvoice.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod,
          notes: paymentNotes
        })
      });

      // Confetti burst on successful payment!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#06b6d4', '#10b981']
      });

      setPaymentInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsPaying(false);
    }
  };

  // Pagination state (Limit 50 items per page to prevent lag)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Filtering invoices with timeframe and status
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const fifteenDaysAgo = now.getTime() - 15 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.client_company && inv.client_company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = activeTab === 'all' || inv.status?.toLowerCase() === activeTab.toLowerCase();

    const invTime = new Date(inv.issue_date || (inv as any).created_at).getTime();
    let matchesTime = true;
    if (timeFilter === 'today') {
      matchesTime = invTime >= startOfToday;
    } else if (timeFilter === '7d') {
      matchesTime = invTime >= sevenDaysAgo;
    } else if (timeFilter === '15d') {
      matchesTime = invTime >= fifteenDaysAgo;
    } else if (timeFilter === '1m') {
      matchesTime = invTime >= oneMonthAgo;
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 700 }} className="text-gradient">
            Invoice Manager
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Draft, track, send reminders, share private bill links, and record payments.
          </p>
        </div>
        <button className="btn btn-primary hide-mobile" onClick={() => navigate('/invoices/new')}>
          <Plus size={16} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Tabs, Timeframe Filter, and Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* Status Tabs */}
          <div className="tab-bar-scroll" style={{ flex: '1 1 auto', minWidth: '260px' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              gap: '4px',
              width: 'max-content',
              minWidth: '100%'
            }}>
              {['all', 'draft', 'sent', 'paid', 'overdue'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  style={{
                    background: activeTab === tab ? 'var(--primary)' : 'transparent',
                    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Filter Pills */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            gap: '4px',
            flexShrink: 0,
            overflowX: 'auto'
          }}>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '15d', label: '15 Days' },
              { id: '1m', label: '1 Month' }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => { setTimeFilter(tf.id as any); setCurrentPage(1); }}
                style={{
                  background: timeFilter === tf.id ? 'var(--primary-glow)' : 'transparent',
                  color: timeFilter === tf.id ? 'var(--primary)' : 'var(--text-secondary)',
                  border: timeFilter === tf.id ? '1px solid var(--primary)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>


        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search invoice or client..."
            className="form-input"
            style={{ paddingLeft: '40px', width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ height: '70px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="pulse-glow"></div>
          ))}
        </div>
      ) : filteredInvoices.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="desktop-table table-scroll">
            <div className="custom-table-container fade-in">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Client</th>
                    <th>Issued</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Currency</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <span
                          style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                        >
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.client_name}</span>
                          {inv.client_company && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{inv.client_company}</span>
                          )}
                        </div>
                      </td>
                      <td>{new Date(inv.issue_date).toLocaleDateString()}</td>
                      <td>{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td>
                        <select
                          value={inv.status}
                          onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                          style={{
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                            borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                            color: inv.status === 'paid' ? 'var(--success)' : inv.status === 'overdue' ? 'var(--danger)' : inv.status === 'sent' ? 'var(--accent)' : '#d97706',
                            cursor: 'pointer', textTransform: 'capitalize'
                          }}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td>{(inv.currency || '').toUpperCase()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => navigate(`/invoices/edit/${inv.id}`)} title="Edit Invoice"><Eye size={14} /></button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', color: copiedInvoiceId === inv.id ? '#10b981' : '#38bdf8' }}
                            onClick={() => handleCopyPublicLink(inv)}
                            title="Copy Public Bill Link (No login required)"
                          >
                            {copiedInvoiceId === inv.id ? <Check size={14} /> : <Link2 size={14} />}
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', color: '#818cf8' }}
                            onClick={() => window.open(`/view/invoice/${inv.view_token || inv.id}`, '_blank')}
                            title="View Public Bill Statement"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setDownloadInvoice(inv)} title="Download Official Document"><FileDown size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#4285f4' }} onClick={() => handleUploadToDrive(inv)} title="Upload PDF to Google Drive"><Cloud size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#25D366' }} onClick={() => handleWhatsAppShare(inv)} title="Share via WhatsApp"><Share2 size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px', color: 'var(--accent)' }} onClick={() => handleSendReminder(inv.id)} title="Send Reminder Email"><Mail size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px', color: 'var(--success)' }} onClick={() => openPaymentModal(inv)} title="Record Payment"><CheckCircle2 size={14} /></button>
                          <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(inv.id)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="mobile-card-list" style={{ gap: '12px' }}>
            {paginatedInvoices.map((inv) => (
              <div key={inv.id} className="invoice-mobile-card" onClick={() => navigate(`/invoices/edit/${inv.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{inv.invoice_number}</div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '2px' }} className="text-truncate">{inv.client_name}</div>
                    {inv.client_company && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="text-truncate">{inv.client_company}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    {getStatusBadge(inv.status)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due {new Date(inv.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', color: copiedInvoiceId === inv.id ? '#10b981' : '#38bdf8' }}
                    onClick={() => handleCopyPublicLink(inv)}
                    title="Copy Public Link"
                  >
                    {copiedInvoiceId === inv.id ? <Check size={14} /> : <Link2 size={14} />}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#818cf8' }}
                    onClick={() => window.open(`/view/invoice/${inv.view_token || inv.id}`, '_blank')}
                    title="View Online"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => setDownloadInvoice(inv)} title="Download"><FileDown size={14} /></button>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#4285f4' }} onClick={() => handleUploadToDrive(inv)} title="Drive"><Cloud size={14} /></button>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#25D366' }} onClick={() => handleWhatsAppShare(inv)} title="WhatsApp"><Share2 size={14} /></button>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--accent)' }} onClick={() => handleSendReminder(inv.id)} title="Email"><Mail size={14} /></button>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--success)' }} onClick={() => openPaymentModal(inv)} title="Pay"><CheckCircle2 size={14} /></button>
                  <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(inv.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* 50-Item Pagination Bar */}
          {filteredInvoices.length > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} – {Math.min(currentPage * PAGE_SIZE, filteredInvoices.length)} of {filteredInvoices.length} invoices (50 per page)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage <= 1}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
          <Receipt size={40} color="var(--text-muted)" />
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>No invoices found</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first invoice to bill a client.'}
            </p>
          </div>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
              <Plus size={16} />
              <span>Create First Invoice</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile FAB */}
      <button className="fab" onClick={() => navigate('/invoices/new')} title="Create Invoice">
        <Plus size={22} />
      </button>

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <div className="modal-overlay" onClick={() => setPaymentInvoice(null)}>
          <div className="modal-box fade-in" onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Record Payment</h4>
              <button 
                onClick={() => setPaymentInvoice(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Record a payment collections receipt for <strong style={{ color: 'var(--text-primary)' }}>Invoice {paymentInvoice.invoice_number}</strong> issued to {paymentInvoice.client_name}.
            </p>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Method</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                >
                  <option value="stripe">Stripe Checkout</option>
                  <option value="bank_transfer">Bank Wire / ACH</option>
                  <option value="cash">Cash Payment</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notes / Reference</label>
                <input
                  type="text"
                  placeholder="Tx ID, Bank Ref, etc."
                  className="form-input"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={isPaying} className="btn btn-accent" style={{ background: 'linear-gradient(135deg, var(--success), #059669)', border: 'none' }}>
                  {isPaying ? 'Recording...' : 'Confirm Paid'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Download Format Modal */}
      {downloadInvoice && (
        <div className="modal-overlay" onClick={() => setDownloadInvoice(null)}>
          <div className="modal-box fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Download Invoice</h4>
              <button onClick={() => setDownloadInvoice(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>&times;</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Choose a format to download <strong style={{ color: 'var(--text-primary)' }}>Invoice {downloadInvoice.invoice_number}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['pdf', 'png', 'doc'] as const).map(fmt => (
                <label key={fmt} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  border: `2px solid ${downloadFormat === fmt ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: '10px', cursor: 'pointer',
                  background: downloadFormat === fmt ? 'var(--accent-bg, rgba(99,102,241,0.08))' : 'transparent',
                  transition: 'all 0.2s'
                }}>
                  <input type="radio" name="format" value={fmt} checked={downloadFormat === fmt} onChange={() => setDownloadFormat(fmt)} style={{ accentColor: 'var(--accent)' }} />
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>{fmt}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                    {fmt === 'pdf' ? 'Portable Document Format' : fmt === 'png' ? 'Image Screenshot' : 'Word Document'}
                  </span>
                </label>
              ))}
            </div>

            <form onSubmit={handleDownload} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDownloadInvoice(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isDownloading}>
                {isDownloading ? 'Downloading...' : `Download ${downloadFormat.toUpperCase()}`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
