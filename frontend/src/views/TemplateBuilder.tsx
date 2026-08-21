import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Save, Rocket, Palette, Plus, Trash2, Layers, Type, Square, Circle,
  Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
  BringToFront, SendToBack, Move, Copy, Sliders, Settings as SettingsIcon, CheckCircle2, ShieldAlert,
  Download, FileCode, Image as ImageIcon, Sparkles, Database, Upload, RefreshCw, X
} from 'lucide-react';

interface InvoiceBlock {
  id: string;
  type: 'header' | 'billing' | 'table' | 'totals' | 'notes' | 'signature';
  title?: string;
  showLogo?: boolean;
  active: boolean;
}

interface VisualElement {
  id: string;
  type: 'text' | 'shape' | 'line' | 'image';
  // Position & Size (relative to 595x842 canvas)
  x: number;
  y: number;
  width: number;
  height: number;
  // Content
  content?: string;
  imageUrl?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  // Text Styles
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
  textDecoration?: 'none' | 'underline';
  textColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  padding?: number;
  // Shape & Image Styles
  shapeType?: 'rect' | 'circle';
  fillColor?: string;
  fillOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Generic
  zIndex: number;
  locked?: boolean;
}

interface TemplateConfig {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  footerText: string;
  blocks: InvoiceBlock[];
  // Page Margins
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  bgGradientEnabled: boolean;
  bgGradientStart: string;
  bgGradientEnd: string;
  // Freeform layout elements
  elements: VisualElement[];
}

