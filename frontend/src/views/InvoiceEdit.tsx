import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Sparkles,
  ReceiptText,
  ShieldCheck,
  Package,
  Wrench,
  Boxes,
  Layers,
  Search,
  X,
  Tag,
  AlertTriangle,
  ChevronDown,
  Check
} from 'lucide-react';
import { detectHsnSacCode } from '../utils/hsnSacData';

interface Client {
  id: string;
  name: string;
  company_name: string | null;
}

interface InvoiceItemInput {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  item_type?: 'product' | 'service' | 'package' | 'custom';
  sku_hsn?: string;
  tax_rate?: number;
  discount_rate?: number;
  catalog_item_id?: string | null;
}

interface CatalogItem {
  id: string;
  name: string;
  type: 'product' | 'service';
  sku: string | null;
  hsn_sac: string | null;
  description: string | null;
  unit_price: number;
  tax_rate: number;
  unit: string;
  track_inventory: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string | null;
}

interface PackageData {
  id: string;
  name: string;
  code: string;
  description: string | null;
  package_type: string;
  original_price: number;
  package_price: number;
  discount_rate: number;
  tax_mode: string;
  custom_tax_rate: number;
  items: Array<{
    catalog_item_id?: string | null;
    item_type: 'product' | 'service';
    name: string;
    description?: string;
    sku_hsn?: string;
    hsn_sac?: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    discount_rate: number;
  }>;
}

