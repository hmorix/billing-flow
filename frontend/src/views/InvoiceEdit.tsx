import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

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

export const InvoiceEdit: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const isEditMode = !!id;

  // Form states
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Default due in 30 days
    return d.toISOString().split('T')[0];
  });
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');
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
          setTaxRate(Number(invoice.tax_rate));
          setDiscount(Number(invoice.discount));
          setCurrency(invoice.currency);
          setNotes(invoice.notes || '');
          setStatus(invoice.status);
          setItems(invoice.items.map((it: any) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price)
          })));
        }
      } catch (err) {
        console.error('Error loading editor data:', err);
        setError('Failed to retrieve initialization data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // Keep at least one item
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

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
  const discountAmount = Number(discount || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * ((taxRate || 0) / 100);
  const total = taxableAmount + taxAmount;

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
      invoiceNumber: invoiceNumber || undefined, // Send undefined to auto-generate
      issueDate,
      dueDate,
      taxRate,
      discount,
      currency,
      notes,
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
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }} className="text-gradient">
            {isEditMode ? `Edit Invoice: ${invoiceNumber}` : 'Create Invoice'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Configure client, schedule, items, and tax parameters.
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
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
              disabled={isEditMode} // Cannot rename invoice numbers in standard business rules
            />
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          
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
            <input
              type="text"
              required
              placeholder="USD"
              className="form-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
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
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr auto', gap: '14px', alignItems: 'center' }}>
                
                <input
                  type="text"
                  required
                  placeholder="Service / Product Description"
                  className="form-input"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                />

                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Qty"
                  className="form-input"
                  value={item.quantity || ''}
                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                />

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

                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '12px' }}
                  onClick={() => handleRemoveItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 size={16} />
                </button>

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

        {/* Bottom Panel (Calculations & Notes) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes & Payment terms</label>
            <textarea
              placeholder="e.g. Please send wire transfers to bank account details:..."
              className="form-input"
              rows={4}
              style={{ resize: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currency} {subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discount (Flat)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={taxRate || ''}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>Total Due:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
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
          <button type="submit" className="btn btn-primary" style={{ minWidth: '130px' }}>
            <Save size={16} />
            <span>Save Invoice</span>
          </button>
        </div>

      </form>

    </div>
  );
};