export const TemplateBuilder: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [templateName, setTemplateName] = useState('My Premium Enterprise Invoice');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [config, setConfig] = useState<TemplateConfig>({
    primaryColor: '#6366f1',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    footerText: 'Thank you for your business! Generated via BillingFlow Enterprise Platform.',
    blocks: [
      { id: 'block_header', type: 'header', title: 'INVOICE', showLogo: true, active: true },
      { id: 'block_billing', type: 'billing', active: true },
      { id: 'block_table', type: 'table', active: true },
      { id: 'block_totals', type: 'totals', active: true },
      { id: 'block_notes', type: 'notes', title: 'Notes & Terms:', active: true },
      { id: 'block_signature', type: 'signature', active: true }
    ],
    marginTop: 45,
    marginBottom: 45,
    marginLeft: 45,
    marginRight: 45,
    bgGradientEnabled: false,
    bgGradientStart: '#ffffff',
    bgGradientEnd: '#f8fafc',
    elements: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Tool Panel
  const [activeTab, setActiveTab] = useState<'layout' | 'layers' | 'json'>('layout');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');

  // Dragging and Resizing ref/states
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Preset corporate color palettes
  const colorPresets = [
    { name: 'Indigo Corporate', primary: '#6366f1', text: '#1f2937', bg: '#ffffff' },
    { name: 'Emerald Finance', primary: '#10b981', text: '#064e3b', bg: '#ffffff' },
    { name: 'Slate Executive', primary: '#3b82f6', text: '#0f172a', bg: '#f8fafc' },
    { name: 'Crimson Luxury', primary: '#dc2626', text: '#171717', bg: '#ffffff' },
    { name: 'Golden Royalty', primary: '#b45309', text: '#451a03', bg: '#fffdfa' },
    { name: 'Cyan Ocean', primary: '#06b6d4', text: '#164e63', bg: '#ffffff' },
    { name: 'Rose Gold', primary: '#e11d48', text: '#4c0519', bg: '#ffffff' }
  ];

  // Font family options
  const fontFamilyOptions = [
    { label: 'Inter (Modern Sans)', value: 'Inter' },
    { label: 'Outfit (Geometric)', value: 'Outfit' },
    { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
    { label: 'Helvetica / Standard', value: 'Helvetica' },
    { label: 'Playfair Display (Serif)', value: 'Playfair Display' },
    { label: 'Roboto (Clean)', value: 'Roboto' },
    { label: 'Courier Prime (Mono)', value: 'Courier Prime' },
    { label: 'Cinzel (Luxury)', value: 'Cinzel' }
  ];

  // Fetch template data if editing
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      try {
        const data = await apiFetch(`/api/organization/templates/${id}`);
        setTemplateName(data.name);
        setStatus(data.status);
        
        const parsed = JSON.parse(data.config);
        setConfig({
          primaryColor: parsed.primaryColor || '#6366f1',
          textColor: parsed.textColor || '#1f2937',
          backgroundColor: parsed.backgroundColor || '#ffffff',
          fontFamily: parsed.fontFamily || 'Inter',
          footerText: parsed.footerText || 'Thank you for your business! Generated via BillingFlow Enterprise Platform.',
          blocks: parsed.blocks || [],
          marginTop: parsed.marginTop ?? 45,
          marginBottom: parsed.marginBottom ?? 45,
          marginLeft: parsed.marginLeft ?? 45,
          marginRight: parsed.marginRight ?? 45,
          bgGradientEnabled: parsed.bgGradientEnabled ?? false,
          bgGradientStart: parsed.bgGradientStart || '#ffffff',
          bgGradientEnd: parsed.bgGradientEnd || '#f8fafc',
          elements: parsed.elements || []
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load template layout data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  // Save template layout to DB (MongoDB Atlas / PostgreSQL)
  const handleSave = async (saveStatus: 'draft' | 'published') => {
    setIsSaving(true);
    setSuccess(null);
    setError(null);

    const payload = {
      name: templateName,
      config: JSON.stringify(config)
    };

    try {
      if (id) {
        await apiFetch(`/api/organization/templates/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (saveStatus !== status) {
          await apiFetch(`/api/organization/templates/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: saveStatus })
          });
          setStatus(saveStatus);
        }
        setSuccess(`Template schema saved as ${saveStatus}!`);
      } else {
        const res = await apiFetch('/api/organization/templates', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (saveStatus === 'published') {
          await apiFetch(`/api/organization/templates/${res.id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'published' })
          });
        }
        navigate(`/settings/design`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save template layout.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON Schema
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${templateName.toLowerCase().replace(/\s+/g, '_')}_schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccess("Exported layout schema JSON file!");
  };

  // Import JSON Schema
  const handleImportJsonSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON structure.');
      setConfig({
        primaryColor: parsed.primaryColor || '#6366f1',
        textColor: parsed.textColor || '#1f2937',
        backgroundColor: parsed.backgroundColor || '#ffffff',
        fontFamily: parsed.fontFamily || 'Inter',
        footerText: parsed.footerText || 'Thank you for your business!',
        blocks: parsed.blocks || [],
        marginTop: parsed.marginTop ?? 45,
        marginBottom: parsed.marginBottom ?? 45,
        marginLeft: parsed.marginLeft ?? 45,
        marginRight: parsed.marginRight ?? 45,
        bgGradientEnabled: parsed.bgGradientEnabled ?? false,
        bgGradientStart: parsed.bgGradientStart || '#ffffff',
        bgGradientEnd: parsed.bgGradientEnd || '#f8fafc',
        elements: parsed.elements || []
      });
      setSuccess('Successfully imported template schema JSON!');
      setShowJsonModal(false);
      setJsonInputText('');
    } catch (err: any) {
      setError('Failed to import JSON: ' + err.message);
    }
  };

  // Standard blocks reordering / properties
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...config.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setConfig({ ...config, blocks: newBlocks });
  };

  const toggleBlockActive = (blockId: string) => {
    const newBlocks = config.blocks.map(b =>
      b.id === blockId ? { ...b, active: !b.active } : b
    );
    setConfig({ ...config, blocks: newBlocks });
  };

  // --- Canvas Elements Management ---
  const addTextElement = () => {
    const maxZ = config.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newEl: VisualElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 50,
      y: 500,
      width: 260,
      height: 60,
      content: 'Custom terms, conditions or payment guidelines text block.',
      fontSize: 9,
      fontFamily: config.fontFamily,
      fontStyle: 'normal',
      textColor: config.textColor,
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.4,
      textTransform: 'none',
      padding: 0,
      zIndex: maxZ + 1
    };
    setConfig({ ...config, elements: [...config.elements, newEl] });
    setSelectedElementId(newEl.id);
  };

  const addImageElement = (url?: string) => {
    const maxZ = config.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newEl: VisualElement = {
      id: `image_${Date.now()}`,
      type: 'image',
      x: 50,
      y: 45,
      width: 140,
      height: 50,
      imageUrl: url || 'https://uklrlkpkmuxnvkmpxyzg.supabase.co/storage/v1/object/public/billingflow-logos/organization_logos/placeholder.png',
      objectFit: 'contain',
      borderRadius: 4,
      zIndex: maxZ + 1
    };
    setConfig({ ...config, elements: [...config.elements, newEl] });
    setSelectedElementId(newEl.id);
  };

  const addShapeElement = (shapeType: 'rect' | 'circle') => {
    const maxZ = config.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newEl: VisualElement = {
      id: `shape_${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 50,
      y: 420,
      width: 130,
      height: 75,
      fillColor: config.primaryColor,
      fillOpacity: 0.12,
      borderColor: config.primaryColor,
      borderWidth: 1.5,
      borderRadius: shapeType === 'rect' ? 6 : 999,
      zIndex: maxZ + 1
    };
    setConfig({ ...config, elements: [...config.elements, newEl] });
    setSelectedElementId(newEl.id);
  };

  const addLineElement = () => {
    const maxZ = config.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newEl: VisualElement = {
      id: `line_${Date.now()}`,
      type: 'line',
      x: 50,
      y: 460,
      width: 495,
      height: 2,
      borderColor: config.primaryColor,
      borderWidth: 1.5,
      zIndex: maxZ + 1
    };
    setConfig({ ...config, elements: [...config.elements, newEl] });
    setSelectedElementId(newEl.id);
  };

  const duplicateSelected = () => {
    if (!selectedElementId) return;
    const target = config.elements.find(el => el.id === selectedElementId);
    if (!target) return;

    const maxZ = config.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const dup: VisualElement = {
      ...target,
      id: `${target.type}_${Date.now()}`,
      x: Math.min(480, target.x + 15),
      y: Math.min(780, target.y + 15),
      zIndex: maxZ + 1
    };
    setConfig({ ...config, elements: [...config.elements, dup] });
    setSelectedElementId(dup.id);
  };

  const deleteSelected = () => {
    if (!selectedElementId) return;
    setConfig({
      ...config,
      elements: config.elements.filter(el => el.id !== selectedElementId)
    });
    setSelectedElementId(null);
  };

  const updateSelectedElement = (props: Partial<VisualElement>) => {
    if (!selectedElementId) return;
    setConfig({
      ...config,
      elements: config.elements.map(el =>
        el.id === selectedElementId ? { ...el, ...props } : el
      )
    });
  };

  // --- Element Alignment Controls ---
  const alignElement = (dir: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElementId) return;
    const el = config.elements.find(e => e.id === selectedElementId);
    if (!el) return;

    const canvasW = 595;
    const canvasH = 842;

    let updates: Partial<VisualElement> = {};
    switch (dir) {
      case 'left':
        updates.x = config.marginLeft;
        break;
      case 'center':
        updates.x = Math.round((canvasW - el.width) / 2);
        break;
      case 'right':
        updates.x = canvasW - config.marginRight - el.width;
        break;
      case 'top':
        updates.y = config.marginTop;
        break;
      case 'middle':
        updates.y = Math.round((canvasH - el.height) / 2);
        break;
      case 'bottom':
        updates.y = canvasH - config.marginBottom - el.height;
        break;
    }
    updateSelectedElement(updates);
  };

  // --- Mouse Handlers for Drag & Resize ---
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElementId(null);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    const target = config.elements.find(el => el.id === elementId);
    if (!target || target.locked) return;

    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: target.x, y: target.y, w: target.width, h: target.height };
  };

  const handleHandleMouseDown = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    if (!selectedElementId) return;
    const target = config.elements.find(el => el.id === selectedElementId);
    if (!target) return;

    setIsResizing(dir);
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: target.x, y: target.y, w: target.width, h: target.height };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedElementId) return;

      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      if (isDragging) {
        let newX = Math.round(elementStartPos.current.x + deltaX);
        let newY = Math.round(elementStartPos.current.y + deltaY);
        newX = Math.max(0, Math.min(595 - elementStartPos.current.w, newX));
        newY = Math.max(0, Math.min(842 - elementStartPos.current.h, newY));

        updateSelectedElement({ x: newX, y: newY });
      }

      if (isResizing) {
        let newW = elementStartPos.current.w;
        let newH = elementStartPos.current.h;
        let newX = elementStartPos.current.x;
        let newY = elementStartPos.current.y;

        if (isResizing.includes('e')) {
          newW = Math.max(10, Math.round(elementStartPos.current.w + deltaX));
        }
        if (isResizing.includes('s')) {
          newH = Math.max(5, Math.round(elementStartPos.current.h + deltaY));
        }
        if (isResizing.includes('w')) {
          const maxDelta = elementStartPos.current.w - 10;
          const actualDelta = Math.min(maxDelta, deltaX);
          newW = Math.round(elementStartPos.current.w - actualDelta);
          newX = Math.round(elementStartPos.current.x + actualDelta);
        }
        if (isResizing.includes('n')) {
          const maxDelta = elementStartPos.current.h - 5;
          const actualDelta = Math.min(maxDelta, deltaY);
          newH = Math.round(elementStartPos.current.h - actualDelta);
          newY = Math.round(elementStartPos.current.y + actualDelta);
        }

        updateSelectedElement({ x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedElementId]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090d' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="spinner" />
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading canvas layout studio...</span>
        </div>
      </div>
    );
  }

  const selectedElement = config.elements.find(el => el.id === selectedElementId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* Builder Header Bar */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
        zIndex: 20, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/settings/design')}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px' }}
          >
            <ArrowLeft size={16} /><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Exit Studio</span>
          </button>
          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }} />
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{
              background: 'transparent', border: 'none', fontSize: '0.95rem', fontWeight: 700,
              color: 'var(--text-primary)', width: '240px', borderBottom: '1px solid transparent', padding: '2px'
            }}
            placeholder="Template Name"
            onFocus={(e) => e.target.style.borderBottomColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
          />
          <span className="badge badge-info" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Database size={10} /> MongoDB Atlas Ready
          </span>
        </div>

        {/* Status Messages */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {success && (
            <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.78rem', background: 'rgba(16,185,129,0.06)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.1)' }}>
              <CheckCircle2 size={12} /><span>{success}</span>
            </div>
          )}
          {error && (
            <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '0.78rem', background: 'rgba(225,29,72,0.06)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(225,29,72,0.1)' }}>
              <ShieldAlert size={12} /><span>{error}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExportJson}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.78rem' }}
            title="Download Template Layout Schema JSON"
          >
            <Download size={14} /><span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.78rem' }}
            title="Import Custom JSON Schema"
          >
            <FileCode size={14} /><span>Import JSON</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <Save size={14} /><span>Save Draft</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('published')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <Rocket size={14} /><span>Publish</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL: Sections, Blocks, Layers */}
        <aside style={{
          width: '280px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', flexShrink: 0
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('layout')}
              style={{
                flex: 1, padding: '12px', background: 'none', border: 'none',
                color: activeTab === 'layout' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'layout' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Document Blocks
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              style={{
                flex: 1, padding: '12px', background: 'none', border: 'none',
                color: activeTab === 'layers' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'layers' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Layers ({config.elements.length})
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeTab === 'layout' && (
              <>
                {/* Standard Sections */}
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Standard Invoice Blocks</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {config.blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        style={{
                          background: block.active ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-tertiary)',
                          border: block.active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={block.active}
                            onChange={() => toggleBlockActive(block.id)}
                            style={{ cursor: 'pointer', width: '13px', height: '13px', accentColor: 'var(--primary)' }}
                          />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', color: block.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {block.type}
                          </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <button
                            disabled={idx === 0}
                            onClick={() => moveBlock(idx, 'up')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-secondary)' }}
                          >
                            <ArrowLeft size={12} style={{ transform: 'rotate(90deg)' }} />
                          </button>
                          <button
                            disabled={idx === config.blocks.length - 1}
                            onClick={() => moveBlock(idx, 'down')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-secondary)' }}
                          >
                            <ArrowLeft size={12} style={{ transform: 'rotate(-90deg)' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Freeform Canvas Elements */}
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Insert Freeform Elements</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={addTextElement} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Type size={12} /><span>Text Block</span>
                    </button>
                    <button onClick={() => addImageElement()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <ImageIcon size={12} /><span>Logo / Graphic</span>
                    </button>
                    <button onClick={addLineElement} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Minus size={12} /><span>Divider Line</span>
                    </button>
                    <button onClick={() => addShapeElement('rect')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Square size={12} /><span>Rectangle</span>
                    </button>
                    <button onClick={() => addShapeElement('circle')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Circle size={12} /><span>Circle Badge</span>
                    </button>
                  </div>
                </div>

                {/* Corporate Theme Presets */}
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Color Palette Swatches</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setConfig({
                          ...config,
                          primaryColor: preset.primary,
                          textColor: preset.text,
                          backgroundColor: preset.bg
                        })}
                        style={{
                          background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{preset.name}</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.primary }} />
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.text }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Canvas Layers</span>
                {config.elements.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>No freeform canvas elements added yet.</p>
                ) : (
                  [...config.elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      style={{
                        background: selectedElementId === el.id ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-tertiary)',
                        border: selectedElementId === el.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        {el.type === 'text' ? <Type size={12} color="var(--primary)" /> : el.type === 'image' ? <ImageIcon size={12} color="var(--accent)" /> : el.type === 'line' ? <Minus size={12} /> : el.shapeType === 'circle' ? <Circle size={12} /> : <Square size={12} />}
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                          {el.type === 'text' ? (el.content || 'Text') : el.type === 'image' ? 'Logo Graphic' : `${el.shapeType || el.type}`}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>z-{el.zIndex}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER PANEL: Interactive Canvas Workspace */}
        <main style={{
          flex: 1, background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start', overflowY: 'auto', padding: '32px', position: 'relative'
        }}>

          {/* Guidelines info */}
          <div style={{ position: 'absolute', top: '10px', left: '16px', display: 'flex', gap: '14px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>Standard A4 Canvas (595 × 842 px)</span>
            <span>•</span>
            <span>Drag items to reposition</span>
            <span>•</span>
            <span>Drag handles to resize logos &amp; blocks</span>
          </div>

          {/* A4 Sheet Canvas */}
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            style={{
              width: '595px', minHeight: '842px', height: '842px',
              background: config.bgGradientEnabled ? `linear-gradient(135deg, ${config.bgGradientStart}, ${config.bgGradientEnd})` : config.backgroundColor,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)', borderRadius: '2px', position: 'relative',
              color: config.textColor,
              fontFamily: config.fontFamily || 'Inter, sans-serif',
              boxSizing: 'border-box', overflow: 'hidden'
            }}
          >

            {/* Render standard layout blocks in page margin bounds */}
            <div style={{
              paddingTop: `${config.marginTop}px`,
              paddingBottom: `${config.marginBottom}px`,
              paddingLeft: `${config.marginLeft}px`,
              paddingRight: `${config.marginRight}px`,
              display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', boxSizing: 'border-box'
            }}>
              {config.blocks.filter(b => b.active).map((block) => {
                switch (block.type) {
                  case 'header':
                    return (
                      <div key={block.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {block.showLogo && (
                            <div style={{ width: '36px', height: '36px', background: config.primaryColor, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '9px', fontWeight: 800 }}>LOGO</div>
                          )}
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: config.primaryColor, margin: 0 }}>ACME ENTERPRISE</h3>
                            <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Global Solutions &amp; Billing</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: config.textColor, margin: 0 }}>{block.title || 'INVOICE'}</h2>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>INV-2026-8801 | Date: 2026-08-21</span>
                        </div>
                      </div>
                    );

                  case 'billing':
                    return (
                      <div key={block.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', lineHeight: '1.5' }}>
                        <div>
                          <strong style={{ color: 'var(--text-muted)', fontSize: '0.6rem', display: 'block', marginBottom: '2px' }}>BILLED FROM:</strong>
                          <strong style={{ color: config.textColor }}>Acme Corporation LLC</strong>
                          <div style={{ color: '#4b5563', marginTop: '1px' }}>100 Enterprise Boulevard, Suite 500<br />San Francisco, CA 94107</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: 'var(--text-muted)', fontSize: '0.6rem', display: 'block', marginBottom: '2px' }}>BILLED TO:</strong>
                          <strong style={{ color: config.textColor }}>Global Tech Partners</strong>
                          <div style={{ color: '#4b5563', marginTop: '1px' }}>450 Innovation Parkway, Floor 12<br />Austin, TX 78701</div>
                        </div>
                      </div>
                    );

                  case 'table':
                    return (
                      <div key={block.id} style={{ fontSize: '0.72rem' }}>
                        <div style={{ background: config.primaryColor, color: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderRadius: '4px' }}>
                          <span style={{ width: '60%' }}>ITEM DESCRIPTION</span>
                          <span style={{ width: '10%', textAlign: 'right' }}>QTY</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>UNIT PRICE</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>AMOUNT</span>
                        </div>
                        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ width: '60%' }}>Enterprise Architecture &amp; Cloud Integration</span>
                          <span style={{ width: '10%', textAlign: 'right' }}>12</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>$185.00</span>
                          <span style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>$2,220.00</span>
                        </div>
                        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', background: 'rgba(0,0,0,0.01)' }}>
                          <span style={{ width: '60%' }}>MongoDB Atlas Cluster Schema Setup</span>
                          <span style={{ width: '10%', textAlign: 'right' }}>1</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>$650.00</span>
                          <span style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>$650.00</span>
                        </div>
                      </div>
                    );

                  case 'totals':
                    return (
                      <div key={block.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', fontSize: '0.72rem' }}>
                        <div style={{ display: 'flex', width: '170px', justifyContent: 'space-between', color: '#4b5563' }}>
                          <span>Subtotal:</span><span>$2,870.00</span>
                        </div>
                        <div style={{ display: 'flex', width: '170px', justifyContent: 'space-between', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                          <span>Tax (10%):</span><span>$287.00</span>
                        </div>
                        <div style={{ display: 'flex', width: '170px', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem', color: config.primaryColor }}>
                          <span>Total Due:</span><span>$3,157.00</span>
                        </div>
                      </div>
                    );

                  case 'notes':
                    return (
                      <div key={block.id} style={{ fontSize: '0.68rem', color: '#4b5563', maxWidth: '260px' }}>
                        <strong style={{ display: 'block', marginBottom: '2px', color: config.textColor }}>{block.title || 'Notes / Terms:'}</strong>
                        <div>Net-30 days billing cycle. Electronic funds transfer to Account #8820-EX.</div>
                      </div>
                    );

                  case 'signature':
                    return (
                      <div key={block.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', fontSize: '0.65rem' }}>
                        <div style={{ fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontSize: '1rem', color: config.primaryColor, paddingRight: '15px' }}>Acme Executive</div>
                        <div style={{ width: '120px', height: '1px', background: config.textColor }} />
                        <span style={{ fontWeight: 'bold' }}>AUTHORIZED SIGNATURE</span>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>

            {/* Render Freeform Layer elements anywhere on canvas */}
            {config.elements.map((el) => {
              const isSelected = selectedElementId === el.id;

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    zIndex: el.zIndex,
                    cursor: el.locked ? 'not-allowed' : 'move',
                    border: isSelected ? '1.5px solid var(--primary)' : '1.5px dashed transparent',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Text Mode */}
                  {el.type === 'text' && (
                    <div
                      style={{
                        width: '100%', height: '100%', fontSize: `${el.fontSize || 9}px`,
                        color: el.textColor || config.textColor,
                        fontFamily: el.fontFamily || config.fontFamily,
                        fontWeight: el.fontStyle?.includes('bold') ? 'bold' : 'normal',
                        fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal',
                        textDecoration: el.textDecoration || 'none',
                        textAlign: el.alignment || 'left',
                        letterSpacing: `${el.letterSpacing || 0}px`,
                        lineHeight: el.lineHeight || 1.4,
                        textTransform: el.textTransform || 'none',
                        padding: `${el.padding || 0}px`,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden'
                      }}
                    >
                      {el.content}
                    </div>
                  )}

                  {/* Image / Logo Mode */}
                  {el.type === 'image' && (
                    <div
                      style={{
                        width: '100%', height: '100%',
                        borderRadius: `${el.borderRadius || 0}px`,
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                      }}
                    >
                      <img
                        src={el.imageUrl || 'https://uklrlkpkmuxnvkmpxyzg.supabase.co/storage/v1/object/public/billingflow-logos/organization_logos/placeholder.png'}
                        alt="Logo Graphic"
                        style={{
                          width: '100%', height: '100%',
                          objectFit: el.objectFit || 'contain',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Shape Mode */}
                  {el.type === 'shape' && (
                    <div
                      style={{
                        width: '100%', height: '100%',
                        backgroundColor: el.fillColor || config.primaryColor,
                        opacity: el.fillOpacity ?? 0.2,
                        border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || config.primaryColor}` : 'none',
                        borderRadius: el.shapeType === 'circle' ? '999px' : `${el.borderRadius || 0}px`,
                        boxSizing: 'border-box'
                      }}
                    />
                  )}

                  {/* Line Mode */}
                  {el.type === 'line' && (
                    <div
                      style={{
                        width: '100%', height: '100%',
                        borderBottom: `${el.borderWidth || 1.5}px solid ${el.borderColor || config.primaryColor}`
                      }}
                    />
                  )}

                  {/* Selection handles (anchors for drag resizing) */}
                  {isSelected && !el.locked && (
                    <>
                      <div onMouseDown={(e) => handleHandleMouseDown(e, 'nw')} style={{ position: 'absolute', top: '-4px', left: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--primary)', cursor: 'nwse-resize', zIndex: 100 }} />
                      <div onMouseDown={(e) => handleHandleMouseDown(e, 'ne')} style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--primary)', cursor: 'nesw-resize', zIndex: 100 }} />
                      <div onMouseDown={(e) => handleHandleMouseDown(e, 'se')} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--primary)', cursor: 'nwse-resize', zIndex: 100 }} />
                      <div onMouseDown={(e) => handleHandleMouseDown(e, 'sw')} style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--primary)', cursor: 'nesw-resize', zIndex: 100 }} />
                      {el.type !== 'line' && (
                        <>
                          <div onMouseDown={(e) => handleHandleMouseDown(e, 'e')} style={{ position: 'absolute', top: 'calc(50% - 4px)', right: '-4px', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--primary)', cursor: 'ew-resize', zIndex: 100 }} />
                          <div onMouseDown={(e) => handleHandleMouseDown(e, 's')} style={{ position: 'absolute', bottom: '-4px', left: 'calc(50% - 4px)', width: '8px', height: '8px', background: '#fff', border: '1.5px solid var(--primary)', cursor: 'ns-resize', zIndex: 100 }} />
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Static footer message */}
            <div style={{ position: 'absolute', bottom: '18px', left: 0, right: 0, fontSize: '0.6rem', color: '#9ca3af', textAlign: 'center', pointerEvents: 'none' }}>
              {config.footerText}
            </div>

          </div>
        </main>

        {/* RIGHT PANEL: Inspector Controls */}
        <aside style={{
          width: '320px', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', padding: '20px', gap: '22px'
        }}>

          {/* Conditional properties rendering */}
          {selectedElement ? (
            // ================= SELECTED ELEMENT SETTINGS =================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} color="var(--primary)" />
                  <span>Element Properties</span>
                </h4>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={duplicateSelected} title="Duplicate" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                    <Copy size={12} />
                  </button>
                  <button onClick={deleteSelected} title="Delete" className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Align relative to Canvas */}
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Align to Canvas</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                  <button onClick={() => alignElement('left')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Left">L</button>
                  <button onClick={() => alignElement('center')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Center Horizontally">C</button>
                  <button onClick={() => alignElement('right')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Right">R</button>
                  <button onClick={() => alignElement('top')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Top">T</button>
                  <button onClick={() => alignElement('middle')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Center Vertically">M</button>
                  <button onClick={() => alignElement('bottom')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Bottom">B</button>
                </div>
              </div>

              {/* IMAGE ELEMENT CONTROLS */}
              {selectedElement.type === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Logo / Graphic URL</label>
                    <input
                      type="text"
                      value={selectedElement.imageUrl || ''}
                      onChange={(e) => updateSelectedElement({ imageUrl: e.target.value })}
                      className="input"
                      style={{ fontSize: '0.75rem' }}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Object Fit</label>
                    <select
                      value={selectedElement.objectFit || 'contain'}
                      onChange={(e) => updateSelectedElement({ objectFit: e.target.value as any })}
                      className="input"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <option value="contain">Contain (Keep aspect)</option>
                      <option value="cover">Cover (Fill bounds)</option>
                      <option value="fill">Fill (Stretch)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TEXT ELEMENT CONTROLS */}
              {selectedElement.type === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Text Content</label>
                    <textarea
                      value={selectedElement.content || ''}
                      onChange={(e) => updateSelectedElement({ content: e.target.value })}
                      className="input"
                      rows={3}
                      style={{ fontSize: '0.75rem', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Font Family</label>
                    <select
                      value={selectedElement.fontFamily || config.fontFamily}
                      onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                      className="input"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {fontFamilyOptions.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Font Size ({selectedElement.fontSize || 9}px)</label>
                      <input
                        type="range"
                        min={6}
                        max={48}
                        value={selectedElement.fontSize || 9}
                        onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Letter Spacing ({selectedElement.letterSpacing || 0}px)</label>
                      <input
                        type="range"
                        min={-1}
                        max={8}
                        step={0.5}
                        value={selectedElement.letterSpacing || 0}
                        onChange={(e) => updateSelectedElement({ letterSpacing: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                      />
                    </div>
                  </div>

                  {/* Alignment Buttons */}
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Text Alignment</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      <button onClick={() => updateSelectedElement({ alignment: 'left' })} className="btn btn-secondary" style={{ padding: '6px' }}><AlignLeft size={12} /></button>
                      <button onClick={() => updateSelectedElement({ alignment: 'center' })} className="btn btn-secondary" style={{ padding: '6px' }}><AlignCenter size={12} /></button>
                      <button onClick={() => updateSelectedElement({ alignment: 'right' })} className="btn btn-secondary" style={{ padding: '6px' }}><AlignRight size={12} /></button>
                      <button onClick={() => updateSelectedElement({ alignment: 'justify' })} className="btn btn-secondary" style={{ padding: '6px' }}><AlignJustify size={12} /></button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Text Color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={selectedElement.textColor || config.textColor}
                        onChange={(e) => updateSelectedElement({ textColor: e.target.value })}
                        style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={selectedElement.textColor || config.textColor}
                        onChange={(e) => updateSelectedElement({ textColor: e.target.value })}
                        className="input"
                        style={{ fontSize: '0.75rem', flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dimensions Input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Width (px)</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                    className="input"
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Height (px)</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })}
                    className="input"
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // ================= GLOBAL TEMPLATE CONFIGURATION =================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={14} color="var(--primary)" />
                <span>Global Styles &amp; Theme</span>
              </h4>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Primary Theme Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="input"
                    style={{ fontSize: '0.75rem', flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Default Font Family</label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                  className="input"
                  style={{ fontSize: '0.75rem' }}
                >
                  {fontFamilyOptions.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Footer Disclaimer Text</label>
                <textarea
                  value={config.footerText}
                  onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                  className="input"
                  rows={3}
                  style={{ fontSize: '0.75rem', fontFamily: 'inherit' }}
                />
              </div>

              {/* Margin Controls */}
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Page Margins (px)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Top ({config.marginTop}px)</label>
                    <input type="range" min={20} max={100} value={config.marginTop} onChange={(e) => setConfig({ ...config, marginTop: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Side ({config.marginLeft}px)</label>
                    <input type="range" min={20} max={100} value={config.marginLeft} onChange={(e) => setConfig({ ...config, marginLeft: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* JSON Schema Import Modal */}
      {showJsonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '540px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={18} color="var(--primary)" /><span>Import Layout Schema (JSON / MongoDB)</span>
              </h3>
              <button onClick={() => setShowJsonModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Paste any custom template layout JSON object below to load it into the canvas workspace. Compatible with MongoDB Atlas JSON document collections.
            </p>
            <textarea
              value={jsonInputText}
              onChange={(e) => setJsonInputText(e.target.value)}
              className="input"
              rows={10}
              placeholder={`{\n  "primaryColor": "#6366f1",\n  "fontFamily": "Inter",\n  "elements": [...]\n}`}
              style={{ fontFamily: 'Courier Prime, monospace', fontSize: '0.75rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowJsonModal(false)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Cancel</button>
              <button onClick={handleImportJsonSubmit} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Apply JSON Schema</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
