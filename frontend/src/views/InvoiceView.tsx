import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Printer,
  Building2,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  currency: string;
  tax_rate?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  discount?: number;
  notes?: string;
  terms_conditions?: string;
  thanks_message?: string;
  view_token?: string;
}

interface ClientData {
  name: string;
  email?: string;
  company_name?: string;
  address?: string;
  phone?: string;
  tax_id?: string;
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  tax_id?: string;
  phone?: string;
  payment_qr_link?: string;
  terms_conditions?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_upi_id?: string;
  signatory_name?: string;
  signatory_designation?: string;
  thanks_message?: string;
  contact_email?: string;
  contact_phone?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const InvoiceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/public/invoices/${id}`);
        if (!res.ok) {
          throw new Error('Invoice not found or link has expired.');
        }
        const data = await res.json();
        setInvoice(data.invoice);
        setClient(data.client);
        setOrganization(data.organization);
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPDF = () => {
    if (!id) return;
    const downloadUrl = `${API_BASE_URL}/api/public/invoices/${id}/pdf`;
    window.open(downloadUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '42px', height: '42px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Loading Official Invoice Statement...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice || !organization || !client) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Invoice Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>{error || 'This invoice may have been removed or the private link is invalid.'}</p>
          <Link to="/" style={{ display: 'inline-block', background: '#6366f1', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Subtotal & Taxes
  const subtotal = items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const taxableBase = Math.max(0, subtotal - discount);

  const cgstRate = Number(invoice.cgst_rate || 0);
  const sgstRate = Number(invoice.sgst_rate || 0);
  const igstRate = Number(invoice.igst_rate || 0);
  const flatTaxRate = Number(invoice.tax_rate || 0);

  const hasCgstSgst = cgstRate > 0 || sgstRate > 0;
  const hasIgst = !hasCgstSgst && igstRate > 0;
  const hasFlatTax = !hasCgstSgst && !hasIgst && flatTaxRate > 0;

  const cgstAmount = taxableBase * (cgstRate / 100);
  const sgstAmount = taxableBase * (sgstRate / 100);
  const igstAmount = taxableBase * (igstRate / 100);
  const flatTaxAmount = taxableBase * (flatTaxRate / 100);

  let totalTax = 0;
  if (hasCgstSgst) totalTax = cgstAmount + sgstAmount;
  else if (hasIgst) totalTax = igstAmount;
  else if (hasFlatTax) totalTax = flatTaxAmount;

  const grandTotal = taxableBase + totalTax;
  const currency = invoice.currency || 'INR';

  // Format status badge
  const statusUpper = (invoice.status || 'DRAFT').toUpperCase();
  let statusBg = '#3b82f6';
  let statusText = statusUpper;
  if (statusUpper === 'PAID') {
    statusBg = '#10b981';
  } else if (statusUpper === 'PENDING' || statusUpper === 'UNPAID' || statusUpper === 'SENT') {
    statusBg = '#f59e0b';
  } else if (statusUpper === 'OVERDUE') {
    statusBg = '#ef4444';
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', padding: '32px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Top Floating Actions Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#6366f1', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#ffffff' }}>
              BF
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{organization.name}</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Secure Invoice Portal</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '9px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', color: '#ffffff', padding: '9px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)', transition: 'all 0.2s' }}
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Main Document Card */}
        <div style={{ background: '#131c2e', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 45px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          
          {/* Header Banner */}
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderBottom: '1px solid #3730a3', padding: '32px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              {organization.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain', marginBottom: '12px', display: 'block' }} />
              ) : (
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>{organization.name}</div>
              )}
              <div style={{ fontSize: '0.8rem', color: '#c7d2fe', lineHeight: 1.5, maxWidth: '280px' }}>
                {organization.address && <div>{organization.address}</div>}
                {organization.tax_id && <div style={{ fontWeight: 700, color: '#a5b4fc', marginTop: '2px' }}>Seller GSTIN: {organization.tax_id}</div>}
                {organization.phone && <div>Ph: {organization.phone}</div>}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: statusBg, color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.5px', marginBottom: '10px' }}>
                {statusText}
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px', color: '#ffffff', letterSpacing: '-0.5px' }}>
                TAX INVOICE
              </h1>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#818cf8' }}>#{invoice.invoice_number}</div>
            </div>
          </div>

          <div style={{ padding: '32px 36px' }}>
            
            {/* Meta Row: Billed To & Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              
              {/* Buyer Card */}
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  <User size={15} />
                  BILLED TO (BUYER)
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>{client.name}</div>
                {client.company_name && <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>{client.company_name}</div>}
                {client.address && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{client.address}</div>}
                {client.tax_id && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>Buyer GSTIN: {client.tax_id}</div>}
                {client.phone && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Ph: {client.phone}</div>}
              </div>

              {/* Dates & Reference Card */}
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  <Calendar size={15} />
                  INVOICE DETAILS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Issue Date</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Due Date</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171' }}>
                      {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Currency</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>{currency}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Payment Mode</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8' }}>Online / Bank Transfer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#090d16', borderBottom: '1px solid #1e293b' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', width: '40px' }}>#</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>ITEM & DESCRIPTION</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textAlign: 'right', width: '110px' }}>UNIT PRICE</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', width: '70px' }}>QTY</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textAlign: 'right', width: '130px' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rowTotal = Number(item.quantity) * Number(item.unit_price);
                    return (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '14px', fontSize: '0.8rem', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '14px', fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>{item.description}</td>
                        <td style={{ padding: '14px', fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'right' }}>
                          {currency} {Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px', fontSize: '0.85rem', color: '#f1f5f9', textAlign: 'center', fontWeight: 600 }}>
                          {Number(item.quantity)}
                        </td>
                        <td style={{ padding: '14px', fontSize: '0.9rem', color: '#818cf8', fontWeight: 700, textAlign: 'right' }}>
                          {currency} {rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
              <div style={{ width: '100%', maxWidth: '360px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{currency} {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span>Discount</span>
                    <span style={{ color: '#f87171', fontWeight: 600 }}>-{currency} {discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {hasCgstSgst && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <span>CGST ({cgstRate}%)</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{currency} {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <span>SGST ({sgstRate}%)</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{currency} {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}

                {hasIgst && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span>IGST ({igstRate}%)</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{currency} {igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {hasFlatTax && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    <span>Tax ({flatTaxRate}%)</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{currency} {flatTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #1e293b', marginTop: '8px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Total Due</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8' }}>
                    {currency} {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Thanks Message Banner */}
            {(invoice.thanks_message || organization.thanks_message) && (
              <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.08))', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '16px 20px', textAlign: 'center', marginBottom: '28px', color: '#c7d2fe', fontSize: '0.9rem', fontWeight: 600 }}>
                ✨ {invoice.thanks_message || organization.thanks_message}
              </div>
            )}

            {/* Bottom 3 Cards: Bank Details, Terms, Authorized Signatory */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              {/* Payment Details & Contact */}
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  <CreditCard size={15} />
                  BANK & PAYMENT DETAILS
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {organization.bank_name && (
                    <div><span style={{ color: '#64748b' }}>Bank:</span> <strong style={{ color: '#f1f5f9' }}>{organization.bank_name}</strong></div>
                  )}
                  {organization.bank_account_no && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div><span style={{ color: '#64748b' }}>A/C No:</span> <strong style={{ color: '#f1f5f9' }}>{organization.bank_account_no}</strong></div>
                      <button
                        onClick={() => copyToClipboard(organization.bank_account_no!, 'acc')}
                        style={{ background: 'transparent', border: 'none', color: copiedField === 'acc' ? '#10b981' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {copiedField === 'acc' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                  {organization.bank_ifsc && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div><span style={{ color: '#64748b' }}>IFSC / SWIFT:</span> <strong style={{ color: '#f1f5f9' }}>{organization.bank_ifsc}</strong></div>
                      <button
                        onClick={() => copyToClipboard(organization.bank_ifsc!, 'ifsc')}
                        style={{ background: 'transparent', border: 'none', color: copiedField === 'ifsc' ? '#10b981' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {copiedField === 'ifsc' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                  {organization.bank_upi_id && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div><span style={{ color: '#64748b' }}>UPI ID:</span> <strong style={{ color: '#38bdf8' }}>{organization.bank_upi_id}</strong></div>
                      <button
                        onClick={() => copyToClipboard(organization.bank_upi_id!, 'upi')}
                        style={{ background: 'transparent', border: 'none', color: copiedField === 'upi' ? '#10b981' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {copiedField === 'upi' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                  {(organization.contact_phone || organization.phone) && (
                    <div><span style={{ color: '#64748b' }}>Pay Contact:</span> <strong style={{ color: '#f1f5f9' }}>{organization.contact_phone || organization.phone}</strong></div>
                  )}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  <FileText size={15} />
                  TERMS & CONDITIONS
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  {invoice.terms_conditions || organization.terms_conditions || invoice.notes || 'Payment is due within 30 days of the invoice date. Late payments may incur interest charges.'}
                </p>
              </div>

              {/* Authorized Signatory */}
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <ShieldCheck size={15} />
                  AUTHORIZED SIGNATORY
                </div>
                <div style={{ textAlign: 'center', margin: '20px 0 10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>For {organization.name}</div>
                  <div style={{ width: '140px', height: '1px', background: '#334155', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>
                    {organization.signatory_name || 'Authorized Signatory'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {organization.signatory_designation || 'Signatory Authority'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Branding Bar */}
          <div style={{ background: '#090d16', borderTop: '1px solid #1e293b', padding: '20px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Official Tax Invoice generated securely via BillingFlow.
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Powered by</span>
              <span style={{ color: '#a5b4fc', letterSpacing: '0.5px' }}>HMorix</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default InvoiceView;
