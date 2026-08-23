import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ArrowLeft, Save, Sparkles, ReceiptText, ShieldCheck } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company_name: string | null;
}

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

type TaxMode = 'cgst_sgst' | 'igst' | 'flat' | 'none';

export const InvoiceEdit: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { apiFetch, organization } = useAuth();

  const isEditMode = !!id;

  // Form states
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Tax States
  const [taxMode, setTaxMode] = useState<TaxMode>('cgst_sgst');
  const [cgstRate, setCgstRate] = useState<number>(9);
  const [sgstRate, setSgstRate] = useState<number>(9);
  const [igstRate, setIgstRate] = useState<number>(18);
  const [flatTaxRate, setFlatTaxRate] = useState<number>(0);

  const [discount, setDiscount] = useState<number>(0);
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState(organization?.termsConditions || '');
  const [thanksMessage, setThanksMessage] = useState(organization?.thanksMessage || 'Thank you for your business!');
  const [status, setStatus] = useState('draft');
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients and invoice details (if editing)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const clientList = await apiFetch('/api/clients');
        setClients(clientList);

        if (isEditMode) {
          const invoice = await apiFetch(`/api/invoices/${id}`);
          setSelectedClientId(invoice.client_id);
          setInvoiceNumber(invoice.invoice_number);
          setIssueDate(invoice.issue_date.split('T')[0]);
          setDueDate(invoice.due_date.split('T')[0]);
          
          const cgst = Number(invoice.cgst_rate || 0);
          const sgst = Number(invoice.sgst_rate || 0);
          const igst = Number(invoice.igst_rate || 0);
          const tax = Number(invoice.tax_rate || 0);

          if (cgst > 0 || sgst > 0) {
            setTaxMode('cgst_sgst');
            setCgstRate(cgst);
            setSgstRate(sgst);
          } else if (igst > 0) {
            setTaxMode('igst');
            setIgstRate(igst);
          } else if (tax > 0) {
            setTaxMode('flat');
            setFlatTaxRate(tax);
          } else {
            setTaxMode('none');
          }

          setDiscount(Number(invoice.discount || 0));
          setCurrency(invoice.currency || 'INR');
          setNotes(invoice.notes || '');
          setTermsConditions(invoice.terms_conditions || organization?.termsConditions || '');
          setThanksMessage(invoice.thanks_message || organization?.thanksMessage || 'Thank you for your business!');
          setStatus(invoice.status);
          setItems(invoice.items.map((it: any) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price)
          })));
        } else {
          // Initialize defaults from organization profile
          if (organization?.termsConditions) {
            setTermsConditions(organization.termsConditions);
          }
          if (organization?.thanksMessage) {
            setThanksMessage(organization.thanksMessage);
          }
        }
      } catch (err) {
        console.error('Error loading editor data:', err);
        setError('Failed to retrieve initialization data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, organization]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemInput, val: any) => {
    const updated = [...items];
    if (field === 'description') {
      updated[index].description = val;
    } else {
      updated[index][field] = Number(val);
    }
    setItems(updated);
  };

  // Preset GST selection
  const applyGstPreset = (rate: number) => {
    const half = rate / 2;
    setCgstRate(half);
    setSgstRate(half);
    setIgstRate(rate);
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
  const discountAmount = Number(discount || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let cgstCalc = 0;
  let sgstCalc = 0;
  let igstCalc = 0;
  let flatTaxCalc = 0;
  let totalTax = 0;

  if (taxMode === 'cgst_sgst') {
    cgstCalc = taxableAmount * ((cgstRate || 0) / 100);
    sgstCalc = taxableAmount * ((sgstRate || 0) / 100);
    totalTax = cgstCalc + sgstCalc;
  } else if (taxMode === 'igst') {
    igstCalc = taxableAmount * ((igstRate || 0) / 100);
    totalTax = igstCalc;
  } else if (taxMode === 'flat') {
    flatTaxCalc = taxableAmount * ((flatTaxRate || 0) / 100);
    totalTax = flatTaxCalc;
  }

  const total = taxableAmount + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClientId) {
      setError('Please select a client.');
      return;
    }

    if (items.some(it => !it.description || it.quantity <= 0 || it.unit_price < 0)) {
      setError('Please fill in descriptions and valid quantities/prices for all line items.');
      return;
    }

    const payload = {
      clientId: selectedClientId,
      invoiceNumber: invoiceNumber || undefined,
      issueDate,
      dueDate,
      taxRate: taxMode === 'flat' ? flatTaxRate : 0,
      cgstRate: taxMode === 'cgst_sgst' ? cgstRate : 0,
      sgstRate: taxMode === 'cgst_sgst' ? sgstRate : 0,
      igstRate: taxMode === 'igst' ? igstRate : 0,
      discount,
      currency,
      notes,
      termsConditions,
      thanksMessage,
      items,
      status: isEditMode ? status : undefined
    };

    try {
      const endpoint = isEditMode ? `/api/invoices/${id}` : '/api/invoices';
      const method = isEditMode ? 'PUT' : 'POST';

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      navigate('/invoices');
    } catch (err: any) {
      setError(err.message || 'Failed to save the invoice.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ height: '36px', background: 'var(--bg-tertiary)', borderRadius: '4px', width: '200px' }} className="pulse-glow"></div>
        <div style={{ height: '400px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="pulse-glow"></div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }} className="text-gradient">
            {isEditMode ? `Edit Invoice: ${invoiceNumber}` : 'Create Tax Invoice'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Configure client, GST/tax rates, line items, terms, and custom business greetings.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Editor Card */}
      <form onSubmit={handleSubmit} className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Core fields */}
        <div className="form-grid-2">
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Client *</label>
            <select
              required
              className="form-input"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company_name ? `(${c.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Invoice Number</label>
            <input
              type="text"
              placeholder="Leave empty for auto-generation (INV-0001)"
              className="form-input"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              disabled={isEditMode}
            />
          </div>

        </div>

        <div className="grid-3-col">
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Issue Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Due Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Currency</label>
            <select
              className="form-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <option value="INR">INR (₹) - Indian Rupee (Default)</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="AED">AED (د.إ) - UAE Dirham</option>
              <option value="CAD">CAD (CA$) - Canadian Dollar</option>
              <option value="AUD">AUD (A$) - Australian Dollar</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
              <option value="SAR">SAR (﷼) - Saudi Riyal</option>
              <option value="SGD">SGD (S$) - Singapore Dollar</option>
            </select>
          </div>

        </div>

        {isEditMode && (
          <div className="form-group" style={{ marginBottom: 0, maxWidth: '280px' }}>
            <label className="form-label">Invoice Status</label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

        {/* Invoice items */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>Line Items</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <input
                  type="text"
                  required
                  placeholder="Service / Product Description"
                  className="form-input"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Qty"
                      className="form-input"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Unit Price"
                      className="form-input"
                      value={item.unit_price || ''}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '12px', flexShrink: 0 }}
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '16px', padding: '8px 14px', fontSize: '0.8rem' }}
            onClick={handleAddItem}
          >
            <Plus size={14} />
            <span>Add Row</span>
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

        {/* GST & Tax Configuration Section */}
        <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
              <ReceiptText size={18} />
              <span>GST & Tax Breakdown Configuration</span>
            </div>

            {/* Quick Slabs Presets */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Quick Slabs:</span>
              {[5, 12, 18, 28].map(slab => (
                <button
                  key={slab}
                  type="button"
                  onClick={() => applyGstPreset(slab)}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {slab}%
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tax Type</label>
              <select
                className="form-input"
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as TaxMode)}
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
              >
                <option value="cgst_sgst">Dual GST (CGST + SGST - Intra-state)</option>
                <option value="igst">Integrated GST (IGST - Inter-state)</option>
                <option value="flat">Single / Flat Tax Rate (%)</option>
                <option value="none">Zero Rated / No Tax (0%)</option>
              </select>
            </div>

            {taxMode === 'cgst_sgst' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CGST Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={cgstRate}
                    onChange={(e) => setCgstRate(Number(e.target.value))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SGST Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={sgstRate}
                    onChange={(e) => setSgstRate(Number(e.target.value))}
                  />
                </div>
              </>
            )}

            {taxMode === 'igst' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">IGST Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="form-input"
                  value={igstRate}
                  onChange={(e) => setIgstRate(Number(e.target.value))}
                />
              </div>
            )}

            {taxMode === 'flat' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="form-input"
                  value={flatTaxRate}
                  onChange={(e) => setFlatTaxRate(Number(e.target.value))}
                />
              </div>
            )}

          </div>
        </div>

        {/* Bottom Panel (Notes, Terms, Thanks Message & Calculations) */}
        <div className="form-grid-2" style={{ gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Custom Terms & Conditions</label>
              <textarea
                placeholder="e.g. Payment due within 30 days. Late payment interest 1.5%..."
                className="form-input"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Thanks & Business Greeting Message</label>
              <input
                type="text"
                placeholder="e.g. Thank you for your business! We look forward to serving you again."
                className="form-input"
                value={thanksMessage}
                onChange={(e) => setThanksMessage(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Internal Notes / Payment Comments</label>
              <textarea
                placeholder="Optional notes or remittance instructions..."
                className="form-input"
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currency} {subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Discount (Flat):</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                style={{ width: '130px', padding: '5px 8px', fontSize: '0.85rem', textAlign: 'right' }}
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>

            {taxMode === 'cgst_sgst' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>CGST ({cgstRate}%):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>+{currency} {cgstCalc.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>SGST ({sgstRate}%):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>+{currency} {sgstCalc.toFixed(2)}</span>
                </div>
              </>
            )}

            {taxMode === 'igst' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>IGST ({igstRate}%):</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>+{currency} {igstCalc.toFixed(2)}</span>
              </div>
            )}

            {taxMode === 'flat' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Tax ({flatTaxRate}%):</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>+{currency} {flatTaxCalc.toFixed(2)}</span>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Due:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                {currency} {total.toFixed(2)}
              </span>
            </div>

          </div>

        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/invoices')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ minWidth: '140px' }}>
            <Save size={16} />
            <span>{isEditMode ? 'Update Invoice' : 'Create & Save'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
export default InvoiceEdit;

