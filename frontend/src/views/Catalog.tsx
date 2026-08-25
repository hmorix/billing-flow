import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Wrench,
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Edit2,
  Trash2,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  X,
  Sliders,
  Tag,
  ShieldCheck,
  Percent,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface CatalogItem {
  id: string;
  name: string;
  type: 'product' | 'service';
  sku: string | null;
  hsn_sac: string | null;
  description: string | null;
  unit_price: number;
  cost_price: number;
  tax_rate: number;
  unit: string;
  track_inventory: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string | null;
  status: string;
  created_at: string;
}

interface PackageItemInput {
  id?: string;
  catalog_item_id?: string | null;
  item_type: 'product' | 'service';
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
}

interface PackageData {
  id: string;
  name: string;
  code: string;
  description: string | null;
  package_type: 'product' | 'service' | 'hybrid';
  original_price: number;
  package_price: number;
  discount_rate: number;
  discount_type: 'percentage' | 'fixed';
  tax_mode: 'item_wise' | 'flat';
  custom_tax_rate: number;
  status: string;
  created_at: string;
  items: PackageItemInput[];
}

interface InventoryLog {
  id: string;
  catalog_item_id: string;
  item_name: string;
  item_sku: string | null;
  item_type: string;
  item_unit: string;
  change_type: 'sale' | 'restock' | 'adjustment' | 'return';
  quantity_change: number;
  quantity_after: number;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

interface CatalogStats {
  totalProducts: number;
  totalServices: number;
  totalPackages: number;
  lowStockCount: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  totalCostValue: number;
}

export const Catalog: React.FC = () => {
  const { apiFetch, organization } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'packages' | 'logs'>('products');

  // Data States
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalType, setItemModalType] = useState<'product' | 'service'>('product');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);

  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<CatalogItem | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockCost, setRestockCost] = useState<number | string>('');
  const [restockNotes, setRestockNotes] = useState('');

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemHsnSac, setItemHsnSac] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState<number | string>('');
  const [itemCostPrice, setItemCostPrice] = useState<number | string>('');
  const [itemTaxRate, setItemTaxRate] = useState<number>(18);
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemTrackInv, setItemTrackInv] = useState(true);
  const [itemStock, setItemStock] = useState<number | string>(0);
  const [itemLowThreshold, setItemLowThreshold] = useState<number | string>(5);
  const [itemCategory, setItemCategory] = useState('');

  // Package Form State
  const [pkgName, setPkgName] = useState('');
  const [pkgCode, setPkgCode] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgType, setPkgType] = useState<'hybrid' | 'service' | 'product'>('hybrid');
  const [pkgPrice, setPkgPrice] = useState<number | string>('');
  const [pkgDiscountRate, setPkgDiscountRate] = useState<number | string>('');
  const [pkgTaxMode, setPkgTaxMode] = useState<'item_wise' | 'flat'>('item_wise');
  const [pkgCustomTaxRate, setPkgCustomTaxRate] = useState<number | string>(18);
  const [pkgItems, setPkgItems] = useState<PackageItemInput[]>([]);

  // Load all catalog data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsData, pkgsData, logsData, statsData] = await Promise.all([
        apiFetch('/api/catalog/items'),
        apiFetch('/api/catalog/packages'),
        apiFetch('/api/catalog/inventory-logs'),
        apiFetch('/api/catalog/stats')
      ]);

      setItems(itemsData || []);
      setPackages(pkgsData || []);
      setLogs(logsData || []);
      setStats(statsData || null);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter items
  const filteredItems = items.filter(item => {
    if (activeTab === 'products' && item.type !== 'product') return false;
    if (activeTab === 'services' && item.type !== 'service') return false;

    if (filterLowStock && item.type === 'product' && (!item.track_inventory || item.stock_quantity > item.low_stock_threshold)) {
      return false;
    }

    if (filterCategory !== 'all' && item.category !== filterCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku?.toLowerCase().includes(q);
      const matchHsn = item.hsn_sac?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchHsn && !matchDesc) return false;
    }

    return true;
  });

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];

  // Open item modal for add
  const handleOpenAddItem = (type: 'product' | 'service') => {
    setEditingItem(null);
    setItemModalType(type);
    setItemName('');
    setItemSku('');
    setItemHsnSac(type === 'service' ? 'SAC9983' : '');
    setItemDesc('');
    setItemUnitPrice('');
    setItemCostPrice('');
    setItemTaxRate(18);
    setItemUnit(type === 'product' ? 'pcs' : 'hr');
    setItemTrackInv(type === 'product');
    setItemStock(type === 'product' ? 0 : 0);
    setItemLowThreshold(5);
    setItemCategory('');
    setItemModalOpen(true);
  };

  // Open item modal for edit
  const handleOpenEditItem = (item: CatalogItem) => {
    setEditingItem(item);
    setItemModalType(item.type);
    setItemName(item.name);
    setItemSku(item.sku || '');
    setItemHsnSac(item.hsn_sac || '');
    setItemDesc(item.description || '');
    setItemUnitPrice(item.unit_price);
    setItemCostPrice(item.cost_price || '');
    setItemTaxRate(Number(item.tax_rate || 0));
    setItemUnit(item.unit || (item.type === 'product' ? 'pcs' : 'hr'));
    setItemTrackInv(Boolean(item.track_inventory));
    setItemStock(item.stock_quantity);
    setItemLowThreshold(item.low_stock_threshold);
    setItemCategory(item.category || '');
    setItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const payload = {
      name: itemName.trim(),
      type: itemModalType,
      sku: itemSku.trim() || undefined,
      hsnSac: itemHsnSac.trim() || undefined,
      description: itemDesc.trim() || undefined,
      unitPrice: Number(itemUnitPrice) || 0,
      costPrice: Number(itemCostPrice) || 0,
      taxRate: Number(itemTaxRate) || 0,
      unit: itemUnit.trim(),
      trackInventory: itemModalType === 'product' ? itemTrackInv : false,
      stockQuantity: Number(itemStock) || 0,
      lowStockThreshold: Number(itemLowThreshold) || 5,
      category: itemCategory.trim() || undefined
    };

    try {
      if (editingItem) {
        await apiFetch(`/api/catalog/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/catalog/items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save catalog item.');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete / archive "${name}"?`)) return;
    try {
      await apiFetch(`/api/catalog/items/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  // Restock Submit
  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    try {
      await apiFetch(`/api/catalog/items/${restockItem.id}/stock`, {
        method: 'POST',
        body: JSON.stringify({
          changeType: 'restock',
          quantityChange: Number(restockQty) || 0,
          costPrice: restockCost ? Number(restockCost) : undefined,
          notes: restockNotes.trim() || undefined
        })
      });
      setRestockModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to restock item.');
    }
  };

  // Package builder helper
  const handleOpenAddPackage = () => {
    setEditingPackage(null);
    setPkgName('');
    setPkgCode('');
    setPkgDesc('');
    setPkgType('hybrid');
    setPkgPrice('');
    setPkgDiscountRate(0);
    setPkgTaxMode('item_wise');
    setPkgCustomTaxRate(18);
    setPkgItems([]);
    setPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: PackageData) => {
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgCode(pkg.code);
    setPkgDesc(pkg.description || '');
    setPkgType(pkg.package_type);
    setPkgPrice(pkg.package_price);
    setPkgDiscountRate(pkg.discount_rate || 0);
    setPkgTaxMode(pkg.tax_mode || 'item_wise');
    setPkgCustomTaxRate(pkg.custom_tax_rate || 18);
    setPkgItems(pkg.items || []);
    setPackageModalOpen(true);
  };

  const handleAddBundledItem = (catItem: CatalogItem) => {
    setPkgItems([
      ...pkgItems,
      {
        catalog_item_id: catItem.id,
        item_type: catItem.type,
        name: catItem.name,
        description: catItem.description || '',
        quantity: 1,
        unit_price: catItem.unit_price,
        tax_rate: catItem.tax_rate,
        discount_rate: 0
      }
    ]);
  };

  const handleRemoveBundledItem = (index: number) => {
    setPkgItems(pkgItems.filter((_, i) => i !== index));
  };

  const handleUpdateBundledItem = (index: number, field: keyof PackageItemInput, val: any) => {
    const updated = [...pkgItems];
    updated[index] = { ...updated[index], [field]: val };
    setPkgItems(updated);
  };

  // Calculated bundle total
  const bundleOriginalSum = pkgItems.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);

  // Auto calculate discount % if package price is entered, or vice versa
  const handlePackagePriceChange = (val: string) => {
    setPkgPrice(val);
    const num = Number(val);
    if (bundleOriginalSum > 0 && num >= 0) {
      const disc = Math.max(0, ((bundleOriginalSum - num) / bundleOriginalSum) * 100);
      setPkgDiscountRate(Math.round(disc * 10) / 10);
    }
  };

  const handlePackageDiscountChange = (val: string) => {
    setPkgDiscountRate(val);
    const disc = Number(val);
    if (bundleOriginalSum > 0 && disc >= 0) {
      const discountedPrice = Math.max(0, bundleOriginalSum * (1 - disc / 100));
      setPkgPrice(Math.round(discountedPrice * 100) / 100);
    }
  };

  // Save Package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim() || pkgItems.length === 0) {
      alert('Package name and at least one bundled product/service are required.');
      return;
    }

    const payload = {
      name: pkgName.trim(),
      code: pkgCode.trim() || undefined,
      description: pkgDesc.trim() || undefined,
      packageType: pkgType,
      originalPrice: bundleOriginalSum,
      packagePrice: Number(pkgPrice) || bundleOriginalSum,
      discountRate: Number(pkgDiscountRate) || 0,
      discountType: 'percentage',
      taxMode: pkgTaxMode,
      customTaxRate: Number(pkgCustomTaxRate) || 0,
      items: pkgItems.map(it => ({
        catalogItemId: it.catalog_item_id,
        itemType: it.item_type,
        name: it.name,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unit_price) || 0,
        taxRate: Number(it.tax_rate) || 0,
        discountRate: Number(it.discount_rate) || 0
      }))
    };

    try {
      if (editingPackage) {
        await apiFetch(`/api/catalog/packages/${editingPackage.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/catalog/packages', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setPackageModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save package.');
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete package "${name}"?`)) return;
    try {
      await apiFetch(`/api/catalog/packages/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete package.');
    }
  };

  const currency = 'INR';

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#ffffff', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }} className="text-gradient">
                Inventory &amp; Catalog Management
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Products, billable services, custom packages, inventory tracking, and GST tax management.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => handleOpenAddItem('product')}>
            <Package size={15} />
            <span>+ Product</span>
          </button>
          <button className="btn btn-secondary" onClick={() => handleOpenAddItem('service')}>
            <Wrench size={15} />
            <span>+ Service</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddPackage}>
            <Layers size={15} />
            <span>+ Create Package</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Products</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.totalProducts || 0}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{stats?.totalStockUnits || 0} units in stock</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Services</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.totalServices || 0}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Billable catalog offerings</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Packages &amp; Bundles</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.totalPackages || 0}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Combo &amp; discounted packs</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', border: (stats?.lowStockCount || 0) > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : undefined }}>
          <div style={{ background: (stats?.lowStockCount || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.12)', color: (stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-muted)', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Low Stock Alerts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-primary)' }}>
              {stats?.lowStockCount || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: (stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
              {(stats?.lowStockCount || 0) > 0 ? 'Requires immediate restock' : 'All stock levels healthy'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '4px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'products' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Package size={16} />
          <span>Products &amp; Stock</span>
          <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-tertiary)' }}>{items.filter(i => i.type === 'product').length}</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'services' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'services' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Wrench size={16} />
          <span>Services</span>
          <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-tertiary)' }}>{items.filter(i => i.type === 'service').length}</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'packages' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'packages' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={16} />
          <span>Packages &amp; Bundles</span>
          <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-tertiary)' }}>{packages.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'logs' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'logs' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sliders size={16} />
          <span>Stock Movement Logs</span>
        </button>
      </div>

      {/* Products & Services Tabs Content */}
      {(activeTab === 'products' || activeTab === 'services') && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Controls & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'products' ? 'products, SKU, HSN...' : 'services, SAC codes...'}`}
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {categories.length > 0 && (
                <select
                  className="form-input"
                  style={{ width: 'auto', background: 'var(--bg-tertiary)' }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {activeTab === 'products' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e) => setFilterLowStock(e.target.checked)}
                />
                <span>Show Low Stock Only</span>
              </label>
            )}
          </div>

          {/* Items Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Item Name</th>
                  <th style={{ padding: '12px 14px' }}>SKU / HSN-SAC</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Selling Price</th>
                  {activeTab === 'products' && <th style={{ padding: '12px 14px', textAlign: 'right' }}>Cost Price</th>}
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>GST Rate</th>
                  {activeTab === 'products' && <th style={{ padding: '12px 14px', textAlign: 'center' }}>Stock Status</th>}
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No {activeTab} found. Click "+ {activeTab === 'products' ? 'Product' : 'Service'}" to add your first item.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isLow = item.type === 'product' && item.track_inventory === 1 && item.stock_quantity <= item.low_stock_threshold;
                    const isOutOfStock = item.type === 'product' && item.track_inventory === 1 && item.stock_quantity <= 0;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.name}</div>
                          {item.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {item.sku && <div>SKU: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.sku}</span></div>}
                          {item.hsn_sac && <div>HSN: <span style={{ color: '#818cf8' }}>{item.hsn_sac}</span></div>}
                          {!item.sku && !item.hsn_sac && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                        </td>
                        <td style={{ padding: '14px', fontSize: '0.82rem' }}>
                          {item.category ? (
                            <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{item.category}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>General</span>
                          )}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {currency} {Number(item.unit_price).toFixed(2)}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}> /{item.unit}</span>
                        </td>
                        {activeTab === 'products' && (
                          <td style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {item.cost_price ? `${currency} ${Number(item.cost_price).toFixed(2)}` : '-'}
                          </td>
                        )}
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontWeight: 700 }}>
                            {Number(item.tax_rate || 0)}% GST
                          </span>
                        </td>
                        {activeTab === 'products' && (
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            {item.track_inventory === 1 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <span
                                  className={`badge ${isOutOfStock ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}
                                  style={{ fontWeight: 700 }}
                                >
                                  {item.stock_quantity} {item.unit}
                                </span>
                                {isLow && <span style={{ fontSize: '0.68rem', color: '#ef4444' }}>Low stock alert</span>}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unlimited</span>
                            )}
                          </td>
                        )}
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {activeTab === 'products' && item.track_inventory === 1 && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                title="Restock Units"
                                onClick={() => {
                                  setRestockItem(item);
                                  setRestockQty(10);
                                  setRestockCost(item.cost_price || '');
                                  setRestockNotes('');
                                  setRestockModalOpen(true);
                                }}
                              >
                                <RefreshCw size={13} />
                                <span>Restock</span>
                              </button>
                            )}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px' }}
                              onClick={() => handleOpenEditItem(item)}
                              title="Edit item"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 8px' }}
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              title="Archive / Delete item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Packages Tab Content */}
      {activeTab === 'packages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {packages.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Layers size={44} style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>No Packages Created Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px' }}>
                Bundle multiple services and products together into lucrative package offers with special discount rates and automated tax calculation.
              </p>
              <button className="btn btn-primary" onClick={handleOpenAddPackage}>
                <Plus size={16} />
                <span>Create Your First Package</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {packages.map(pkg => {
                const totalSavings = Math.max(0, Number(pkg.original_price || 0) - Number(pkg.package_price || 0));

                return (
                  <div key={pkg.id} className="glass-card fade-in" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)' }}>
                    
                    {/* Top Row: Package Code & Type */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                        {pkg.code}
                      </span>
                      <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                        {pkg.package_type.toUpperCase()}
                      </span>
                    </div>

                    {/* Name & Desc */}
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                        {pkg.name}
                      </h4>
                      {pkg.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    {/* Bundled Items List */}
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Included Products &amp; Services ({pkg.items?.length || 0})
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {pkg.items?.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: it.item_type === 'product' ? '#818cf8' : '#34d399', fontWeight: 700, fontSize: '0.7rem' }}>
                                [{it.item_type === 'product' ? 'PROD' : 'SERV'}]
                              </span>
                              <span>{it.quantity}x {it.name}</span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>{currency} {(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price & Discount Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div>
                        {Number(pkg.discount_rate || 0) > 0 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {currency} {Number(pkg.original_price).toFixed(2)}
                          </div>
                        )}
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {currency} {Number(pkg.package_price).toFixed(2)}
                        </div>
                      </div>

                      {Number(pkg.discount_rate || 0) > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                            {Number(pkg.discount_rate)}% OFF
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>
                            Save {currency} {totalSavings.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleOpenEditPackage(pkg)}>
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                      <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeletePackage(pkg.id, pkg.name)}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Stock Movement Logs Tab */}
      {activeTab === 'logs' && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Inventory Stock Movement Audit Log</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Showing last 50 inventory transactions</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Date &amp; Time</th>
                  <th style={{ padding: '12px 14px' }}>Product</th>
                  <th style={{ padding: '12px 14px' }}>Movement Type</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Qty Change</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Stock After</th>
                  <th style={{ padding: '12px 14px' }}>Reference / Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No inventory movements logged yet. Stock deductions from sales and manual restocks will appear here.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const isPositive = log.quantity_change > 0;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{log.item_name}</div>
                          {log.item_sku && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SKU: {log.item_sku}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            className={`badge ${
                              log.change_type === 'restock' ? 'badge-success' :
                              log.change_type === 'sale' ? 'badge-info' :
                              log.change_type === 'adjustment' ? 'badge-warning' : 'badge-secondary'
                            }`}
                            style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}
                          >
                            {log.change_type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444', fontSize: '0.9rem' }}>
                          {isPositive ? `+${log.quantity_change}` : log.quantity_change}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {log.quantity_after} {log.item_unit || 'units'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {log.reference_id && <span style={{ fontWeight: 600, color: '#818cf8', marginRight: '6px' }}>[{log.reference_id}]</span>}
                          {log.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT PRODUCT OR SERVICE MODAL --- */}
      {itemModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }} className="text-gradient">
                {editingItem ? `Edit ${itemModalType === 'product' ? 'Product' : 'Service'}` : `Add New ${itemModalType === 'product' ? 'Product' : 'Service'}`}
              </h3>
              <button onClick={() => setItemModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Type Switch */}
              <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={() => setItemModalType('product')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    background: itemModalType === 'product' ? 'var(--primary)' : 'transparent',
                    color: itemModalType === 'product' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Package size={15} />
                  <span>Physical Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemModalType('service')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    background: itemModalType === 'service' ? 'var(--primary)' : 'transparent',
                    color: itemModalType === 'service' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Wrench size={15} />
                  <span>Billable Service</span>
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{itemModalType === 'product' ? 'Product Name' : 'Service Name'} *</label>
                <input
                  type="text"
                  required
                  placeholder={itemModalType === 'product' ? 'e.g. Wireless Mouse, Dell Monitor, Laptop...' : 'e.g. Website Development, Cloud Consulting, Annual Maintenance...'}
                  className="form-input"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div className="form-grid-2" style={{ gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{itemModalType === 'product' ? 'SKU Code' : 'Service Code'}</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-PROD-001"
                    className="form-input"
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{itemModalType === 'product' ? 'HSN Code' : 'SAC Code'}</label>
                  <input
                    type="text"
                    placeholder={itemModalType === 'product' ? 'e.g. HSN 8471' : 'e.g. SAC 998311'}
                    className="form-input"
                    value={itemHsnSac}
                    onChange={(e) => setItemHsnSac(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="0.00"
                    className="form-input"
                    value={itemUnitPrice}
                    onChange={(e) => setItemUnitPrice(e.target.value)}
                  />
                </div>

                {itemModalType === 'product' ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cost / Purchase Price ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="form-input"
                      value={itemCostPrice}
                      onChange={(e) => setItemCostPrice(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Billing Unit</label>
                    <select
                      className="form-input"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <option value="hr">Hour (hr)</option>
                      <option value="day">Day</option>
                      <option value="month">Month</option>
                      <option value="project">Project / Fixed</option>
                      <option value="session">Session</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                )}
              </div>

              {/* GST Rate Preset Selector */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Applicable GST / Tax Rate (%)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[0, 5, 12, 18, 28].map(slab => (
                    <button
                      key={slab}
                      type="button"
                      onClick={() => setItemTaxRate(slab)}
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: itemTaxRate === slab ? 'var(--primary)' : 'var(--bg-tertiary)',
                        color: itemTaxRate === slab ? '#ffffff' : 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {slab}%
                    </button>
                  ))}
                </div>
              </div>

              {itemModalType === 'product' && (
                <>
                  <div className="form-grid-2" style={{ gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Unit of Measure</label>
                      <select
                        className="form-input"
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        style={{ background: 'var(--bg-tertiary)' }}
                      >
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="units">Units</option>
                        <option value="box">Box</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="meter">Meter</option>
                        <option value="set">Set</option>
                        <option value="packet">Packet</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Hardware, Electronics..."
                        className="form-input"
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={itemTrackInv}
                        onChange={(e) => setItemTrackInv(e.target.checked)}
                      />
                      <span>Track Real-Time Inventory / Stock</span>
                    </label>

                    {itemTrackInv && (
                      <div className="form-grid-2" style={{ gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Current Stock Count</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            value={itemStock}
                            onChange={(e) => setItemStock(e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Low Stock Threshold Alert</label>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            value={itemLowThreshold}
                            onChange={(e) => setItemLowThreshold(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description / Features</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Optional item details to show in invoices..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setItemModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- QUICK RESTOCK MODAL --- */}
      {restockModalOpen && restockItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Restock Product</h3>
              </div>
              <button onClick={() => setRestockModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{restockItem.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current Stock: <span style={{ fontWeight: 700, color: '#818cf8' }}>{restockItem.stock_quantity} {restockItem.unit}</span></div>
            </div>

            <form onSubmit={handleSaveRestock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Units to Add *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-input"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cost Price per Unit ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Optional cost update"
                  className="form-input"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Supplier / Purchase Note</label>
                <input
                  type="text"
                  placeholder="e.g. PO #1029 from Supplier XYZ"
                  className="form-input"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRestockModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Restock (+{restockQty})
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- CREATE / EDIT PACKAGE & BUNDLE MODAL --- */}
      {packageModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)', color: '#ffffff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }} className="text-gradient">
                    {editingPackage ? 'Edit Package / Bundle' : 'Create Package / Bundle'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Bundle products and services into an enticing combo offer with discounted rates.
                  </p>
                </div>
              </div>
              <button onClick={() => setPackageModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="form-grid-2" style={{ gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Package Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ultimate E-Commerce Pack, Starter Hardware + Support..."
                    className="form-input"
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Package Code / SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. PKG-001 (Auto-generated if empty)"
                    className="form-input"
                    value={pkgCode}
                    onChange={(e) => setPkgCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Package Description</label>
                <input
                  type="text"
                  placeholder="Summary of what is included in this bundle..."
                  className="form-input"
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                />
              </div>

              {/* Bundled Items Section */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Bundled Products &amp; Services ({pkgItems.length})
                  </span>

                  {/* Dropdown Quick Picker */}
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '0.8rem', background: 'var(--bg-tertiary)' }}
                    onChange={(e) => {
                      const selected = items.find(it => it.id === e.target.value);
                      if (selected) {
                        handleAddBundledItem(selected);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ Add Item from Catalog...</option>
                    <optgroup label="📦 Products">
                      {items.filter(it => it.type === 'product').map(it => (
                        <option key={it.id} value={it.id}>{it.name} ({currency} {it.unit_price})</option>
                      ))}
                    </optgroup>
                    <optgroup label="🛠️ Services">
                      {items.filter(it => it.type === 'service').map(it => (
                        <option key={it.id} value={it.id}>{it.name} ({currency} {it.unit_price})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {pkgItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No items added yet. Use the dropdown above to add products and services to this package.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pkgItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 70px 100px 70px 36px', gap: '8px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.name}</div>
                          <span style={{ fontSize: '0.68rem', color: item.item_type === 'product' ? '#818cf8' : '#34d399' }}>
                            {item.item_type === 'product' ? 'Product' : 'Service'}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: '0.82rem', textAlign: 'center' }}
                          value={item.quantity}
                          onChange={(e) => handleUpdateBundledItem(idx, 'quantity', Number(e.target.value))}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: '0.82rem', textAlign: 'right' }}
                          value={item.unit_price}
                          onChange={(e) => handleUpdateBundledItem(idx, 'unit_price', Number(e.target.value))}
                        />
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'right', color: 'var(--text-primary)' }}>
                          {currency} {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '6px' }}
                          onClick={() => handleRemoveBundledItem(idx)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Package Pricing & Bundle Discount Calculator */}
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '12px' }}>
                  <Percent size={16} />
                  <span>Package Pricing &amp; Bundle Discount Offer</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Original Items Total:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {currency} {bundleOriginalSum.toFixed(2)}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Package Offer Price ({currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      className="form-input"
                      value={pkgPrice}
                      onChange={(e) => handlePackagePriceChange(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Bundle Discount (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.0%"
                      className="form-input"
                      value={pkgDiscountRate}
                      onChange={(e) => handlePackageDiscountChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPackageModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPackage ? 'Save Package' : 'Create & Publish Package'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Catalog;
