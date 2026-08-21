import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Save, Rocket, Palette, Plus, Trash2, Layers, Type, Square, Circle,
  Minus, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  BringToFront, SendToBack, Move, Copy, Sliders, Settings as SettingsIcon, CheckCircle2, ShieldAlert
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
  type: 'text' | 'shape' | 'line';
  // Position & Size (pixels/percentage relative to 595x842 canvas)
  x: number;
  y: number;
  width: number;
  height: number;
  // Content for text
  content?: string;
  // Text Styles
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
  textDecoration?: 'none' | 'underline';
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
  padding?: number;
  // Shape Styles
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
  fontFamily: 'Helvetica' | 'Courier' | 'Times-Roman';
  footerText: string;
  blocks: InvoiceBlock[];
  // Page Styles
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

  const [templateName, setTemplateName] = useState('My Premium Custom Invoice');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [config, setConfig] = useState<TemplateConfig>({
    primaryColor: '#6366f1',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    footerText: 'Thank you for your business! Generated via BillingFlow.',
    blocks: [
      { id: 'block_header', type: 'header', title: 'INVOICE', showLogo: true, active: true },
      { id: 'block_billing', type: 'billing', active: true },
      { id: 'block_table', type: 'table', active: true },
      { id: 'block_totals', type: 'totals', active: true },
      { id: 'block_notes', type: 'notes', title: 'Notes & Payment Terms:', active: true },
      { id: 'block_signature', type: 'signature', active: true }
    ],
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 50,
    marginRight: 50,
    bgGradientEnabled: false,
    bgGradientStart: '#ffffff',
    bgGradientEnd: '#f3f4f6',
    elements: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Tool Panel
  const [activeTab, setActiveTab] = useState<'layout' | 'layers'>('layout');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Dragging and Resizing ref/states
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw' | 'ne' | 'se' | 'sw' | 'e' | 's' etc.
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Preset color palettes
  const colorPresets = [
    { name: 'Indigo Dream', primary: '#6366f1', text: '#1f2937', bg: '#ffffff' },
    { name: 'Charcoal Minimal', primary: '#1f2937', text: '#1f2937', bg: '#f9fafb' },
    { name: 'Warm Retro', primary: '#dc2626', text: '#171717', bg: '#faf6f0' },
    { name: 'Deep Teal', primary: '#0d9488', text: '#1f2937', bg: '#ffffff' },
    { name: 'Royal Navy', primary: '#1e3a8a', text: '#111827', bg: '#ffffff' }
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
        // Fallback for older configurations without new layout properties
        setConfig({
          primaryColor: parsed.primaryColor || '#6366f1',
          textColor: parsed.textColor || '#1f2937',
          backgroundColor: parsed.backgroundColor || '#ffffff',
          fontFamily: parsed.fontFamily || 'Helvetica',
          footerText: parsed.footerText || 'Thank you for your business! Generated via BillingFlow.',
          blocks: parsed.blocks || [],
          marginTop: parsed.marginTop ?? 50,
          marginBottom: parsed.marginBottom ?? 50,
          marginLeft: parsed.marginLeft ?? 50,
          marginRight: parsed.marginRight ?? 50,
          bgGradientEnabled: parsed.bgGradientEnabled ?? false,
          bgGradientStart: parsed.bgGradientStart || '#ffffff',
          bgGradientEnd: parsed.bgGradientEnd || '#f3f4f6',
          elements: parsed.elements || []
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load template data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  // Save template layout
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
        setSuccess(`Template layout updated and saved as ${saveStatus}!`);
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

  const updateBlockProps = (blockId: string, props: Partial<InvoiceBlock>) => {
    const newBlocks = config.blocks.map(b =>
      b.id === blockId ? { ...b, ...props } : b
    );
    setConfig({ ...config, blocks: newBlocks });
  };

  // --- Freeform Elements Management ---
  const addTextElement = () => {
    const maxZ = config.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newEl: VisualElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 60,
      y: 500,
      width: 250,
      height: 60,
      content: 'Double click to edit terms and custom conditions.',
      fontSize: 9,
      fontStyle: 'normal',
      textColor: config.textColor,
      alignment: 'left',
      padding: 0,
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
      x: 60,
      y: 400,
      width: 120,
      height: 80,
      fillColor: config.primaryColor,
      fillOpacity: 0.15,
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
      x: 60,
      y: 450,
      width: 475,
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
      x: Math.min(500, target.x + 15),
      y: Math.min(800, target.y + 15),
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

  // --- Element Layering Control ---
  const sendToLayer = (action: 'front' | 'back' | 'up' | 'down') => {
    if (!selectedElementId) return;
    const target = config.elements.find(el => el.id === selectedElementId);
    if (!target) return;

    let elementsCopy = [...config.elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = elementsCopy.findIndex(el => el.id === selectedElementId);

    if (action === 'up' && idx < elementsCopy.length - 1) {
      const temp = elementsCopy[idx].zIndex;
      elementsCopy[idx].zIndex = elementsCopy[idx + 1].zIndex;
      elementsCopy[idx + 1].zIndex = temp;
    } else if (action === 'down' && idx > 0) {
      const temp = elementsCopy[idx].zIndex;
      elementsCopy[idx].zIndex = elementsCopy[idx - 1].zIndex;
      elementsCopy[idx - 1].zIndex = temp;
    } else if (action === 'front') {
      const maxZ = elementsCopy[elementsCopy.length - 1].zIndex;
      elementsCopy[idx].zIndex = maxZ + 1;
    } else if (action === 'back') {
      const minZ = elementsCopy[0].zIndex;
      elementsCopy[idx].zIndex = minZ - 1;
    }

    setConfig({ ...config, elements: elementsCopy });
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
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading canvas assets...</span>
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
            <ArrowLeft size={16} /><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Exit Editor</span>
          </button>
          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }} />
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{
              background: 'transparent', border: 'none', fontSize: '0.95rem', fontWeight: 700,
              color: 'var(--text-primary)', width: '220px', borderBottom: '1px solid transparent', padding: '2px'
            }}
            placeholder="Template Name"
            onFocus={(e) => e.target.style.borderBottomColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
          />
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

        <div style={{ display: 'flex', gap: '10px' }}>
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
              Document Layout
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

                {/* Add Custom Free Elements */}
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Insert Elements</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={addTextElement} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Type size={12} /><span>Text Block</span>
                    </button>
                    <button onClick={addLineElement} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Minus size={12} /><span>Dividing Line</span>
                    </button>
                    <button onClick={() => addShapeElement('rect')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Square size={12} /><span>Rectangle</span>
                    </button>
                    <button onClick={() => addShapeElement('circle')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.72rem', padding: '8px' }}>
                      <Circle size={12} /><span>Circle</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Canvas Layers Order</span>
                {config.elements.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>No custom canvas elements added yet.</p>
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
                        {el.type === 'text' ? <Type size={12} color="var(--primary)" /> : el.type === 'line' ? <Minus size={12} /> : el.shapeType === 'circle' ? <Circle size={12} /> : <Square size={12} />}
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                          {el.type === 'text' ? (el.content || 'Text') : `${el.shapeType || el.type}`}
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

        {/* CENTER PANEL: Canvas Workspace */}
        <main style={{
          flex: 1, background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start', overflowY: 'auto', padding: '32px', position: 'relative'
        }}>

          {/* Guidelines info */}
          <div style={{ position: 'absolute', top: '10px', left: '16px', display: 'flex', gap: '14px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>A4 Size (595 × 842 px)</span>
            <span>•</span>
            <span>Drag items to reposition</span>
            <span>•</span>
            <span>Click to style / edit</span>
          </div>

          {/* A4 Sheet Canvas */}
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            style={{
              width: '595px', minHeight: '842px', height: '842px',
              background: config.bgGradientEnabled ? `linear-gradient(135deg, ${config.bgGradientStart}, ${config.bgGradientEnd})` : config.backgroundColor,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)', borderRadius: '2px', position: 'relative',
              color: config.textColor,
              fontFamily: config.fontFamily === 'Courier' ? 'Courier New, monospace' : config.fontFamily === 'Times-Roman' ? 'Times New Roman, serif' : 'Arial, sans-serif',
              boxSizing: 'border-box', overflow: 'hidden'
            }}
          >

            {/* Render standard layout blocks in page margin bounds */}
            <div style={{
              paddingTop: `${config.marginTop}px`,
              paddingBottom: `${config.marginBottom}px`,
              paddingLeft: `${config.marginLeft}px`,
              paddingRight: `${config.marginRight}px`,
              display: 'flex', flexDirection: 'column', gap: '22px', height: '100%', boxSizing: 'border-box'
            }}>
              {config.blocks.filter(b => b.active).map((block) => {
                switch (block.type) {
                  case 'header':
                    return (
                      <div key={block.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {block.showLogo && (
                            <div style={{ width: '32px', height: '32px', background: config.primaryColor, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: 800 }}>LOGO</div>
                          )}
                          <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: config.primaryColor, margin: 0 }}>ACME CORP</h3>
                            <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Billed dispatch solutions</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: config.textColor, margin: 0 }}>{block.title || 'INVOICE'}</h2>
                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>INV-2026-001 | 2026-06-29</span>
                        </div>
                      </div>
                    );

                  case 'billing':
                    return (
                      <div key={block.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', lineHeight: '1.5' }}>
                        <div>
                          <strong style={{ color: 'var(--text-muted)', fontSize: '0.6rem', display: 'block', marginBottom: '2px' }}>BILLED FROM:</strong>
                          <strong>Acme Corporation LLC</strong>
                          <div style={{ color: '#4b5563', marginTop: '1px' }}>123 Enterprise Way, Suite 400<br />San Jose, CA 95110</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: 'var(--text-muted)', fontSize: '0.6rem', display: 'block', marginBottom: '2px' }}>BILLED TO:</strong>
                          <strong>John Doe Logistics</strong>
                          <div style={{ color: '#4b5563', marginTop: '1px' }}>789 Client Parkway, Gate C<br />Austin, TX 78701</div>
                        </div>
                      </div>
                    );

                  case 'table':
                    return (
                      <div key={block.id} style={{ fontSize: '0.72rem' }}>
                        <div style={{ background: config.primaryColor, color: '#fff', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderRadius: '3px' }}>
                          <span style={{ width: '60%' }}>ITEM DESCRIPTION</span>
                          <span style={{ width: '10%', textAlign: 'right' }}>QTY</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>UNIT</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>TOTAL</span>
                        </div>
                        <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ width: '60%' }}>Visual UI Design &amp; Architecture Consulting</span>
                          <span style={{ width: '10%', textAlign: 'right' }}>8</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>$175.00</span>
                          <span style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>$1,400.00</span>
                        </div>
                        <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', background: 'rgba(0,0,0,0.01)' }}>
                          <span style={{ width: '60%' }}>Billing System Integration Stub</span>
                          <span style={{ width: '10%', textAlign: 'right' }}>1</span>
                          <span style={{ width: '15%', textAlign: 'right' }}>$499.00</span>
                          <span style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>$499.00</span>
                        </div>
                      </div>
                    );

                  case 'totals':
                    return (
                      <div key={block.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', fontSize: '0.72rem' }}>
                        <div style={{ display: 'flex', width: '160px', justifyContent: 'space-between', color: '#4b5563' }}>
                          <span>Subtotal:</span><span>$1,899.00</span>
                        </div>
                        <div style={{ display: 'flex', width: '160px', justifyContent: 'space-between', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>
                          <span>Tax (10%):</span><span>$189.90</span>
                        </div>
                        <div style={{ display: 'flex', width: '160px', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.8rem', color: config.primaryColor }}>
                          <span>Total Due:</span><span>$2,088.90</span>
                        </div>
                      </div>
                    );

                  case 'notes':
                    return (
                      <div key={block.id} style={{ fontSize: '0.68rem', color: '#4b5563', maxWidth: '240px' }}>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>{block.title || 'Notes / Guidelines:'}</strong>
                        <div>Standard invoice net-30 terms apply. Please process via ACH to Account #99102-A.</div>
                      </div>
                    );

                  case 'signature':
                    return (
                      <div key={block.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', fontSize: '0.65rem' }}>
                        <div style={{ fontFamily: 'Times New Roman, serif', fontStyle: 'italic', fontSize: '1rem', color: config.primaryColor, paddingRight: '15px' }}>Acme Corp</div>
                        <div style={{ width: '110px', height: '0.8px', background: config.textColor }} />
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
                        fontWeight: el.fontStyle?.includes('bold') ? 'bold' : 'normal',
                        fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal',
                        textDecoration: el.textDecoration || 'none',
                        textAlign: el.alignment || 'left',
                        padding: `${el.padding || 0}px`,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden'
                      }}
                    >
                      {el.content}
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

                  {/* Selection handles (anchors) */}
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
            <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, fontSize: '0.62rem', color: '#9ca3af', textAlign: 'center', pointerEvents: 'none' }}>
              {config.footerText}
            </div>

          </div>
        </main>

        {/* RIGHT PANEL: Styling and Layout Config */}
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
                  <span>Element Settings</span>
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

              {/* Align relative to Page */}
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Align to A4 Canvas</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                  <button onClick={() => alignElement('left')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Left">L</button>
                  <button onClick={() => alignElement('center')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Center H">C</button>
                  <button onClick={() => alignElement('right')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Right">R</button>
                  <button onClick={() => alignElement('top')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Top">T</button>
                  <button onClick={() => alignElement('middle')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Middle V">M</button>
                  <button onClick={() => alignElement('bottom')} style={{ padding: '6px', fontSize: '0.7rem' }} className="btn btn-secondary" title="Align Bottom">B</button>
                </div>
              </div>

              {/* Position and Dimensions Inputs */}
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Dimensions &amp; Position (px)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>X:</span>
                    <input type="number" value={selectedElement.x} onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Y:</span>
                    <input type="number" value={selectedElement.y} onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>W:</span>
                    <input type="number" value={selectedElement.width} onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>H:</span>
                    <input type="number" disabled={selectedElement.type === 'line'} value={selectedElement.height} onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                </div>
              </div>

              {/* Layer / Depth Ordering */}
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Arrange Layers</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                  <button onClick={() => sendToLayer('front')} title="Bring to Front" className="btn btn-secondary" style={{ padding: '6px' }}><BringToFront size={12} /></button>
                  <button onClick={() => sendToLayer('up')} title="Move Up" className="btn btn-secondary" style={{ padding: '6px', fontSize: '0.68rem', fontWeight: 'bold' }}>+</button>
                  <button onClick={() => sendToLayer('down')} title="Move Down" className="btn btn-secondary" style={{ padding: '6px', fontSize: '0.68rem', fontWeight: 'bold' }}>-</button>
                  <button onClick={() => sendToLayer('back')} title="Send to Back" className="btn btn-secondary" style={{ padding: '6px' }}><SendToBack size={12} /></button>
                </div>
              </div>

              {/* TEXT SPECIFIC SETTINGS */}
              {selectedElement.type === 'text' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Text Content</label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => updateSelectedElement({ content: e.target.value })}
                      className="form-input"
                      rows={3}
                      style={{ fontSize: '0.78rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Font Size (pt)</label>
                      <input type="number" min={5} max={48} value={selectedElement.fontSize} onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })} className="form-input" style={{ fontSize: '0.78rem', padding: '5px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Padding (px)</label>
                      <input type="number" min={0} max={40} value={selectedElement.padding} onChange={(e) => updateSelectedElement({ padding: Number(e.target.value) })} className="form-input" style={{ fontSize: '0.78rem', padding: '5px' }} />
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Formatting</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          const current = selectedElement.fontStyle || 'normal';
                          let next: any = 'normal';
                          if (current === 'normal') next = 'bold';
                          else if (current === 'italic') next = 'bold-italic';
                          else if (current === 'bold-italic') next = 'italic';
                          updateSelectedElement({ fontStyle: next });
                        }}
                        className={`btn ${selectedElement.fontStyle?.includes('bold') ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 12px' }}
                      >
                        <Bold size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const current = selectedElement.fontStyle || 'normal';
                          let next: any = 'normal';
                          if (current === 'normal') next = 'italic';
                          else if (current === 'bold') next = 'bold-italic';
                          else if (current === 'bold-italic') next = 'bold';
                          updateSelectedElement({ fontStyle: next });
                        }}
                        className={`btn ${selectedElement.fontStyle?.includes('italic') ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 12px' }}
                      >
                        <Italic size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const current = selectedElement.textDecoration || 'none';
                          updateSelectedElement({ textDecoration: current === 'underline' ? 'none' : 'underline' });
                        }}
                        className={`btn ${selectedElement.textDecoration === 'underline' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 12px' }}
                      >
                        <Underline size={12} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Alignment</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => updateSelectedElement({ alignment: 'left' })} className={`btn ${selectedElement.alignment === 'left' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px' }}><AlignLeft size={12} /></button>
                      <button onClick={() => updateSelectedElement({ alignment: 'center' })} className={`btn ${selectedElement.alignment === 'center' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px' }}><AlignCenter size={12} /></button>
                      <button onClick={() => updateSelectedElement({ alignment: 'right' })} className={`btn ${selectedElement.alignment === 'right' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px' }}><AlignRight size={12} /></button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Text Shade Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={selectedElement.textColor || config.textColor} onChange={(e) => updateSelectedElement({ textColor: e.target.value })} style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)', padding: 0, borderRadius: '4px', cursor: 'pointer' }} />
                      <input type="text" value={selectedElement.textColor || config.textColor} onChange={(e) => updateSelectedElement({ textColor: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', flex: 1, padding: '4px' }} />
                    </div>
                  </div>
                </>
              )}

              {/* SHAPE / LINE SPECIFIC SETTINGS */}
              {(selectedElement.type === 'shape' || selectedElement.type === 'line') && (
                <>
                  {selectedElement.type === 'shape' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Fill Shade Color</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="color" value={selectedElement.fillColor || config.primaryColor} onChange={(e) => updateSelectedElement({ fillColor: e.target.value })} style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)', padding: 0, borderRadius: '4px', cursor: 'pointer' }} />
                        <input type="text" value={selectedElement.fillColor || config.primaryColor} onChange={(e) => updateSelectedElement({ fillColor: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', flex: 1, padding: '4px' }} />
                      </div>
                    </div>
                  )}

                  {selectedElement.type === 'shape' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Fill Opacity (0.0 - 1.0)</label>
                      <input type="range" min={0} max={1} step={0.05} value={selectedElement.fillOpacity ?? 0.2} onChange={(e) => updateSelectedElement({ fillOpacity: Number(e.target.value) })} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(selectedElement.fillOpacity ?? 0.2).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Border Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={selectedElement.borderColor || config.primaryColor} onChange={(e) => updateSelectedElement({ borderColor: e.target.value })} style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)', padding: 0, borderRadius: '4px', cursor: 'pointer' }} />
                      <input type="text" value={selectedElement.borderColor || config.primaryColor} onChange={(e) => updateSelectedElement({ borderColor: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', flex: 1, padding: '4px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Border Thickness</label>
                      <input type="number" min={0} max={10} step={0.5} value={selectedElement.borderWidth} onChange={(e) => updateSelectedElement({ borderWidth: Number(e.target.value) })} className="form-input" style={{ fontSize: '0.78rem', padding: '5px' }} />
                    </div>
                    {selectedElement.type === 'shape' && selectedElement.shapeType === 'rect' && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Corner Radius</label>
                        <input type="number" min={0} max={50} value={selectedElement.borderRadius} onChange={(e) => updateSelectedElement({ borderRadius: Number(e.target.value) })} className="form-input" style={{ fontSize: '0.78rem', padding: '5px' }} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            // ================= GLOBAL PAGE SETTINGS =================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SettingsIcon size={14} color="var(--primary)" />
                <span>Page Attributes</span>
              </h4>

              {/* Color Presets */}
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Color presets</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {colorPresets.map((pr) => (
                    <button
                      key={pr.name}
                      onClick={() => setConfig({
                        ...config,
                        primaryColor: pr.primary,
                        textColor: pr.text,
                        backgroundColor: pr.bg,
                        bgGradientEnabled: false
                      })}
                      title={pr.name}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: pr.primary,
                        border: '2px solid var(--border-color)', cursor: 'pointer', position: 'relative'
                      }}
                    >
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: pr.bg, borderRadius: '50%', border: '1px solid #ddd' }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Primary Brand Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)', padding: 0, borderRadius: '4px', cursor: 'pointer' }} />
                  <input type="text" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', flex: 1, padding: '4px' }} />
                </div>
              </div>

              {/* Gradient Toggle */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={config.bgGradientEnabled} onChange={(e) => setConfig({ ...config, bgGradientEnabled: e.target.checked })} style={{ accentColor: 'var(--primary)' }} />
                  <span>Use Shade Gradient Background</span>
                </label>
              </div>

              {config.bgGradientEnabled ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>Gradient Start</label>
                    <input type="color" value={config.bgGradientStart} onChange={(e) => setConfig({ ...config, bgGradientStart: e.target.value })} style={{ width: '100%', height: '24px', border: '1px solid var(--border-color)', cursor: 'pointer' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>Gradient End</label>
                    <input type="color" value={config.bgGradientEnd} onChange={(e) => setConfig({ ...config, bgGradientEnd: e.target.value })} style={{ width: '100%', height: '24px', border: '1px solid var(--border-color)', cursor: 'pointer' }} />
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Background Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={config.backgroundColor} onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })} style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)', padding: 0, borderRadius: '4px', cursor: 'pointer' }} />
                    <input type="text" value={config.backgroundColor} onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', flex: 1, padding: '4px' }} />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Global Text Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" value={config.textColor} onChange={(e) => setConfig({ ...config, textColor: e.target.value })} style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)', padding: 0, borderRadius: '4px', cursor: 'pointer' }} />
                  <input type="text" value={config.textColor} onChange={(e) => setConfig({ ...config, textColor: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', flex: 1, padding: '4px' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Typography Family</label>
                <select value={config.fontFamily} onChange={(e) => setConfig({ ...config, fontFamily: e.target.value as any })} className="form-input" style={{ fontSize: '0.78rem', padding: '4px' }}>
                  <option value="Helvetica">Helvetica (Sans Serif)</option>
                  <option value="Courier">Courier (Monospace)</option>
                  <option value="Times-Roman">Times New Roman (Elegant Serif)</option>
                </select>
              </div>

              {/* Margins */}
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Page Margins (px)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Top:</span>
                    <input type="number" min={10} max={150} value={config.marginTop} onChange={(e) => setConfig({ ...config, marginTop: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bottom:</span>
                    <input type="number" min={10} max={150} value={config.marginBottom} onChange={(e) => setConfig({ ...config, marginBottom: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Left:</span>
                    <input type="number" min={10} max={150} value={config.marginLeft} onChange={(e) => setConfig({ ...config, marginLeft: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Right:</span>
                    <input type="number" min={10} max={150} value={config.marginRight} onChange={(e) => setConfig({ ...config, marginRight: Number(e.target.value) })} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} />
                  </div>
                </div>
              </div>

              {/* Block Properties specific settings */}
              {config.blocks.find(b => b.type === 'header')?.active && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Header Title Text</label>
                  <input type="text" value={config.blocks.find(b => b.type === 'header')?.title || ''} onChange={(e) => updateBlockProps('block_header', { title: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', padding: '5px' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', marginTop: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={config.blocks.find(b => b.type === 'header')?.showLogo !== false} onChange={(e) => updateBlockProps('block_header', { showLogo: e.target.checked })} style={{ accentColor: 'var(--primary)' }} />
                    <span>Show Brand Logo</span>
                  </label>
                </div>
              )}

              {config.blocks.find(b => b.type === 'notes')?.active && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Notes Section Label</label>
                  <input type="text" value={config.blocks.find(b => b.type === 'notes')?.title || ''} onChange={(e) => updateBlockProps('block_notes', { title: e.target.value })} className="form-input" style={{ fontSize: '0.78rem', padding: '5px' }} />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Footer Copyright / Note</label>
                <textarea
                  value={config.footerText}
                  onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                  className="form-input"
                  rows={2}
                  style={{ resize: 'none', fontSize: '0.78rem' }}
                />
              </div>
            </div>
          )}

        </aside>

      </div>

    </div>
  );
};
