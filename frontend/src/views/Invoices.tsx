import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, FileDown, Mail, CheckCircle2, Trash2, Eye, Receipt, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

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
}

export const Invoices: React.FC = () => {
  const { apiFetch, organization } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear / background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Brand Accent
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(40, 40, 15, 15);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('INVOICE', 40, 95);

    ctx.fillStyle = '#4b5563';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Invoice No: ${inv.invoice_number}`, 40, 120);
    ctx.fillText(`Date: ${new Date(inv.issue_date).toLocaleDateString()}`, 40, 138);
    ctx.fillText(`Due Date: ${new Date(inv.due_date).toLocaleDateString()}`, 40, 156);

    // Divider line
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 185);
    ctx.lineTo(760, 185);
    ctx.stroke();

    // Billed From / Billed To
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('BILLED FROM:', 40, 220);
    ctx.font = '12px sans-serif';
    ctx.fillText(org?.name || 'Company LLC', 40, 238);
    ctx.fillText(org?.address || 'HQ Address', 40, 256);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('BILLED TO:', 450, 220);
    ctx.font = '12px sans-serif';
    ctx.fillText(inv.client_name, 450, 238);
    ctx.fillText(inv.client_company || '', 450, 256);
    ctx.fillText(inv.client_address || '', 450, 274);

    // Table Header
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(40, 320, 720, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('DESCRIPTION', 50, 338);
    ctx.fillText('QTY', 480, 338);
    ctx.fillText('UNIT PRICE', 580, 338);
    ctx.fillText('TOTAL AMOUNT', 680, 338);

    // Table items
    let y = 375;
    let subtotal = 0;
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px sans-serif';
    inv.items.forEach((item: any) => {
      const total = Number(item.quantity) * Number(item.unit_price);
      subtotal += total;
      ctx.fillText(item.description, 50, y);
      ctx.fillText(String(item.quantity), 480, y);
      ctx.fillText(`${inv.currency} ${Number(item.unit_price).toFixed(2)}`, 580, y);
      ctx.fillText(`${inv.currency} ${total.toFixed(2)}`, 680, y);
      
      ctx.strokeStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.moveTo(40, y + 10);
      ctx.lineTo(760, y + 10);
      ctx.stroke();
      y += 35;
    });

    // Totals
    const discount = Number(inv.discount || 0);
    const taxRate = Number(inv.tax_rate || 0);
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * (taxRate / 100);
    const grandTotal = taxable + tax;

    ctx.fillStyle = '#4b5563';
    ctx.font = '12px sans-serif';
    ctx.fillText('Subtotal:', 500, y + 20);
    ctx.fillText(`${inv.currency} ${subtotal.toFixed(2)}`, 680, y + 20);

    ctx.fillText('Discount:', 500, y + 40);
    ctx.fillText(`-${inv.currency} ${discount.toFixed(2)}`, 680, y + 40);

    ctx.fillText(`Tax (${taxRate}%):`, 500, y + 60);
    ctx.fillText(`${inv.currency} ${tax.toFixed(2)}`, 680, y + 60);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Total Due:', 500, y + 90);
    ctx.fillText(`${inv.currency} ${grandTotal.toFixed(2)}`, 680, y + 90);

    // Notes
    if (inv.notes) {
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Notes / Terms & Conditions:', 40, y + 40);
      ctx.font = '11px sans-serif';
      ctx.fillText(inv.notes, 40, y + 60);
    }

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
    const clientName = inv.client_name;
    const clientCompany = inv.client_company || '';
    const clientAddress = inv.client_address || '';
    const currency = inv.currency || 'USD';

    let itemsHtml = '';
    inv.items.forEach((item: any) => {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      itemsHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currency} ${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${currency} ${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    const subtotal = inv.items.reduce((acc: number, it: any) => acc + (Number(it.quantity) * Number(it.unit_price)), 0);
    const discount = Number(inv.discount || 0);
    const taxRate = Number(inv.tax_rate || 0);
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * (taxRate / 100);
    const total = taxable + tax;

    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <title>Invoice ${inv.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
          h2 { color: #6366f1; margin: 0 0 10px 0; font-size: 22px; }
          .meta-table { width: 100%; margin-bottom: 25px; border: none; }
          .meta-table td { padding: 4px; vertical-align: top; font-size: 12px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .items-table th { background-color: #6366f1; color: white; padding: 8px; font-weight: bold; border: 1px solid #ddd; font-size: 12px; text-align: left; }
          .items-table td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
          .totals-table { float: right; width: 240px; border-collapse: collapse; margin-bottom: 20px; }
          .totals-table td { padding: 6px; font-size: 12px; }
          .footer-note { font-size: 10px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; }
        </style>
      </head>
      <body>
        <table class="meta-table">
          <tr>
            <td>
              <h2>${orgName.toUpperCase()}</h2>
              <div>${orgAddress}</div>
            </td>
            <td style="text-align: right;">
              <h2 style="color: #333;">INVOICE</h2>
              <div><strong>Invoice No:</strong> ${inv.invoice_number}</div>
              <div><strong>Date:</strong> ${new Date(inv.issue_date).toLocaleDateString()}</div>
              <div><strong>Due Date:</strong> ${new Date(inv.due_date).toLocaleDateString()}</div>
            </td>
          </tr>
        </table>

        <table class="meta-table">
          <tr>
            <td style="width: 50%;">
              <div style="font-weight: bold; color: #999; margin-bottom: 4px;">BILLED FROM:</div>
              <strong>${orgName}</strong>
              <div>${orgAddress}</div>
            </td>
            <td style="width: 50%;">
              <div style="font-weight: bold; color: #999; margin-bottom: 4px;">BILLED TO:</div>
              <strong>${clientName}</strong>
              <div>${clientCompany}</div>
              <div>${clientAddress}</div>
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center; width: 50px;">Qty</th>
              <th style="text-align: right; width: 90px;">Unit Price</th>
              <th style="text-align: right; width: 90px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">${currency} ${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Discount:</td>
            <td style="text-align: right; color: #ef4444;">-${currency} ${discount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="border-bottom: 1px solid #ddd; padding-bottom: 6px;">Tax (${taxRate}%):</td>
            <td style="text-align: right; border-bottom: 1px solid #ddd; padding-bottom: 6px;">${currency} ${tax.toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; color: #6366f1; font-size: 14px;">
            <td style="padding-top: 8px;">Total Due:</td>
            <td style="text-align: right; padding-top: 8px;">${currency} ${total.toFixed(2)}</td>
          </tr>
        </table>
        <div style="clear: both;"></div>

        ${inv.notes ? `
          <div style="margin-top: 25px; font-size: 12px;">
            <strong style="display: block; margin-bottom: 4px; color: #6366f1;">Notes &amp; Terms:</strong>
            <div>${inv.notes}</div>
          </div>
        ` : ''}

        <div class="footer-note">
          Generated via BillingFlow. Thank you for your business!
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

  // Filtering invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return inv.status === activeTab && matchesSearch;
  });

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }} className="text-gradient">
            Invoice Manager
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Draft, track collections, send reminders, and record incoming payments.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
          <Plus size={16} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Tabs and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          gap: '4px'
        }}>
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
          <input
            type="text"
            placeholder="Search invoice or client..."
            className="form-input"
            style={{ paddingLeft: '40px' }}
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
        <div className="custom-table-container fade-in">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Client</th>
                <th>Issued</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
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
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: inv.status === 'paid' ? 'var(--success)' : inv.status === 'overdue' ? 'var(--danger)' : inv.status === 'sent' ? 'var(--accent)' : '#d97706',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td>{(inv.currency || '').toUpperCase()} {Number(inv.discount || 0) > 0 ? 'Discounted' : ''}</td>

                  <td style={{ textAlign: 'right' }}>

                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px' }}
                        onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                        title="Edit Invoice"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px' }}
                        onClick={() => setDownloadInvoice(inv)}
                        title="Download Invoice Format"
                      >
                        <FileDown size={14} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', color: 'var(--accent)' }}
                        onClick={() => handleSendReminder(inv.id)}
                        title="Send Email Reminder"
                      >
                        <Mail size={14} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', color: 'var(--success)' }}
                        onClick={() => openPaymentModal(inv)}
                        title="Record Payment"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px' }}
                        onClick={() => handleDelete(inv.id)}
                        title="Delete Invoice"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
