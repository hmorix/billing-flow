import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Wrench,
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  Layers,
  X,
  Sparkles,
  Copy,
  Check,
  LayoutGrid,
  List,
  BarChart3,
  Clock,
  Download,
  Upload,
  Zap,
  HardDrive,
  Database,
  CheckCircle2,
  Globe,
  FileCode,
  FileDown
} from 'lucide-react';
import {
  detectHsnSacCode,
  searchHsnSacCodes,
  generateSku,
  calculateProfitStats,
  type HsnSacEntry
} from '../utils/hsnSacData';
import {
  PRESET_PACKAGES,
  PRESET_CATALOG_ITEMS,
  type PresetPackage,
  type PresetCatalogItem,
  downloadJsonFile,
  validateAndParsePackageJson
} from '../utils/packageTemplates';
import { browserCache } from '../utils/browserCache';
import { TableSkeleton } from '../components/skeletons/TableSkeleton';


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
  created_at?: string;
  items: PackageItemInput[];
  is_local_only?: boolean;
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
  const orgId = organization?.id || 'global';

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'packages' | 'logs'>('products');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Fast Browser Cache Synchronous Hydration
  const cachedItems = browserCache.get<CatalogItem[]>('/api/catalog/items', orgId);
  const cachedPkgs = browserCache.get<PackageData[]>('/api/catalog/packages', orgId);
  const localPkgs = browserCache.getLocalPackages<PackageData>(orgId);
  const cachedStats = browserCache.get<CatalogStats>('/api/catalog/stats', orgId);

  // Data States
  const [items, setItems] = useState<CatalogItem[]>(cachedItems?.data || []);
  const [packages, setPackages] = useState<PackageData[]>(() => {
    const combined = [...(cachedPkgs?.data || [])];
    localPkgs.forEach(lp => {
      if (!combined.some(p => p.id === lp.id || p.code === lp.code)) {
        combined.push({ ...lp, is_local_only: true });
      }
    });
    return combined;
  });
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(cachedStats?.data || null);
  const [isLoading, setIsLoading] = useState(!cachedItems?.data && !cachedPkgs?.data);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters, Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLogType, setFilterLogType] = useState('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name_asc');

  // Selection for bulk actions
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalType, setItemModalType] = useState<'product' | 'service'>('product');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // GST HSN/SAC Browser Modal
  const [hsnBrowserOpen, setHsnBrowserOpen] = useState(false);
  const [hsnSearchQuery, setHsnSearchQuery] = useState('');

  // Package Modal State
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [packageSaveLocation, setPackageSaveLocation] = useState<'both' | 'local' | 'db'>('both');

  // Preset Agency Templates Modal State
  const [presetsModalOpen, setPresetsModalOpen] = useState(false);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState('all');
  const [isImportingPresets, setIsImportingPresets] = useState(false);

  // Import JSON Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreviewPackages, setImportPreviewPackages] = useState<any[]>([]);
  const [importTarget, setImportTarget] = useState<'both' | 'local' | 'db'>('both');
  const [importError, setImportError] = useState<string | null>(null);
  const [isExecutingImport, setIsExecutingImport] = useState(false);

  // Restock Modal State
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<CatalogItem | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockCost, setRestockCost] = useState<number | string>('');
  const [restockNotes, setRestockNotes] = useState('');
  const [isSavingRestock, setIsSavingRestock] = useState(false);

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
  const [detectedSuggestion, setDetectedSuggestion] = useState<HsnSacEntry | null>(null);

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

  // Load all catalog data with Browser Cache & SWR
  const fetchData = async (silent = false) => {
    // 1. Instant fast hydration
    const freshCachedItems = browserCache.get<CatalogItem[]>('/api/catalog/items', orgId);
    const freshCachedPkgs = browserCache.get<PackageData[]>('/api/catalog/packages', orgId);
    const currentLocalPkgs = browserCache.getLocalPackages<PackageData>(orgId);
    const freshCachedStats = browserCache.get<CatalogStats>('/api/catalog/stats', orgId);

    if (freshCachedItems?.data || freshCachedPkgs?.data || currentLocalPkgs.length > 0) {
      if (freshCachedItems?.data) setItems(freshCachedItems.data);
      const combined = [...(freshCachedPkgs?.data || [])];
      currentLocalPkgs.forEach(lp => {
        if (!combined.some(p => p.id === lp.id || p.code === lp.code)) {
          combined.push({ ...lp, is_local_only: true });
        }
      });
      setPackages(combined);
      if (freshCachedStats?.data) setStats(freshCachedStats.data);
      setIsLoading(false);
    } else if (!silent) {
      setIsLoading(true);
    }

    setIsRefreshing(true);
    try {
      const [itemsData, pkgsData, logsData, statsData] = await Promise.all([
        apiFetch('/api/catalog/items'),
        apiFetch('/api/catalog/packages'),
        apiFetch('/api/catalog/inventory-logs'),
        apiFetch('/api/catalog/stats')
      ]);

      const freshItemsList = itemsData || [];
      const freshPkgsList = pkgsData || [];

      // Combine with local-only packages from browser storage
      const localOnly = browserCache.getLocalPackages<PackageData>(orgId);
      const combinedPkgs = [...freshPkgsList];
      localOnly.forEach(lp => {
        if (!combinedPkgs.some(p => p.id === lp.id || p.code === lp.code)) {
          combinedPkgs.push({ ...lp, is_local_only: true });
        }
      });

      setItems(freshItemsList);
      setPackages(combinedPkgs);
      setLogs(logsData || []);
      setStats(statsData || null);

      browserCache.set('/api/catalog/items', freshItemsList, orgId);
      browserCache.set('/api/catalog/packages', freshPkgsList, orgId);
      if (statsData) browserCache.set('/api/catalog/stats', statsData, orgId);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organization?.id]);

  // Copy code helper with feedback
  const handleCopy = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Categories list
  const categories = useMemo(() => {
    const list = items.map(i => i.category).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Tab filter
      if (activeTab === 'products' && item.type !== 'product') return false;
      if (activeTab === 'services' && item.type !== 'service') return false;

      // Stock status filter (Products only)
      if (activeTab === 'products' && filterStockStatus !== 'all') {
        if (!item.track_inventory) {
          if (filterStockStatus !== 'in_stock') return false;
        } else {
          if (filterStockStatus === 'in_stock' && item.stock_quantity <= item.low_stock_threshold) return false;
          if (filterStockStatus === 'low_stock' && (item.stock_quantity > item.low_stock_threshold || item.stock_quantity <= 0)) return false;
          if (filterStockStatus === 'out_of_stock' && item.stock_quantity > 0) return false;
        }
      }

      // Category filter
      if (filterCategory !== 'all' && item.category !== filterCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchHsn = item.hsn_sac?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchHsn && !matchDesc && !matchCat) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price_asc') return a.unit_price - b.unit_price;
      if (sortBy === 'price_desc') return b.unit_price - a.unit_price;
      if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity;
      if (sortBy === 'stock_desc') return b.stock_quantity - a.stock_quantity;
      return 0;
    });
  }, [items, activeTab, filterStockStatus, filterCategory, searchQuery, sortBy]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterLogType !== 'all' && log.change_type !== filterLogType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.item_name?.toLowerCase().includes(q);
        const matchSku = log.item_sku?.toLowerCase().includes(q);
        const matchRef = log.reference_id?.toLowerCase().includes(q);
        const matchNotes = log.notes?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchRef && !matchNotes) return false;
      }
      return true;
    });
  }, [logs, filterLogType, searchQuery]);

  // -------------------------------------------------------------
  // SMART SKU & HSN AUTO GENERATION HANDLERS
  // -------------------------------------------------------------

  // Auto-generate SKU based on current item name, category & type
  const handleAutoGenerateSku = () => {
    const newSku = generateSku(itemName, itemCategory, itemModalType);
    setItemSku(newSku);
  };

  // Auto-detect and set HSN / SAC Code
  const handleAutoDetectHsn = (nameVal: string, catVal: string, typeVal: 'product' | 'service') => {
    const match = detectHsnSacCode(nameVal, catVal, typeVal);
    if (match) {
      setDetectedSuggestion(match);
      // If user hasn't typed an HSN yet or editing a new item, auto-fill it
      if (!itemHsnSac || itemHsnSac === 'SAC9983' || itemHsnSac === '') {
        setItemHsnSac(match.code);
        setItemTaxRate(match.defaultTaxRate);
      }
    }
  };

  // When item name changes, trigger smart auto-detection & SKU generation if empty
  const handleItemNameChange = (val: string) => {
    setItemName(val);
    if (!editingItem) {
      if (!itemSku || itemSku.startsWith('PRD-') || itemSku.startsWith('SRV-')) {
        setItemSku(generateSku(val, itemCategory, itemModalType));
      }
      handleAutoDetectHsn(val, itemCategory, itemModalType);
    }
  };

  // When item category changes
  const handleCategoryChange = (val: string) => {
    setItemCategory(val);
    if (!editingItem) {
      handleAutoDetectHsn(itemName, val, itemModalType);
    }
  };

  // Open item modal for add
  const handleOpenAddItem = (type: 'product' | 'service') => {
    setEditingItem(null);
    setItemModalType(type);
    setItemName('');
    setItemCategory('');
    const defaultSku = generateSku('', '', type);
    setItemSku(defaultSku);
    
    // Default smart GST code
    const initialHsn = type === 'service' ? 'SAC 998314' : 'HSN 8471';
    setItemHsnSac(initialHsn);
    setItemDesc('');
    setItemUnitPrice('');
    setItemCostPrice('');
    setItemTaxRate(18);
    setItemUnit(type === 'product' ? 'pcs' : 'hr');
    setItemTrackInv(type === 'product');
    setItemStock(type === 'product' ? 0 : 0);
    setItemLowThreshold(5);
    setDetectedSuggestion(null);
    setItemModalOpen(true);
  };

  // Open item modal for edit
  const handleOpenEditItem = (item: CatalogItem) => {
    setEditingItem(item);
    setItemModalType(item.type);
    setItemName(item.name);
    setItemSku(item.sku || generateSku(item.name, item.category || '', item.type));
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
    setDetectedSuggestion(null);
    setItemModalOpen(true);
  };

  // Duplicate item
  const handleDuplicateItem = (item: CatalogItem) => {
    setEditingItem(null);
    setItemModalType(item.type);
    setItemName(`${item.name} (Copy)`);
    setItemSku(generateSku(`${item.name} Copy`, item.category || '', item.type));
    setItemHsnSac(item.hsn_sac || '');
    setItemDesc(item.description || '');
    setItemUnitPrice(item.unit_price);
    setItemCostPrice(item.cost_price || '');
    setItemTaxRate(Number(item.tax_rate || 0));
    setItemUnit(item.unit);
    setItemTrackInv(Boolean(item.track_inventory));
    setItemStock(0);
    setItemLowThreshold(item.low_stock_threshold);
    setItemCategory(item.category || '');
    setDetectedSuggestion(null);
    setItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('Please enter an item name.');
      return;
    }

    setIsSavingItem(true);
    const payload = {
      name: itemName.trim(),
      type: itemModalType,
      sku: itemSku.trim() || undefined,
      hsnSac: itemHsnSac.trim() || undefined,
      description: itemDesc.trim() || undefined,
      unitPrice: Number(itemUnitPrice) || 0,
      costPrice: Number(itemCostPrice) || 0,
      taxRate: Number(itemTaxRate) || 0,
      unit: itemUnit.trim() || (itemModalType === 'product' ? 'pcs' : 'hr'),
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
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to save catalog item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete / archive "${name}"?`)) return;
    try {
      await apiFetch(`/api/catalog/items/${id}`, { method: 'DELETE' });
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedItemIds.length} selected items?`)) return;
    try {
      for (const id of selectedItemIds) {
        await apiFetch(`/api/catalog/items/${id}`, { method: 'DELETE' });
      }
      setSelectedItemIds([]);
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete items.');
    }
  };

  // Export CSV helper
  const handleExportCSV = () => {
    const dataToExport = filteredItems.map(it => ({
      Name: it.name,
      Type: it.type,
      SKU: it.sku || '',
      HSN_SAC: it.hsn_sac || '',
      Category: it.category || '',
      Selling_Price: it.unit_price,
      Cost_Price: it.cost_price || 0,
      Tax_Rate: `${it.tax_rate}%`,
      Unit: it.unit,
      Stock_Qty: it.stock_quantity,
      Low_Stock_Threshold: it.low_stock_threshold
    }));

    if (dataToExport.length === 0) {
      alert('No items to export.');
      return;
    }

    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalog_export_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restock Submit
  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    setIsSavingRestock(true);
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
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to restock item.');
    } finally {
      setIsSavingRestock(false);
    }
  };

  // Package builder handlers
  const handleOpenAddPackage = () => {
    setEditingPackage(null);
    setPkgName('');
    setPkgCode(`PKG-${Math.floor(100 + Math.random() * 900)}`);
    setPkgDesc('');
    setPkgType('hybrid');
    setPkgPrice('');
    setPkgDiscountRate(0);
    setPkgTaxMode('item_wise');
    setPkgCustomTaxRate(18);
    setPkgItems([]);
    setPackageSaveLocation('both');
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
    setPackageSaveLocation(pkg.is_local_only ? 'local' : 'both');
    setPackageModalOpen(true);
  };

  const handleClonePackage = (pkg: PackageData) => {
    setEditingPackage(null);
    setPkgName(`${pkg.name} (Copy)`);
    setPkgCode(`PKG-${Math.floor(100 + Math.random() * 900)}`);
    setPkgDesc(pkg.description || '');
    setPkgType(pkg.package_type);
    setPkgPrice(pkg.package_price);
    setPkgDiscountRate(pkg.discount_rate || 0);
    setPkgTaxMode(pkg.tax_mode || 'item_wise');
    setPkgCustomTaxRate(pkg.custom_tax_rate || 18);
    setPkgItems(pkg.items ? [...pkg.items] : []);
    setPackageSaveLocation('both');
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

  const bundleOriginalSum = pkgItems.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);

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

  // -------------------------------------------------------------
  // EXPORT & DOWNLOAD PACKAGES & CATALOG HANDLERS
  // -------------------------------------------------------------
  const handleExportAllPackages = () => {
    if (packages.length === 0) {
      alert('No packages available to export.');
      return;
    }
    const payload = {
      exportDate: new Date().toISOString(),
      organization: organization?.name || 'BillingFlow Organization',
      totalPackages: packages.length,
      packages: packages.map(pkg => ({
        name: pkg.name,
        code: pkg.code,
        description: pkg.description,
        package_type: pkg.package_type,
        original_price: pkg.original_price,
        package_price: pkg.package_price,
        discount_rate: pkg.discount_rate,
        discount_type: pkg.discount_type || 'percentage',
        tax_mode: pkg.tax_mode || 'item_wise',
        custom_tax_rate: pkg.custom_tax_rate || 18,
        items: pkg.items.map(it => ({
          item_type: it.item_type,
          name: it.name,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          tax_rate: it.tax_rate,
          discount_rate: it.discount_rate
        }))
      }))
    };
    downloadJsonFile(`BillingFlow_Packages_Export_${new Date().toISOString().slice(0, 10)}`, payload);
  };

  const handleExportSinglePackage = (pkg: PackageData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadJsonFile(`Package_${pkg.code || pkg.name.replace(/\s+/g, '_')}`, {
      exportDate: new Date().toISOString(),
      package: pkg
    });
  };

  const handleExportFullCatalog = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      organization: organization?.name || 'BillingFlow Organization',
      totalItems: items.length,
      totalPackages: packages.length,
      items,
      packages
    };
    downloadJsonFile(`BillingFlow_Full_Catalog_${new Date().toISOString().slice(0, 10)}`, payload);
  };

  // -------------------------------------------------------------
  // IMPORT PACKAGES HANDLERS
  // -------------------------------------------------------------
  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJsonText(text);
      const res = validateAndParsePackageJson(text);
      if (res.valid && res.packages) {
        setImportPreviewPackages(res.packages);
        setImportError(null);
      } else {
        setImportPreviewPackages([]);
        setImportError(res.error || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportJsonTextChange = (text: string) => {
    setImportJsonText(text);
    if (!text.trim()) {
      setImportPreviewPackages([]);
      setImportError(null);
      return;
    }
    const res = validateAndParsePackageJson(text);
    if (res.valid && res.packages) {
      setImportPreviewPackages(res.packages);
      setImportError(null);
    } else {
      setImportPreviewPackages([]);
      setImportError(res.error || 'Invalid JSON format.');
    }
  };

  const handleExecuteImport = async () => {
    if (importPreviewPackages.length === 0) {
      alert('Please select or paste a valid package JSON file first.');
      return;
    }

    setIsExecutingImport(true);
    try {
      // 1. Save to Local Browser Storage
      if (importTarget === 'local' || importTarget === 'both') {
        const existing = browserCache.getLocalPackages<PackageData>(orgId);
        const updated = [...existing];
        importPreviewPackages.forEach(p => {
          const pkgWithId = {
            ...p,
            id: p.id || `local_pkg_${Math.random().toString(36).substring(2, 9)}`,
            is_local_only: importTarget === 'local'
          };
          const idx = updated.findIndex(u => u.code === pkgWithId.code || u.id === pkgWithId.id);
          if (idx >= 0) updated[idx] = pkgWithId;
          else updated.unshift(pkgWithId);
        });
        browserCache.setLocalPackages(updated, orgId);
      }

      // 2. Save to Database
      if (importTarget === 'db' || importTarget === 'both') {
        await apiFetch('/api/catalog/packages/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ packages: importPreviewPackages })
        });
      }

      alert(`Successfully imported ${importPreviewPackages.length} package(s) into ${importTarget === 'both' ? 'Local Browser Storage & Cloud Database' : importTarget === 'local' ? 'Local Browser Storage' : 'Cloud Database'}!`);
      setImportModalOpen(false);
      setImportJsonText('');
      setImportPreviewPackages([]);
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Import failed. Please check your data format.');
    } finally {
      setIsExecutingImport(false);
    }
  };

  // -------------------------------------------------------------
  // PRESET AGENCY & DIGITAL MARKETING PACKAGES HANDLERS
  // -------------------------------------------------------------
  const handleImportSinglePreset = async (preset: PresetPackage, destination: 'both' | 'db' | 'local' = 'both') => {
    setIsImportingPresets(true);
    try {
      // 1. Save to Local Browser Storage
      if (destination === 'local' || destination === 'both') {
        const pkgWithId = {
          ...preset,
          id: `pkg_${Math.random().toString(36).substring(2, 9)}`,
          is_local_only: destination === 'local'
        };
        browserCache.saveSingleLocalPackage(pkgWithId, orgId);
      }

      // 2. Save to Database
      if (destination === 'db' || destination === 'both') {
        await apiFetch('/api/catalog/packages/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ packages: [preset] })
        });
      }

      alert(`Preset Package "${preset.name}" imported successfully into ${destination === 'both' ? 'Local Storage & Cloud Database' : destination === 'local' ? 'Local Storage' : 'Cloud Database'}!`);
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to import preset package.');
    } finally {
      setIsImportingPresets(false);
    }
  };

  const handleImportAllPresets = async (destination: 'both' | 'db' | 'local' = 'both') => {
    if (!window.confirm(`Import all ${PRESET_PACKAGES.length} agency packages and ${PRESET_CATALOG_ITEMS.length} digital products/services?`)) return;
    setIsImportingPresets(true);
    try {
      if (destination === 'db' || destination === 'both') {
        await apiFetch('/api/catalog/items/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ items: PRESET_CATALOG_ITEMS })
        });
        await apiFetch('/api/catalog/packages/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ packages: PRESET_PACKAGES })
        });
      }

      if (destination === 'local' || destination === 'both') {
        const existing = browserCache.getLocalPackages(orgId);
        const updated = [...existing];
        PRESET_PACKAGES.forEach(p => {
          const item = { ...p, id: `pkg_${Math.random().toString(36).substring(2, 9)}` };
          if (!updated.some(u => u.code === item.code)) {
            updated.push(item);
          }
        });
        browserCache.setLocalPackages(updated, orgId);
      }

      alert(`Successfully loaded all ${PRESET_PACKAGES.length} Agency Packages and ${PRESET_CATALOG_ITEMS.length} Services & Products!`);
      setPresetsModalOpen(false);
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to import preset packages.');
    } finally {
      setIsImportingPresets(false);
    }
  };

  const handleCustomizePreset = (preset: PresetPackage) => {
    setEditingPackage(null);
    setPkgName(preset.name);
    setPkgCode(`PKG-${Math.floor(100 + Math.random() * 900)}`);
    setPkgDesc(preset.description);
    setPkgType(preset.package_type);
    setPkgPrice(preset.package_price);
    setPkgDiscountRate(preset.discount_rate);
    setPkgTaxMode(preset.tax_mode);
    setPkgCustomTaxRate(preset.custom_tax_rate);
    setPkgItems(preset.items.map(it => ({
      item_type: it.item_type,
      name: it.name,
      description: it.description || '',
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate,
      discount_rate: it.discount_rate
    })));
    setPackageSaveLocation('both');
    setPresetsModalOpen(false);
    setPackageModalOpen(true);
  };

  // -------------------------------------------------------------
  // SAVE PACKAGE (LOCAL STORAGE + DATABASE)
  // -------------------------------------------------------------
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim() || pkgItems.length === 0) {
      alert('Package name and at least one bundled product/service are required.');
      return;
    }

    setIsSavingPackage(true);
    const packagePayload: any = {
      id: editingPackage?.id || `pkg_${Math.random().toString(36).substring(2, 9)}`,
      name: pkgName.trim(),
      code: pkgCode.trim() || `PKG-${Math.floor(100 + Math.random() * 900)}`,
      description: pkgDesc.trim() || undefined,
      packageType: pkgType,
      package_type: pkgType,
      originalPrice: bundleOriginalSum,
      original_price: bundleOriginalSum,
      packagePrice: Number(pkgPrice) || bundleOriginalSum,
      package_price: Number(pkgPrice) || bundleOriginalSum,
      discountRate: Number(pkgDiscountRate) || 0,
      discount_rate: Number(pkgDiscountRate) || 0,
      discountType: 'percentage',
      discount_type: 'percentage',
      taxMode: pkgTaxMode,
      tax_mode: pkgTaxMode,
      customTaxRate: Number(pkgCustomTaxRate) || 0,
      custom_tax_rate: Number(pkgCustomTaxRate) || 0,
      is_local_only: packageSaveLocation === 'local',
      items: pkgItems.map(it => ({
        catalogItemId: it.catalog_item_id,
        catalog_item_id: it.catalog_item_id,
        itemType: it.item_type,
        item_type: it.item_type,
        name: it.name,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unit_price) || 0,
        unit_price: Number(it.unit_price) || 0,
        taxRate: Number(it.tax_rate) || 0,
        tax_rate: Number(it.tax_rate) || 0,
        discountRate: Number(it.discount_rate) || 0,
        discount_rate: Number(it.discount_rate) || 0
      }))
    };

    try {
      // 1. Save to Local Browser Storage
      if (packageSaveLocation === 'local' || packageSaveLocation === 'both') {
        browserCache.saveSingleLocalPackage(packagePayload, orgId);
      }

      // 2. Save to Cloud Database
      if (packageSaveLocation === 'db' || packageSaveLocation === 'both') {
        if (editingPackage && !editingPackage.is_local_only) {
          await apiFetch(`/api/catalog/packages/${editingPackage.id}`, {
            method: 'PUT',
            body: JSON.stringify(packagePayload)
          });
        } else {
          await apiFetch('/api/catalog/packages', {
            method: 'POST',
            body: JSON.stringify(packagePayload)
          });
        }
      }

      setPackageModalOpen(false);
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to save package.');
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string, isLocalOnly?: boolean) => {
    if (!window.confirm(`Are you sure you want to delete package "${name}"?`)) return;
    try {
      browserCache.deleteSingleLocalPackage(id, orgId);
      if (!isLocalOnly) {
        await apiFetch(`/api/catalog/packages/${id}`, { method: 'DELETE' });
      }
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete package.');
    }
  };

  // Currency symbol
  const currencySymbol = '₹';

  // Live profit calculation for item form
  const liveStats = calculateProfitStats(
    Number(itemUnitPrice) || 0,
    Number(itemCostPrice) || 0,
    itemTaxRate
  );

  // Quick categories suggestions
  const popularCategories = ['Electronics', 'Software & SaaS', 'IT Consulting', 'Design & Creative', 'Hardware', 'Maintenance', 'Office Supplies', 'Apparel'];

  // Popular Units
  const productUnits = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'units', label: 'Units' },
    { value: 'box', label: 'Box' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'meter', label: 'Meter (m)' },
    { value: 'set', label: 'Set' },
    { value: 'packet', label: 'Packet' }
  ];

  const serviceUnits = [
    { value: 'hr', label: 'Hourly (hr)' },
    { value: 'day', label: 'Per Day' },
    { value: 'month', label: 'Monthly Retainer' },
    { value: 'project', label: 'Fixed / Project' },
    { value: 'session', label: 'Per Session' },
    { value: 'service', label: 'Per Service' }
  ];

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* =========================================================
          1. HEADER & GLOBAL ACTIONS
          ========================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: '#ffffff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--primary-glow)' }}>
              <Boxes size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Catalog &amp; Inventory
                </h1>
                <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  GST Compliant
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Manage physical goods, billable service offerings, SKU identifiers, and stock health.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchData(false)}
            title="Refresh Catalog Data"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-anim' : ''} />
            <span className="hide-mobile">Refresh</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Export CSV"
            style={{ padding: '8px 14px' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleOpenAddItem('service')}
              style={{ fontWeight: 600 }}
            >
              <Wrench size={15} style={{ color: '#10b981' }} />
              <span>+ Service</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenAddItem('product')}
              style={{ fontWeight: 700 }}
            >
              <Package size={16} />
              <span>+ Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. EXECUTIVE KPI & STOCK VALUATION METRICS
          ========================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        {/* Metric 1: Products */}
        <div
          className={`catalog-metric-card ${activeTab === 'products' && filterStockStatus === 'all' ? 'active-filter' : ''}`}
          onClick={() => { setActiveTab('products'); setFilterStockStatus('all'); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Products
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {stats?.totalProducts || items.filter(i => i.type === 'product').length}
              </div>
            </div>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <span>In-Stock Inventory:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.totalStockUnits || 0} units</span>
          </div>
        </div>

        {/* Metric 2: Services */}
        <div
          className={`catalog-metric-card ${activeTab === 'services' ? 'active-filter' : ''}`}
          onClick={() => { setActiveTab('services'); setFilterStockStatus('all'); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Services
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {stats?.totalServices || items.filter(i => i.type === 'service').length}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <span>Billable Rate Items:</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>Ready to Bill</span>
          </div>
        </div>

        {/* Metric 3: Packages */}
        <div
          className={`catalog-metric-card ${activeTab === 'packages' ? 'active-filter' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Bundles &amp; Combos
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {stats?.totalPackages || packages.length}
              </div>
            </div>
            <div style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <span>Discounted Packs:</span>
            <span style={{ fontWeight: 700, color: '#ec4899' }}>Auto-calculated</span>
          </div>
        </div>

        {/* Metric 4: Low Stock Alert (Actionable) */}
        <div
          className={`catalog-metric-card ${filterStockStatus === 'low_stock' ? 'active-filter' : ''}`}
          onClick={() => {
            setActiveTab('products');
            setFilterStockStatus(filterStockStatus === 'low_stock' ? 'all' : 'low_stock');
          }}
          style={{
            borderColor: (stats?.lowStockCount || 0) > 0 ? 'rgba(239, 68, 68, 0.35)' : undefined
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: (stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Stock Attention
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '2px' }}>
                {stats?.lowStockCount || 0}
              </div>
            </div>
            <div style={{ background: (stats?.lowStockCount || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)', color: (stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-muted)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: (stats?.lowStockCount || 0) > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
            <span>{(stats?.lowStockCount || 0) > 0 ? 'Requires Restocking' : 'Inventory Healthy'}</span>
            <span style={{ fontWeight: 600 }}>Click to filter</span>
          </div>
        </div>

      </div>

      {/* Valuation summary bar if products exist */}
      {stats && stats.totalProducts > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <BarChart3 size={15} style={{ color: 'var(--primary)' }} />
            <span>Warehouse Valuation:</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Retail Value:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol} {Number(stats.totalInventoryValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Cost Basis:</span>
              <strong style={{ color: 'var(--text-secondary)' }}>{currencySymbol} {Number(stats.totalCostValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
            </div>
            {Number(stats.totalInventoryValue) > 0 && (
              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                Est. Gross Profit: {currencySymbol} {Math.max(0, (stats.totalInventoryValue - (stats.totalCostValue || 0))).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          3. MAIN NAVIGATION TABS & CONTROLS
          ========================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        
        {/* Segmented Tab Controls */}
        <div className="tab-bar">
          <button
            className={`tab-bar-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Products &amp; Stock ({items.filter(i => i.type === 'product').length})
          </button>

          <button
            className={`tab-bar-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Wrench size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Services ({items.filter(i => i.type === 'service').length})
          </button>

          <button
            className={`tab-bar-btn ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            <Layers size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Packages ({packages.length})
          </button>

          <button
            className={`tab-bar-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Clock size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Stock Audit Logs
          </button>
        </div>

        {/* View mode toggle for Products and Services */}
        {(activeTab === 'products' || activeTab === 'services') && (
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '3px' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'table' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <List size={14} />
              <span className="hide-mobile">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'grid' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <LayoutGrid size={14} />
              <span className="hide-mobile">Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================
          4. FILTER & SEARCH TOOLBAR
          ========================================================= */}
      {(activeTab === 'products' || activeTab === 'services') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            
            {/* Search Input with Clear Button */}
            <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search by name, SKU, HSN/SAC code, category...`}
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: searchQuery ? '36px' : '14px', fontSize: '0.88rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {categories.length > 0 && (
                <select
                  className="form-input"
                  style={{ width: 'auto', background: 'var(--bg-secondary)', fontSize: '0.85rem', padding: '8px 32px 8px 12px' }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories ({items.filter(i => i.type === (activeTab === 'products' ? 'product' : 'service')).length})</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}

              {/* Sort Order Selector */}
              <select
                className="form-input"
                style={{ width: 'auto', background: 'var(--bg-secondary)', fontSize: '0.85rem', padding: '8px 32px 8px 12px' }}
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                {activeTab === 'products' && (
                  <>
                    <option value="stock_asc">Stock: Low to High</option>
                    <option value="stock_desc">Stock: High to Low</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Stock Status Filter Pills (For Products Tab) */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stock Status:</span>
              
              <button
                className={`interactive-pill ${filterStockStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStockStatus('all')}
              >
                All Products
              </button>

              <button
                className={`interactive-pill ${filterStockStatus === 'in_stock' ? 'active' : ''}`}
                onClick={() => setFilterStockStatus('in_stock')}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
                In Stock Healthy
              </button>

              <button
                className={`interactive-pill ${filterStockStatus === 'low_stock' ? 'active' : ''}`}
                onClick={() => setFilterStockStatus('low_stock')}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }}></span>
                Low Stock Warning
              </button>

              <button
                className={`interactive-pill ${filterStockStatus === 'out_of_stock' ? 'active' : ''}`}
                onClick={() => setFilterStockStatus('out_of_stock')}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }}></span>
                Out of Stock
              </button>
            </div>
          )}

          {/* Bulk Selection Bar */}
          {selectedItemIds.length > 0 && (
            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-glow)', borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                {selectedItemIds.length} item{selectedItemIds.length > 1 ? 's' : ''} selected
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedItemIds([])}
                >
                  Deselect All
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={13} />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================
          5. PRODUCTS & SERVICES VIEW (TABLE OR GRID)
          ========================================================= */}
      {(activeTab === 'products' || activeTab === 'services') && (
        <>
          {filteredItems.length === 0 ? (
            /* Empty State */
            <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {activeTab === 'products' ? <Package size={28} /> : <Wrench size={28} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px' }}>
                  No {activeTab} match your filter
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '440px', margin: 0 }}>
                  {searchQuery || filterCategory !== 'all' || filterStockStatus !== 'all'
                    ? 'Try adjusting your search query, clearing filters, or adding a new offering.'
                    : `Get started by registering your first ${activeTab === 'products' ? 'product with automated SKU and HSN code' : 'billable service'}.`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {(searchQuery || filterCategory !== 'all' || filterStockStatus !== 'all') && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterStockStatus('all'); }}
                  >
                    Clear All Filters
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => handleOpenAddItem(activeTab === 'products' ? 'product' : 'service')}
                >
                  <Plus size={15} />
                  <span>Add New {activeTab === 'products' ? 'Product' : 'Service'}</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedItemIds.length === filteredItems.length && filteredItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedItemIds(filteredItems.map(i => i.id));
                          else setSelectedItemIds([]);
                        }}
                      />
                    </th>
                    <th>Item &amp; Description</th>
                    <th>SKU / Identifier</th>
                    <th>GST HSN/SAC</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Selling Price</th>
                    {activeTab === 'products' && <th style={{ textAlign: 'right' }}>Cost &amp; Margin</th>}
                    <th style={{ textAlign: 'center' }}>GST Slab</th>
                    {activeTab === 'products' && <th style={{ textAlign: 'center' }}>Stock Level</th>}
                    <th style={{ textAlign: 'right', minWidth: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isProd = item.type === 'product';
                    const isLow = isProd && item.track_inventory === 1 && item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0;
                    const isOutOfStock = isProd && item.track_inventory === 1 && item.stock_quantity <= 0;
                    const isHealthy = isProd && item.track_inventory === 1 && item.stock_quantity > item.low_stock_threshold;
                    
                    // Margin calculation
                    const marginStats = calculateProfitStats(item.unit_price, item.cost_price || 0, item.tax_rate);

                    return (
                      <tr key={item.id} style={{ background: isSelected ? 'var(--primary-light)' : undefined }}>
                        
                        {/* Checkbox */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedItemIds([...selectedItemIds, item.id]);
                              else setSelectedItemIds(selectedItemIds.filter(id => id !== item.id));
                            }}
                          />
                        </td>

                        {/* Name & Type Avatar */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: isProd ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: isProd ? '#818cf8' : '#34d399',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}>
                              {isProd ? <Package size={17} /> : <Wrench size={17} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                {item.name}
                              </div>
                              {item.description && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU Badge with 1-click copy */}
                        <td>
                          {item.sku ? (
                            <span
                              className="catalog-code-badge"
                              title="Click to copy SKU"
                              onClick={(e) => handleCopy(item.sku!, e)}
                              style={{ cursor: 'pointer' }}
                            >
                              {item.sku}
                              {copiedCode === item.sku ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>

                        {/* HSN/SAC Code with 1-click copy */}
                        <td>
                          {item.hsn_sac ? (
                            <span
                              className="catalog-code-badge"
                              style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary)', cursor: 'pointer' }}
                              title="Click to copy HSN/SAC code"
                              onClick={(e) => handleCopy(item.hsn_sac!, e)}
                            >
                              {item.hsn_sac}
                              {copiedCode === item.hsn_sac ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>

                        {/* Category */}
                        <td>
                          {item.category ? (
                            <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                              {item.category}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>General</span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {currencySymbol} {Number(item.unit_price).toFixed(2)}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            per {item.unit || (isProd ? 'pcs' : 'hr')}
                          </span>
                        </td>

                        {/* Cost Price & Margin % */}
                        {isProd && (
                          <td style={{ textAlign: 'right' }}>
                            {item.cost_price ? (
                              <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {currencySymbol} {Number(item.cost_price).toFixed(2)}
                                </div>
                                {marginStats.profitMarginPercent > 0 && (
                                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                                    +{marginStats.profitMarginPercent}% margin
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                            )}
                          </td>
                        )}

                        {/* GST Slab */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{
                            background: item.tax_rate === 18 ? 'rgba(99, 102, 241, 0.12)' : item.tax_rate === 12 ? 'rgba(6, 182, 212, 0.12)' : item.tax_rate === 28 ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-tertiary)',
                            color: item.tax_rate === 18 ? 'var(--primary)' : item.tax_rate === 12 ? 'var(--accent)' : item.tax_rate === 28 ? '#ef4444' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.72rem'
                          }}>
                            {Number(item.tax_rate || 0)}% GST
                          </span>
                        </td>

                        {/* Stock Level with Visual Meter */}
                        {isProd && (
                          <td style={{ textAlign: 'center', minWidth: '130px' }}>
                            {item.track_inventory === 1 ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: '110px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: isOutOfStock ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'
                                  }}></span>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isOutOfStock ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text-primary)' }}>
                                    {item.stock_quantity} {item.unit}
                                  </span>
                                </div>
                                <div className="stock-meter-track" style={{ width: '80px' }}>
                                  <div
                                    className={`stock-meter-fill ${isOutOfStock ? 'out' : isLow ? 'low' : 'healthy'}`}
                                    style={{
                                      width: isOutOfStock ? '100%' : `${Math.min(100, Math.max(15, (item.stock_quantity / (item.low_stock_threshold * 3 || 15)) * 100))}%`
                                    }}
                                  ></div>
                                </div>
                                <span style={{ fontSize: '0.68rem', color: isOutOfStock ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text-muted)', marginTop: '2px' }}>
                                  {isOutOfStock ? 'Out of stock' : isLow ? `Low (min ${item.low_stock_threshold})` : 'Stock healthy'}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unlimited</span>
                            )}
                          </td>
                        )}

                        {/* Action Buttons */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {isProd && item.track_inventory === 1 && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '5px 9px', fontSize: '0.75rem' }}
                                title="Quick Restock Units"
                                onClick={() => {
                                  setRestockItem(item);
                                  setRestockQty(10);
                                  setRestockCost(item.cost_price || '');
                                  setRestockNotes('');
                                  setRestockModalOpen(true);
                                }}
                              >
                                <RefreshCw size={12} />
                                <span className="hide-mobile">Restock</span>
                              </button>
                            )}

                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px' }}
                              onClick={() => handleOpenEditItem(item)}
                              title="Edit item"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px' }}
                              onClick={() => handleDuplicateItem(item)}
                              title="Duplicate item"
                            >
                              <Copy size={13} />
                            </button>

                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 8px' }}
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              title="Delete item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID / CARDS VIEW */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredItems.map(item => {
                const isProd = item.type === 'product';
                const isLow = isProd && item.track_inventory === 1 && item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0;
                const isOutOfStock = isProd && item.track_inventory === 1 && item.stock_quantity <= 0;
                const marginStats = calculateProfitStats(item.unit_price, item.cost_price || 0, item.tax_rate);

                return (
                  <div key={item.id} className="grid-catalog-card">
                    
                    {/* Card Top */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isProd ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: isProd ? '#818cf8' : '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isProd ? <Package size={16} /> : <Wrench size={16} />}
                          </div>
                          <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                            {item.category || 'General'}
                          </span>
                        </div>

                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.7rem' }}>
                          {item.tax_rate}% GST
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                        {item.name}
                      </h4>
                      {item.description && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                          {item.description}
                        </p>
                      )}

                      {/* Code Tags */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {item.sku && (
                          <span
                            className="catalog-code-badge"
                            title="Click to copy SKU"
                            onClick={(e) => handleCopy(item.sku!, e)}
                            style={{ cursor: 'pointer' }}
                          >
                            SKU: {item.sku}
                            {copiedCode === item.sku ? <Check size={10} style={{ color: '#10b981' }} /> : <Copy size={10} />}
                          </span>
                        )}
                        {item.hsn_sac && (
                          <span
                            className="catalog-code-badge"
                            style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary)', cursor: 'pointer' }}
                            title="Click to copy HSN/SAC"
                            onClick={(e) => handleCopy(item.hsn_sac!, e)}
                          >
                            {item.hsn_sac}
                            {copiedCode === item.hsn_sac ? <Check size={10} style={{ color: '#10b981' }} /> : <Copy size={10} />}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Meter (Products) */}
                    {isProd && item.track_inventory === 1 && (
                      <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stock in Warehouse:</span>
                          <span style={{ fontWeight: 700, color: isOutOfStock ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text-primary)' }}>
                            {item.stock_quantity} {item.unit}
                          </span>
                        </div>
                        <div className="stock-meter-track">
                          <div
                            className={`stock-meter-fill ${isOutOfStock ? 'out' : isLow ? 'low' : 'healthy'}`}
                            style={{ width: isOutOfStock ? '100%' : `${Math.min(100, Math.max(15, (item.stock_quantity / (item.low_stock_threshold * 3 || 15)) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Card Bottom: Price & Actions */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {currencySymbol} {Number(item.unit_price).toFixed(2)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{item.unit}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {isProd && item.track_inventory === 1 && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            title="Restock"
                            onClick={() => {
                              setRestockItem(item);
                              setRestockQty(10);
                              setRestockCost(item.cost_price || '');
                              setRestockNotes('');
                              setRestockModalOpen(true);
                            }}
                          >
                            <RefreshCw size={12} />
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleOpenEditItem(item)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =========================================================
          6. PACKAGES & BUNDLES TAB CONTENT
          ========================================================= */}
      {activeTab === 'packages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Action Toolbar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Combo Packages &amp; Bundled Offers
                </h3>
                <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  {packages.length} Packages
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Group billable digital agency services &amp; software products into attractive bundles with instant browser caching.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Load Ready-made Agency Templates */}
              <button
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)'
                }}
                onClick={() => setPresetsModalOpen(true)}
              >
                <Sparkles size={15} />
                <span>Ready-Made Agency Packages</span>
              </button>

              {/* Import Packages (JSON) */}
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setImportJsonText('');
                  setImportPreviewPackages([]);
                  setImportError(null);
                  setImportModalOpen(true);
                }}
              >
                <Upload size={14} />
                <span>Import JSON</span>
              </button>

              {/* Export All Packages (JSON) */}
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleExportAllPackages}
                title="Download all packages to local browser storage / JSON backup"
              >
                <Download size={14} />
                <span>Export All (JSON)</span>
              </button>

              {/* Create Custom Package */}
              <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={handleOpenAddPackage}>
                <Plus size={15} />
                <span>+ Create Custom Package</span>
              </button>
            </div>
          </div>

          {packages.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={30} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px' }}>No Packages Created Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
                  Combine services (e.g. Web Development + Cloud VPS Hosting + 3-Month SEO Support) or digital software products into high-margin combo offers.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                <button
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={() => setPresetsModalOpen(true)}
                >
                  <Sparkles size={16} />
                  <span>Explore Agency Ready-Made Packages</span>
                </button>

                <button className="btn btn-primary" onClick={handleOpenAddPackage}>
                  <Plus size={15} />
                  <span>Create Custom Package</span>
                </button>

                <button className="btn btn-secondary" onClick={() => setImportModalOpen(true)}>
                  <Upload size={15} />
                  <span>Import from JSON File</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
              {packages.map(pkg => {
                const totalSavings = Math.max(0, Number(pkg.original_price || 0) - Number(pkg.package_price || 0));

                return (
                  <div key={pkg.id} className="grid-catalog-card fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    
                    {/* Top Header */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="catalog-code-badge" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', fontWeight: 800 }}>
                            {pkg.code}
                          </span>
                          {pkg.is_local_only ? (
                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.66rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <HardDrive size={10} /> Local Storage
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '0.66rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Database size={10} /> Cloud Synced
                            </span>
                          )}
                        </div>

                        <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                          {pkg.package_type?.toUpperCase()}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                        {pkg.name}
                      </h4>
                      {pkg.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                          {pkg.description}
                        </p>
                      )}

                      {/* Bundled Items Breakdown */}
                      <div style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Included Components ({pkg.items?.length || 0})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                          {pkg.items?.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                <span style={{ color: it.item_type === 'product' ? '#818cf8' : '#34d399', fontWeight: 700, fontSize: '0.68rem', flexShrink: 0 }}>
                                  [{it.item_type === 'product' ? 'PROD' : 'SERV'}]
                                </span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }} className="text-truncate">{it.quantity}x {it.name}</span>
                              </div>
                              <span style={{ color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '8px' }}>
                                {currencySymbol} {(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price & Discount */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <div>
                          {Number(pkg.discount_rate || 0) > 0 && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {currencySymbol} {Number(pkg.original_price).toFixed(2)}
                            </div>
                          )}
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {currencySymbol} {Number(pkg.package_price).toFixed(2)}
                          </div>
                        </div>

                        {Number(pkg.discount_rate || 0) > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.74rem' }}>
                              {Number(pkg.discount_rate)}% OFF
                            </span>
                            <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>
                              Save {currencySymbol} {totalSavings.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginTop: '14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Download Package JSON */}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 9px', fontSize: '0.75rem' }}
                            onClick={(e) => handleExportSinglePackage(pkg, e)}
                            title="Download Package as JSON"
                          >
                            <Download size={13} />
                          </button>

                          {/* Clone Package */}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 9px', fontSize: '0.75rem' }}
                            onClick={() => handleClonePackage(pkg)}
                            title="Duplicate / Clone Package"
                          >
                            <Copy size={13} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => handleOpenEditPackage(pkg)}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 10px' }}
                            onClick={() => handleDeletePackage(pkg.id, pkg.name, pkg.is_local_only)}
                            title="Delete package"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* =========================================================
          7. STOCK MOVEMENT LOGS TAB
          ========================================================= */}
      {activeTab === 'logs' && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>Real-Time Inventory Movement Audit Log</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Track every stock addition, invoice deduction, manual restock, and inventory balance update.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="form-input"
                style={{ width: 'auto', background: 'var(--bg-secondary)', fontSize: '0.82rem' }}
                value={filterLogType}
                onChange={(e) => setFilterLogType(e.target.value)}
              >
                <option value="all">All Movement Types</option>
                <option value="restock">Restocks (+)</option>
                <option value="sale">Invoice Sales (-)</option>
                <option value="adjustment">Adjustments</option>
                <option value="return">Returns (+)</option>
              </select>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '7px 12px 7px 32px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product &amp; SKU</th>
                  <th>Movement Type</th>
                  <th style={{ textAlign: 'right' }}>Qty Change</th>
                  <th style={{ textAlign: 'right' }}>Balance After</th>
                  <th>Reference &amp; Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No inventory movements recorded yet. Movements appear when products are restocked or sold in invoices.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const isPositive = log.quantity_change > 0;
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {log.item_name}
                          </div>
                          {log.item_sku && (
                            <span className="catalog-code-badge" style={{ marginTop: '2px' }}>
                              {log.item_sku}
                            </span>
                          )}
                        </td>
                        <td>
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
                        <td style={{ textAlign: 'right', fontWeight: 800, color: isPositive ? '#10b981' : '#ef4444', fontSize: '0.92rem' }}>
                          {isPositive ? `+${log.quantity_change}` : log.quantity_change}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {log.quantity_after} {log.item_unit || 'units'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {log.reference_id && (
                            <span className="catalog-code-badge" style={{ marginRight: '6px', color: 'var(--primary)' }}>
                              {log.reference_id}
                            </span>
                          )}
                          {log.notes || '—'}
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

      {/* =========================================================
          8. ADD / EDIT PRODUCT OR SERVICE MODAL (REDESIGNED)
          ========================================================= */}
      {itemModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', boxShadow: 'var(--shadow-xl)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: itemModalType === 'product' ? 'var(--primary-light)' : 'rgba(16, 185, 129, 0.12)', color: itemModalType === 'product' ? 'var(--primary)' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {itemModalType === 'product' ? <Package size={18} /> : <Wrench size={18} />}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    {editingItem ? `Edit ${itemModalType === 'product' ? 'Product' : 'Service'}` : `Register New ${itemModalType === 'product' ? 'Physical Product' : 'Billable Service'}`}
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Auto-generates SKU IDs and GST HSN/SAC codes for instant invoicing and inventory tracking.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Type Switch Segmented Control */}
              <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setItemModalType('product');
                    if (!editingItem) {
                      setItemUnit('pcs');
                      setItemTrackInv(true);
                      setItemSku(generateSku(itemName, itemCategory, 'product'));
                      handleAutoDetectHsn(itemName, itemCategory, 'product');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '9px',
                    border: 'none',
                    borderRadius: '8px',
                    background: itemModalType === 'product' ? 'var(--primary)' : 'transparent',
                    color: itemModalType === 'product' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Package size={16} />
                  <span>Physical Product (Goods)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemModalType('service');
                    if (!editingItem) {
                      setItemUnit('hr');
                      setItemTrackInv(false);
                      setItemSku(generateSku(itemName, itemCategory, 'service'));
                      handleAutoDetectHsn(itemName, itemCategory, 'service');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '9px',
                    border: 'none',
                    borderRadius: '8px',
                    background: itemModalType === 'service' ? 'var(--primary)' : 'transparent',
                    color: itemModalType === 'service' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Wrench size={16} />
                  <span>Billable Service (SAC)</span>
                </button>
              </div>

              {/* SECTION 1: Item Basic Info */}
              <div className="modal-section-card">
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Basic Offering Details
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{itemModalType === 'product' ? 'Product Name' : 'Service Title'} *</label>
                  <input
                    type="text"
                    required
                    placeholder={itemModalType === 'product' ? 'e.g. Wireless Mouse, Dell UltraSharp Monitor, Ergonomic Chair...' : 'e.g. Web Development, Cloud Architecture Consulting, AMC Support...'}
                    className="form-input"
                    value={itemName}
                    onChange={(e) => handleItemNameChange(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Electronics, IT Services, Consulting, Furniture..."
                    className="form-input"
                    value={itemCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  />
                  {/* Quick Category Chips */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {popularCategories.slice(0, 5).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        style={{
                          fontSize: '0.72rem',
                          background: itemCategory === cat ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                          color: itemCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                          border: itemCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          borderRadius: '999px',
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description / Invoice Line Memo</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Optional item summary or specifications to appear on client invoices..."
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* SECTION 2: Identification & Compliance (SKU & HSN/SAC) */}
              <div className="modal-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Identification &amp; GST Compliance
                  </div>
                  <button
                    type="button"
                    onClick={() => setHsnBrowserOpen(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Search size={12} />
                    <span>Browse GST Library</span>
                  </button>
                </div>

                <div className="form-grid-2" style={{ gap: '12px' }}>
                  
                  {/* SKU Input with Auto-Gen Button */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        {itemModalType === 'product' ? 'SKU Code' : 'Service Code'}
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSku}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Generate a unique clean SKU"
                      >
                        <Zap size={11} />
                        <span>Auto-Generate</span>
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="e.g. PRD-WRL-4821"
                        className="form-input"
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        value={itemSku}
                        onChange={(e) => setItemSku(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* HSN / SAC Code with Auto-Detect */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        {itemModalType === 'product' ? 'GST HSN Code' : 'GST SAC Code'}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoDetectHsn(itemName, itemCategory, itemModalType)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#10b981',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Auto-detect from item name"
                      >
                        <Sparkles size={11} />
                        <span>Auto-Detect</span>
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder={itemModalType === 'product' ? 'e.g. HSN 8471' : 'e.g. SAC 998314'}
                        className="form-input"
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        value={itemHsnSac}
                        onChange={(e) => setItemHsnSac(e.target.value)}
                      />
                    </div>
                  </div>

                </div>

                {/* Auto-detected HSN/SAC Banner */}
                {detectedSuggestion && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                      <Sparkles size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span>
                        <strong>{detectedSuggestion.code}</strong> — {detectedSuggestion.description}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.7rem', flexShrink: 0 }}
                      onClick={() => {
                        setItemHsnSac(detectedSuggestion.code);
                        setItemTaxRate(detectedSuggestion.defaultTaxRate);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 3: Pricing, Profit Calculator & GST Slab */}
              <div className="modal-section-card">
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pricing &amp; Taxation
                </div>

                <div className="form-grid-2" style={{ gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selling Price ({currencySymbol}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0.00"
                      className="form-input"
                      style={{ fontWeight: 700, fontSize: '0.95rem' }}
                      value={itemUnitPrice}
                      onChange={(e) => setItemUnitPrice(e.target.value)}
                    />
                  </div>

                  {itemModalType === 'product' ? (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cost / Purchase Price ({currencySymbol})</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00 (For margin calculation)"
                        className="form-input"
                        value={itemCostPrice}
                        onChange={(e) => setItemCostPrice(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Billing Metric</label>
                      <select
                        className="form-input"
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        {serviceUnits.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* GST Slab Selector */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Applicable GST Slab</label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Selected: {itemTaxRate}% GST
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0, 5, 12, 18, 28].map(slab => (
                      <button
                        key={slab}
                        type="button"
                        onClick={() => setItemTaxRate(slab)}
                        style={{
                          flex: 1,
                          padding: '7px 0',
                          borderRadius: '8px',
                          border: itemTaxRate === slab ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          background: itemTaxRate === slab ? 'var(--primary-light)' : 'var(--bg-secondary)',
                          color: itemTaxRate === slab ? 'var(--primary)' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {slab}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Profit Margin & Total Calculator */}
                {Number(itemUnitPrice) > 0 && (
                  <div className="live-calc-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Base Price:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currencySymbol} {liveStats.sellingPrice.toFixed(2)}</div>
                      </div>

                      {itemModalType === 'product' && liveStats.costPrice > 0 && (
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Gross Profit:</span>
                          <div style={{ fontWeight: 700, color: '#10b981' }}>
                            +{currencySymbol} {liveStats.grossProfit.toFixed(2)} ({liveStats.profitMarginPercent}%)
                          </div>
                        </div>
                      )}

                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>GST Tax ({itemTaxRate}%):</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>+{currencySymbol} {liveStats.taxAmount.toFixed(2)}</div>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Final Billed Total:</span>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                          {currencySymbol} {liveStats.finalPriceWithTax.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* SECTION 4: Inventory Tracking (Product Only) */}
              {itemModalType === 'product' && (
                <div className="modal-section-card">
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Warehouse &amp; Stock Settings
                  </div>

                  <div className="form-grid-2" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Unit of Measure</label>
                      <select
                        className="form-input"
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        {productUnits.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Real-Time Inventory Tracking</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', height: '42px', fontSize: '0.85rem', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={itemTrackInv}
                          onChange={(e) => setItemTrackInv(e.target.checked)}
                        />
                        <span>Track Stock Quantities</span>
                      </label>
                    </div>
                  </div>

                  {itemTrackInv && (
                    <div className="form-grid-2" style={{ gap: '12px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
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
                        <label className="form-label">Low Stock Alert Threshold</label>
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
              )}

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setItemModalOpen(false)}
                  disabled={isSavingItem}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingItem}
                  style={{ minWidth: '130px' }}
                >
                  {isSavingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Register Offering'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          9. GST HSN / SAC LIBRARY BROWSER MODAL
          ========================================================= */}
      {hsnBrowserOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '580px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>GST HSN / SAC Code Directory</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Standard Indian GST classifications for goods &amp; services. Click to select.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHsnBrowserOpen(false)}
                style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by code, keyword, industry (e.g. software, laptop, design)..."
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                value={hsnSearchQuery}
                onChange={(e) => setHsnSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', paddingRight: '4px' }}>
              {searchHsnSacCodes(hsnSearchQuery, itemModalType).map((entry, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setItemHsnSac(entry.code);
                    setItemTaxRate(entry.defaultTaxRate);
                    setHsnBrowserOpen(false);
                  }}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                >
                  <div style={{ minWidth: 0, paddingRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="catalog-code-badge" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {entry.code}
                      </span>
                      <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.68rem' }}>
                        {entry.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {entry.description}
                    </div>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.72rem', flexShrink: 0 }}>
                    {entry.defaultTaxRate}% GST
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          10. RESTOCK MODAL (REDESIGNED)
          ========================================================= */}
      {restockModalOpen && restockItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={17} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Restock Units</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockModalOpen(false)}
                style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{restockItem.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Current Balance: <strong>{restockItem.stock_quantity} {restockItem.unit}</strong></span>
                <span>New Total: <strong style={{ color: '#10b981' }}>{restockItem.stock_quantity + (Number(restockQty) || 0)} {restockItem.unit}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSaveRestock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Units to Add *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-input"
                  style={{ fontWeight: 700, fontSize: '1rem' }}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Unit Cost Price ({currencySymbol})</label>
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
                <label className="form-label">Supplier / PO Reference</label>
                <input
                  type="text"
                  placeholder="e.g. PO #1084 from Vendor ABC"
                  className="form-input"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRestockModalOpen(false)}
                  disabled={isSavingRestock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingRestock}
                >
                  {isSavingRestock ? 'Updating...' : `Confirm Restock (+${restockQty})`}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* =========================================================
          11. PACKAGE BUILDER MODAL (REDESIGNED)
          ========================================================= */}
      {packageModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)', color: '#ffffff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    {editingPackage ? 'Edit Combo Package' : 'Create Combo Package'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Bundle products and services into an enticing discount deal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPackageModalOpen(false)}
                style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-grid-2" style={{ gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Package Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starter E-Commerce Bundle, Complete Hardware + Support..."
                    className="form-input"
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Package SKU / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PKG-101"
                    className="form-input"
                    style={{ fontFamily: 'monospace' }}
                    value={pkgCode}
                    onChange={(e) => setPkgCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <input
                  type="text"
                  placeholder="Summary of what is included in this bundle deal..."
                  className="form-input"
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                />
              </div>

              {/* Component Selector */}
              <div className="modal-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Bundled Products &amp; Services ({pkgItems.length})
                  </span>

                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '6px 28px 6px 10px' }}
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
                        <option key={it.id} value={it.id}>{it.name} ({currencySymbol} {it.unit_price})</option>
                      ))}
                    </optgroup>
                    <optgroup label="⚡ Services">
                      {items.filter(it => it.type === 'service').map(it => (
                        <option key={it.id} value={it.id}>{it.name} ({currencySymbol} {it.unit_price})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {pkgItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No items bundled yet. Use the dropdown above to add products and services to this package offer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pkgItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 70px 100px 70px 36px', gap: '8px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.name}</div>
                          <span style={{ fontSize: '0.68rem', color: item.item_type === 'product' ? '#818cf8' : '#34d399' }}>
                            {item.item_type === 'product' ? 'Product' : 'Service'}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: '0.82rem', textAlign: 'center' }}
                          value={item.quantity}
                          onChange={(e) => handleUpdateBundledItem(idx, 'quantity', Number(e.target.value))}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          style={{ padding: '5px 8px', fontSize: '0.82rem', textAlign: 'right' }}
                          value={item.unit_price}
                          onChange={(e) => handleUpdateBundledItem(idx, 'unit_price', Number(e.target.value))}
                        />
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)' }}>
                          {currencySymbol} {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
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

              {/* Pricing & Discount */}
              <div className="live-calc-box">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Combined Items Total:</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {currencySymbol} {bundleOriginalSum.toFixed(2)}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Package Offer Price ({currencySymbol}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      className="form-input"
                      style={{ fontWeight: 800, color: 'var(--primary)' }}
                      value={pkgPrice}
                      onChange={(e) => handlePackagePriceChange(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Discount Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-input"
                      value={pkgDiscountRate}
                      onChange={(e) => handlePackageDiscountChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Storage Destination Selector */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardDrive size={14} color="var(--primary)" />
                  <span>Storage &amp; Persistence Destination:</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'both', label: 'Local Storage + Cloud DB (Fast & Synced)', icon: <CheckCircle2 size={13} color="#10b981" /> },
                    { id: 'local', label: 'Local Browser Storage Only (Offline Draft)', icon: <HardDrive size={13} color="#f59e0b" /> },
                    { id: 'db', label: 'Cloud Database Only', icon: <Database size={13} color="#8b5cf6" /> }
                  ].map(target => (
                    <label
                      key={target.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: packageSaveLocation === target.id ? 'var(--bg-secondary)' : 'transparent',
                        border: `1px solid ${packageSaveLocation === target.id ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="saveLocation"
                        checked={packageSaveLocation === target.id}
                        onChange={() => setPackageSaveLocation(target.id as any)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      {target.icon}
                      <span>{target.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    const tempPkg: any = {
                      name: pkgName || 'Untitled Package',
                      code: pkgCode || 'PKG-EXPORT',
                      description: pkgDesc,
                      package_type: pkgType,
                      original_price: bundleOriginalSum,
                      package_price: Number(pkgPrice) || bundleOriginalSum,
                      discount_rate: Number(pkgDiscountRate) || 0,
                      discount_type: 'percentage',
                      tax_mode: pkgTaxMode,
                      custom_tax_rate: Number(pkgCustomTaxRate) || 18,
                      items: pkgItems
                    };
                    downloadJsonFile(`Package_${tempPkg.code}`, { package: tempPkg });
                  }}
                >
                  <Download size={13} />
                  <span>Download as JSON</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPackageModalOpen(false)}
                    disabled={isSavingPackage}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSavingPackage}
                  >
                    {isSavingPackage ? 'Saving...' : editingPackage ? 'Save Changes' : 'Publish Combo Package'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================
          12. READY-MADE AGENCY TEMPLATES MODAL
          ========================================================= */}
      {presetsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '960px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#ffffff', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      Ready-Made Digital Agency Packages Library
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Pre-configured industry standard packages: Web Development, Hosting, 3-Month SEO Support, Meta Ads, AI Automations &amp; SaaS Products.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  disabled={isImportingPresets}
                  onClick={() => handleImportAllPresets('both')}
                >
                  <CheckCircle2 size={15} />
                  <span>{isImportingPresets ? 'Importing All...' : '1-Click Load All Agency Presets'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPresetsModalOpen(false)}
                  style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'all', label: 'All Packages (8)' },
                { id: 'Web Development', label: '🌐 Web Dev & Hosting' },
                { id: 'Search Engine Optimization', label: '🔍 SEO & 3-Month Retainer' },
                { id: 'Paid Advertising', label: '📈 Meta Ads & AdSense' },
                { id: 'Software Products & SaaS', label: '💻 SaaS (CRM, HRM, BillingFlow)' },
                { id: 'AI & Automation', label: '🤖 AI Agents & WhatsApp API' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setPresetCategoryFilter(cat.id)}
                  style={{
                    background: presetCategoryFilter === cat.id ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: presetCategoryFilter === cat.id ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
              {PRESET_PACKAGES
                .filter(pkg => presetCategoryFilter === 'all' || pkg.category === presetCategoryFilter)
                .map((pkg, idx) => (
                  <div
                    key={idx}
                    className="grid-catalog-card"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '14px'
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="catalog-code-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontWeight: 800 }}>
                          {pkg.code}
                        </span>
                        {pkg.badge && (
                          <span className="badge badge-success" style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                        {pkg.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.45 }}>
                        {pkg.description}
                      </p>

                      {/* Bundled Items Breakdown */}
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Included Services &amp; Products ({pkg.items.length})
                        </div>
                        {pkg.items.map((it, itemIdx) => (
                          <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                              <span style={{ color: it.item_type === 'product' ? '#818cf8' : '#34d399', fontWeight: 700, fontSize: '0.66rem' }}>
                                [{it.item_type === 'product' ? 'PROD' : 'SERV'}]
                              </span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }} className="text-truncate">{it.name}</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', flexShrink: 0 }}>
                              {currencySymbol} {it.unit_price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price & Import Actions */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {currencySymbol} {pkg.original_price.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {currencySymbol} {pkg.package_price.toLocaleString()}
                          </div>
                        </div>

                        <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.76rem' }}>
                          {pkg.discount_rate}% OFF
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '8px 10px', justifyContent: 'center' }}
                          disabled={isImportingPresets}
                          onClick={() => handleImportSinglePreset(pkg, 'both')}
                        >
                          <Plus size={14} />
                          <span>Import to Catalog</span>
                        </button>

                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '8px 10px' }}
                          onClick={() => handleCustomizePreset(pkg)}
                          title="Customize prices or items before saving"
                        >
                          <Edit2 size={13} />
                          <span>Customize</span>
                        </button>

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 10px' }}
                          onClick={() => downloadJsonFile(`Preset_${pkg.code}`, { presetPackage: pkg })}
                          title="Download Preset JSON"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          13. IMPORT PACKAGES JSON MODAL
          ========================================================= */}
      {importModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Import Packages &amp; Bundles</h3>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Upload a JSON file or paste exported package data to import into your browser storage and database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* File Upload Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label">Upload JSON File (.json)</label>
              <input
                type="file"
                accept=".json,application/json"
                className="form-input"
                style={{ fontSize: '0.85rem' }}
                onChange={handleImportFileUpload}
              />
            </div>

            {/* Raw JSON Paste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label">Or Paste JSON Data Directly:</label>
              <textarea
                rows={5}
                placeholder='[ { "name": "3-Month SEO Package", "code": "PKG-SEO", "package_price": 49999, "items": [...] } ]'
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                value={importJsonText}
                onChange={(e) => handleImportJsonTextChange(e.target.value)}
              />
            </div>

            {/* Error message */}
            {importError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '0.82rem' }}>
                {importError}
              </div>
            )}

            {/* Preview of Validated Packages */}
            {importPreviewPackages.length > 0 && (
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Validated {importPreviewPackages.length} Package(s) Ready to Import:</span>
                  </span>
                </div>
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {importPreviewPackages.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name} ({p.code})</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{currencySymbol} {Number(p.package_price).toFixed(2)} ({p.items?.length || 0} items)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Destination Target */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label">Import Destination:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'both', label: 'Local Storage + Cloud DB (Recommended)' },
                  { id: 'local', label: 'Local Browser Storage Only (0ms Offline)' },
                  { id: 'db', label: 'Cloud Database Only' }
                ].map(t => (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: importTarget === t.id ? 'var(--bg-tertiary)' : 'transparent',
                      border: `1px solid ${importTarget === t.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="importTarget"
                      checked={importTarget === t.id}
                      onChange={() => setImportTarget(t.id as any)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setImportModalOpen(false)}
                disabled={isExecutingImport}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isExecutingImport || importPreviewPackages.length === 0}
                onClick={handleExecuteImport}
              >
                {isExecutingImport ? 'Importing Packages...' : `Import ${importPreviewPackages.length} Package(s)`}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Catalog;