type TaxMode = 'item_level' | 'cgst_sgst' | 'igst' | 'flat' | 'none';

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

  // Catalog & Packages for fast-add & autocomplete
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [fastAddModalOpen, setFastAddModalOpen] = useState(false);
  const [fastAddSearch, setFastAddSearch] = useState('');
  const [fastAddTab, setFastAddTab] = useState<'all' | 'products' | 'services' | 'packages'>('all');

  // Autocomplete suggestion active row index
  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null);

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
    { description: '', quantity: 1, unit_price: 0, item_type: 'custom', tax_rate: 18, discount_rate: 0 }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients, catalog, and invoice details (if editing)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [clientList, catItems, catPkgs] = await Promise.all([
          apiFetch('/api/clients'),
          apiFetch('/api/catalog/items').catch(() => []),
          apiFetch('/api/catalog/packages').catch(() => [])
        ]);

        setClients(clientList || []);
        setCatalogItems(catItems || []);
        setCatalogPackages(catPkgs || []);

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

          if (invoice.tax_calculation_type === 'item_level') {
            setTaxMode('item_level');
          } else if (cgst > 0 || sgst > 0) {
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
            id: it.id,
            description: it.description,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            item_type: it.item_type || 'custom',
            sku_hsn: it.sku_hsn || '',
            tax_rate: it.tax_rate !== undefined ? Number(it.tax_rate) : 18,
            discount_rate: it.discount_rate !== undefined ? Number(it.discount_rate) : 0,
            catalog_item_id: it.catalog_item_id || null
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
    setItems([
      ...items,
      { description: '', quantity: 1, unit_price: 0, item_type: 'custom', tax_rate: 18, discount_rate: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemInput, val: any) => {
    const updated = [...items];
    if (field === 'description' || field === 'sku_hsn' || field === 'item_type' || field === 'catalog_item_id') {
      (updated[index] as any)[field] = val;
      // Auto-detect HSN/SAC code when description changes and sku_hsn is empty
      if (field === 'description' && !updated[index].sku_hsn && val && val.length > 2) {
        const detected = detectHsnSacCode(val, updated[index].item_type || 'service');
        if (detected) {
          updated[index].sku_hsn = detected.code;
        }
      }
    } else {
      (updated[index] as any)[field] = Number(val);
    }
    setItems(updated);
  };

  // Quick select catalog item into a line item row
  const applyCatalogItemToRow = (rowIndex: number, catItem: CatalogItem) => {
    const updated = [...items];
    updated[rowIndex] = {
      ...updated[rowIndex],
      description: catItem.name + (catItem.description ? ` - ${catItem.description}` : ''),
      unit_price: Number(catItem.unit_price) || 0,
      item_type: catItem.type,
      sku_hsn: catItem.hsn_sac || catItem.sku || '',
      tax_rate: Number(catItem.tax_rate) || 18,
      catalog_item_id: catItem.id
    };
    setItems(updated);
    setActiveSuggestionRow(null);
  };

  // Fast add product or service as a new line item
  const handleFastAddCatalogItem = (catItem: CatalogItem) => {
    // If the first row is empty, overwrite it, otherwise append
    if (items.length === 1 && !items[0].description && items[0].unit_price === 0) {
      applyCatalogItemToRow(0, catItem);
    } else {
      setItems([
        ...items,
        {
          description: catItem.name + (catItem.description ? ` - ${catItem.description}` : ''),
          quantity: 1,
          unit_price: Number(catItem.unit_price) || 0,
          item_type: catItem.type,
          sku_hsn: catItem.hsn_sac || catItem.sku || '',
          tax_rate: Number(catItem.tax_rate) || 18,
          discount_rate: 0,
          catalog_item_id: catItem.id
        }
      ]);
    }
  };

  // Fast add package: as 1 bundled line item
  const handleFastAddPackageSingle = (pkg: PackageData) => {
    const desc = pkg.name + (pkg.description ? ` (${pkg.description})` : '');
    const newRow: InvoiceItemInput = {
      description: desc,
      quantity: 1,
      unit_price: Number(pkg.package_price) || 0,
      item_type: 'package',
      sku_hsn: pkg.code || '',
      tax_rate: pkg.tax_mode === 'flat' ? Number(pkg.custom_tax_rate || 18) : 18,
      discount_rate: 0,
      catalog_item_id: null
    };

    if (items.length === 1 && !items[0].description && items[0].unit_price === 0) {
      setItems([newRow]);
    } else {
      setItems([...items, newRow]);
    }
  };

  // Fast add package: expand all individual items with bundle discount applied
  const handleFastAddPackageExpanded = (pkg: PackageData) => {
    if (!pkg.items || pkg.items.length === 0) return;
    const discountMultiplier = Number(pkg.discount_rate || 0) > 0 ? (1 - Number(pkg.discount_rate) / 100) : 1;

    const newRows: InvoiceItemInput[] = pkg.items.map(it => {
      const discountedUnit = Number(it.unit_price) * discountMultiplier;
      const desc = it.name + (it.description ? ` - ${it.description}` : '');
      // Preserve sku_hsn from package item, or auto-detect from description
      let hsnCode = it.sku_hsn || '';
      if (!hsnCode && desc.length > 2) {
        const detected = detectHsnSacCode(desc, it.item_type || 'service');
        if (detected) hsnCode = detected.code;
      }
      return {
        description: desc,
        quantity: Number(it.quantity) || 1,
        unit_price: Math.round(discountedUnit * 100) / 100,
        item_type: it.item_type,
        sku_hsn: hsnCode,
        tax_rate: Number(it.tax_rate) || 18,
        discount_rate: 0,
        catalog_item_id: it.catalog_item_id || null
      };
    });

    if (items.length === 1 && !items[0].description && items[0].unit_price === 0) {
      setItems(newRows);
    } else {
      setItems([...items, ...newRows]);
    }
  };

  // Preset GST selection
  const applyGstPreset = (rate: number) => {
    const half = rate / 2;
    setCgstRate(half);
    setSgstRate(half);
    setIgstRate(rate);
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.unit_price) || 0)), 0);
  const discountAmount = Number(discount || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Per-slab GST computation
  interface SlabSummary {
    rate: number;
    taxable: number;
    taxAmount: number;
  }
  const slabMap = new Map<number, number>();

  items.forEach(it => {
    const lineTotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    const lineRate = Number(it.tax_rate) || 0;
    const curr = slabMap.get(lineRate) || 0;
    slabMap.set(lineRate, curr + lineTotal);
  });

  const slabs: SlabSummary[] = Array.from(slabMap.entries()).map(([rate, amt]) => ({
    rate,
    taxable: amt,
    taxAmount: (amt * rate) / 100
  })).sort((a, b) => a.rate - b.rate);

  let cgstCalc = 0;
  let sgstCalc = 0;
  let igstCalc = 0;
  let flatTaxCalc = 0;
  let itemLevelTaxCalc = 0;
  let totalTax = 0;

  if (taxMode === 'item_level') {
    itemLevelTaxCalc = slabs.reduce((acc, s) => acc + s.taxAmount, 0);
    totalTax = itemLevelTaxCalc;
  } else if (taxMode === 'cgst_sgst') {
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
      taxCalculationType: taxMode === 'item_level' ? 'item_level' : 'invoice_level',
      taxRate: taxMode === 'flat' ? flatTaxRate : 0,
      cgstRate: taxMode === 'cgst_sgst' ? cgstRate : 0,
      sgstRate: taxMode === 'cgst_sgst' ? sgstRate : 0,
      igstRate: taxMode === 'igst' ? igstRate : 0,
      discount,
      currency,
      notes,
      termsConditions,
      thanksMessage,
      items: items.map(it => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        item_type: it.item_type || 'custom',
        sku_hsn: it.sku_hsn || null,
        tax_rate: Number(it.tax_rate || 0),
        discount_rate: Number(it.discount_rate || 0),
        catalog_item_id: it.catalog_item_id || null
      })),
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

  // Fast add filter results
  const filteredCatalogItems = catalogItems.filter(it => {
    if (fastAddTab === 'products' && it.type !== 'product') return false;
    if (fastAddTab === 'services' && it.type !== 'service') return false;
    if (fastAddSearch.trim()) {
      const q = fastAddSearch.toLowerCase();
      return it.name.toLowerCase().includes(q) || it.sku?.toLowerCase().includes(q) || it.hsn_sac?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredCatalogPackages = catalogPackages.filter(pkg => {
    if (fastAddTab === 'products' || fastAddTab === 'services') return false;
    if (fastAddSearch.trim()) {
      const q = fastAddSearch.toLowerCase();
      return pkg.name.toLowerCase().includes(q) || pkg.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => navigate('/invoices')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-gradient">
              {isEditMode ? `Edit Invoice: ${invoiceNumber}` : 'Create Tax Invoice'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Add products, services, packages, configure differential GST rates, discounts, and custom greetings.
            </p>
          </div>
        </div>

        {/* Fast Add Catalog Button */}
        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)' }}
          onClick={() => {
            setFastAddSearch('');
            setFastAddTab('all');
            setFastAddModalOpen(true);
          }}
        >
          <Sparkles size={16} />
          <span>⚡ Fast Add from Catalog &amp; Packages</span>
        </button>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Boxes size={18} style={{ color: 'var(--primary)' }} />
              <span>Line Items (Products, Services &amp; Packages)</span>
            </h4>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setFastAddModalOpen(true)}
            >
              <Sparkles size={13} />
              <span>Browse Catalog</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, idx) => {
              const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    position: 'relative'
                  }}
                >
                  {/* Top row: Description + Autocomplete Search + Type badge */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        required
                        placeholder="Service / Product Description (or type to search catalog...)"
                        className="form-input"
                        value={item.description}
                        onChange={(e) => {
                          handleItemChange(idx, 'description', e.target.value);
                          setActiveSuggestionRow(idx);
                        }}
                        onFocus={() => setActiveSuggestionRow(idx)}
                      />

                      {/* Autocomplete Dropdown suggestions */}
                      {activeSuggestionRow === idx && item.description.trim().length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            maxHeight: '220px',
                            overflowY: 'auto',
                            marginTop: '4px'
                          }}
                        >
                          <div style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', background: 'var(--bg-tertiary)' }}>
                            Matching Catalog Items &amp; Packages:
                          </div>

                          {catalogItems
                            .filter(cat => cat.name.toLowerCase().includes(item.description.toLowerCase()) || cat.sku?.toLowerCase().includes(item.description.toLowerCase()))
                            .slice(0, 5)
                            .map(cat => (
                              <div
                                key={cat.id}
                                onClick={() => applyCatalogItemToRow(idx, cat)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.82rem',
                                  borderBottom: '1px solid var(--border-color)'
                                }}
                                className="suggestion-item"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: cat.type === 'product' ? '#818cf8' : '#34d399', fontWeight: 700, fontSize: '0.7rem' }}>
                                    [{cat.type === 'product' ? 'PRODUCT' : 'SERVICE'}]
                                  </span>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                                </div>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{currency} {cat.unit_price}</span>
                              </div>
                            ))}

                          {catalogPackages
                            .filter(pkg => pkg.name.toLowerCase().includes(item.description.toLowerCase()) || pkg.code.toLowerCase().includes(item.description.toLowerCase()))
                            .slice(0, 3)
                            .map(pkg => (
                              <div
                                key={pkg.id}
                                onClick={() => {
                                  handleFastAddPackageSingle(pkg);
                                  setActiveSuggestionRow(null);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.82rem',
                                  background: 'rgba(236, 72, 153, 0.05)'
                                }}
                                className="suggestion-item"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: '#ec4899', fontWeight: 700, fontSize: '0.7rem' }}>[PACKAGE]</span>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pkg.name}</span>
                                </div>
                                <span style={{ color: '#ec4899', fontWeight: 700 }}>{currency} {pkg.package_price}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div style={{ width: '130px' }}>
                      <input
                        type="text"
                        placeholder="HSN / SAC"
                        className="form-input"
                        style={{ fontSize: '0.82rem' }}
                        value={item.sku_hsn || ''}
                        onChange={(e) => handleItemChange(idx, 'sku_hsn', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bottom row: Qty, Unit Price, Tax %, Total, Delete */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '90px' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quantity</label>
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

                    <div style={{ width: '130px' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unit Price ({currency})</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="Unit Price"
                        className="form-input"
                        value={item.unit_price !== undefined ? item.unit_price : ''}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      />
                    </div>

                    {taxMode === 'item_level' && (
                      <div style={{ width: '110px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Item GST %</label>
                        <select
                          className="form-input"
                          value={item.tax_rate !== undefined ? item.tax_rate : 18}
                          onChange={(e) => handleItemChange(idx, 'tax_rate', Number(e.target.value))}
                          style={{ background: 'var(--bg-tertiary)', fontSize: '0.82rem' }}
                        >
                          <option value="0">0% (Exempt)</option>
                          <option value="5">5% GST</option>
                          <option value="12">12% GST</option>
                          <option value="18">18% GST</option>
                          <option value="28">28% GST</option>
                        </select>
                      </div>
                    )}

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Line Total</label>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {currency} {lineTotal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '10px', marginTop: '16px', flexShrink: 0 }}
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '16px', padding: '8px 14px', fontSize: '0.8rem' }}
            onClick={handleAddItem}
          >
            <Plus size={14} />
            <span>+ Add Blank Row</span>
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

        {/* GST & Tax Configuration Section */}
        <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
              <ReceiptText size={18} />
              <span>GST &amp; Tax Calculation Mode</span>
            </div>

            {/* Quick Slabs Presets (when in invoice GST mode) */}
            {taxMode !== 'item_level' && (
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
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tax Calculation Mode</label>
              <select
                className="form-input"
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as TaxMode)}
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
              >
                <option value="item_level">🌟 Per-Item Differential GST Rates (Recommended for Hybrid)</option>
                <option value="cgst_sgst">Dual GST (CGST + SGST - Intra-state Global)</option>
                <option value="igst">Integrated GST (IGST - Inter-state Global)</option>
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

          {/* Differential GST Slabs Breakdown Table */}
          {taxMode === 'item_level' && (
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Item-Wise GST Slabs Breakdown:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {slabs.map(s => (
                  <div key={s.rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <span>{s.rate}% GST Slab (Taxable: {currency} {s.taxable.toFixed(2)})</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>+{currency} {s.taxAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel (Notes, Terms, Thanks Message & Calculations) */}
        <div className="form-grid-2" style={{ gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Custom Terms &amp; Conditions</label>
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
              <label className="form-label">Thanks &amp; Business Greeting Message</label>
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

            {taxMode === 'item_level' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Total Item-wise GST:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>+{currency} {itemLevelTaxCalc.toFixed(2)}</span>
              </div>
            )}

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

      {/* --- FAST ADD MODAL: BROWSE CATALOG & PACKAGES --- */}
      {fastAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '820px', width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#ffffff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Fast Add to Invoice</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pick products, services, or bundle packages to instantly add them to this invoice.
                  </p>
                </div>
              </div>

              <button onClick={() => setFastAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFastAddTab('all')}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: fastAddTab === 'all' ? 'var(--primary)' : 'transparent',
                    color: fastAddTab === 'all' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setFastAddTab('products')}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: fastAddTab === 'products' ? 'var(--primary)' : 'transparent',
                    color: fastAddTab === 'products' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Package size={13} />
                  <span>Products</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFastAddTab('services')}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: fastAddTab === 'services' ? 'var(--primary)' : 'transparent',
                    color: fastAddTab === 'services' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Wrench size={13} />
                  <span>Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFastAddTab('packages')}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: fastAddTab === 'packages' ? 'var(--primary)' : 'transparent',
                    color: fastAddTab === 'packages' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Layers size={13} />
                  <span>Packages</span>
                </button>
              </div>

              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
                  value={fastAddSearch}
                  onChange={(e) => setFastAddSearch(e.target.value)}
                />
              </div>
            </div>

            {/* List of items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              
              {/* Products & Services Items */}
              {filteredCatalogItems.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: cat.type === 'product' ? '#818cf8' : '#34d399' }}>
                      {cat.type === 'product' ? <Package size={18} /> : <Wrench size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{cat.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {cat.sku && `SKU: ${cat.sku} • `}
                        {cat.hsn_sac && `HSN/SAC: ${cat.hsn_sac} • `}
                        {Number(cat.tax_rate || 0)}% GST
                        {cat.type === 'product' && cat.track_inventory === 1 && (
                          <span style={{ marginLeft: '6px', color: cat.stock_quantity <= cat.low_stock_threshold ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                            ({cat.stock_quantity} in stock)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      {currency} {Number(cat.unit_price).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => {
                        handleFastAddCatalogItem(cat);
                        setFastAddModalOpen(false);
                      }}
                    >
                      <Plus size={13} />
                      <span>Add to Invoice</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Packages List */}
              {filteredCatalogPackages.map(pkg => (
                <div
                  key={pkg.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: 'rgba(236, 72, 153, 0.04)',
                    borderRadius: '10px',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#ec4899' }}>
                      <Layers size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{pkg.name}</span>
                        <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{pkg.code}</span>
                        {Number(pkg.discount_rate || 0) > 0 && (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>{Number(pkg.discount_rate)}% OFF</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Bundles {pkg.items?.length || 0} items: {pkg.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      {Number(pkg.discount_rate || 0) > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {currency} {Number(pkg.original_price).toFixed(2)}
                        </div>
                      )}
                      <div style={{ fontWeight: 800, color: '#ec4899', fontSize: '1rem' }}>
                        {currency} {Number(pkg.package_price).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        title="Adds as 1 single combo line item"
                        onClick={() => {
                          handleFastAddPackageSingle(pkg);
                          setFastAddModalOpen(false);
                        }}
                      >
                        Add as Bundle Line
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        title="Splits bundle into individual discounted products & services"
                        onClick={() => {
                          handleFastAddPackageExpanded(pkg);
                          setFastAddModalOpen(false);
                        }}
                      >
                        Expand All Items
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCatalogItems.length === 0 && filteredCatalogPackages.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No products, services, or packages matched your search.
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceEdit;
