export interface HsnSacEntry {
  code: string;
  type: 'product' | 'service';
  category: string;
  description: string;
  defaultTaxRate: number;
  keywords: string[];
}

export const HSN_SAC_DATABASE: HsnSacEntry[] = [
  // ==========================================
  // SERVICES (SAC CODES) - Chapter 99
  // ==========================================
  {
    code: 'SAC 998314',
    type: 'service',
    category: 'Information Technology',
    description: 'Information technology software design and development services',
    defaultTaxRate: 18,
    keywords: ['software', 'development', 'programming', 'code', 'web', 'website', 'app', 'mobile', 'frontend', 'backend', 'fullstack', 'react', 'node', 'python', 'api']
  },
  {
    code: 'SAC 998313',
    type: 'service',
    category: 'Information Technology',
    description: 'IT consulting, technical support and advisory services',
    defaultTaxRate: 18,
    keywords: ['consulting', 'it support', 'technical support', 'tech consultant', 'advisory', 'cloud architecture', 'devops', 'sysadmin']
  },
  {
    code: 'SAC 998315',
    type: 'service',
    category: 'Information Technology',
    description: 'Hosting, SaaS and IT infrastructure provisioning services',
    defaultTaxRate: 18,
    keywords: ['hosting', 'saas', 'cloud hosting', 'server', 'aws', 'vps', 'domain', 'database hosting', 'subscription', 'software subscription']
  },
  {
    code: 'SAC 998316',
    type: 'service',
    category: 'Information Technology',
    description: 'IT infrastructure and network management services',
    defaultTaxRate: 18,
    keywords: ['network', 'infrastructure', 'firewall', 'security', 'cybersecurity', 'vpn', 'system administration']
  },
  {
    code: 'SAC 998319',
    type: 'service',
    category: 'Information Technology',
    description: 'Other information technology and software services n.e.c.',
    defaultTaxRate: 18,
    keywords: ['it service', 'data processing', 'data entry', 'tech solutions', 'automation', 'qa', 'testing']
  },
  {
    code: 'SAC 998341',
    type: 'service',
    category: 'Design & Creative',
    description: 'Graphic design, visual identity and UI/UX creative services',
    defaultTaxRate: 18,
    keywords: ['design', 'ui', 'ux', 'graphic', 'logo', 'branding', 'figma', 'illustration', 'creative', 'banner', 'art', 'vector']
  },
  {
    code: 'SAC 998361',
    type: 'service',
    category: 'Marketing & Advertising',
    description: 'Advertising, digital marketing and promotional campaign services',
    defaultTaxRate: 18,
    keywords: ['marketing', 'advertising', 'ads', 'google ads', 'meta ads', 'seo', 'sem', 'social media', 'smm', 'campaign', 'influencer', 'promotion']
  },
  {
    code: 'SAC 998365',
    type: 'service',
    category: 'Marketing & Advertising',
    description: 'Market research and public opinion polling services',
    defaultTaxRate: 18,
    keywords: ['market research', 'survey', 'analytics', 'analytics service', 'data analytics', 'consumer research']
  },
  {
    code: 'SAC 998211',
    type: 'service',
    category: 'Legal & Professional',
    description: 'Legal advisory, compliance and representation services',
    defaultTaxRate: 18,
    keywords: ['legal', 'lawyer', 'advocate', 'contract', 'agreement', 'compliance', 'trademark', 'patent', 'copyright']
  },
  {
    code: 'SAC 998222',
    type: 'service',
    category: 'Legal & Professional',
    description: 'Accounting, auditing, tax preparation and bookkeeping services',
    defaultTaxRate: 18,
    keywords: ['accounting', 'audit', 'taxation', 'gst filing', 'bookkeeping', 'cfo', 'financial', 'tax consultant', 'payroll']
  },
  {
    code: 'SAC 998311',
    type: 'service',
    category: 'Business & Management',
    description: 'Management consulting, business advisory and strategy',
    defaultTaxRate: 18,
    keywords: ['business consulting', 'management consulting', 'strategy', 'operations', 'business coaching', 'executive advisory']
  },
  {
    code: 'SAC 998371',
    type: 'service',
    category: 'Media & Production',
    description: 'Photography, videography and media production services',
    defaultTaxRate: 18,
    keywords: ['photo', 'photography', 'video', 'videography', 'shooting', 'editing', 'film', 'animation', 'audio recording', 'podcast']
  },
  {
    code: 'SAC 998719',
    type: 'service',
    category: 'Maintenance & Repairs',
    description: 'Maintenance, repair, AMC and technical support services',
    defaultTaxRate: 18,
    keywords: ['maintenance', 'amc', 'repair', 'servicing', 'annual maintenance', 'troubleshooting', 'installation']
  },
  {
    code: 'SAC 999293',
    type: 'service',
    category: 'Education & Training',
    description: 'Commercial training, corporate coaching and skill development',
    defaultTaxRate: 18,
    keywords: ['training', 'workshop', 'coaching', 'course', 'bootcamp', 'education', 'lecture', 'mentorship']
  },
  {
    code: 'SAC 998599',
    type: 'service',
    category: 'Other Services',
    description: 'Other business support, subscription and general services n.e.c.',
    defaultTaxRate: 18,
    keywords: ['support', 'general service', 'subscription', 'membership', 'retainer', 'assistance', 'custom service']
  },

  // ==========================================
  // PRODUCTS / GOODS (HSN CODES)
  // ==========================================
  {
    code: 'HSN 8471',
    type: 'product',
    category: 'Electronics & Computers',
    description: 'Automatic data processing machines, laptops, PCs, mouse, keyboard & peripherals',
    defaultTaxRate: 18,
    keywords: ['laptop', 'computer', 'pc', 'desktop', 'mouse', 'keyboard', 'trackpad', 'cpu', 'motherboard', 'ram', 'peripherals', 'hardware']
  },
  {
    code: 'HSN 8528',
    type: 'product',
    category: 'Electronics & Computers',
    description: 'Monitors, displays, projector screens and video monitors',
    defaultTaxRate: 18,
    keywords: ['monitor', 'screen', 'display', 'projector', 'lcd', 'led screen', 'tv monitor', 'dual monitor']
  },
  {
    code: 'HSN 8517',
    type: 'product',
    category: 'Electronics & Computers',
    description: 'Smartphones, routers, modems, switches & telecommunication apparatus',
    defaultTaxRate: 18,
    keywords: ['phone', 'mobile', 'smartphone', 'router', 'modem', 'network switch', 'access point', 'wifi', 'telecom', 'intercom']
  },
  {
    code: 'HSN 8443',
    type: 'product',
    category: 'Office & IT Equipment',
    description: 'Printers, scanners, photocopiers, toner cartridges & accessories',
    defaultTaxRate: 18,
    keywords: ['printer', 'scanner', 'copier', 'photocopier', 'toner', 'cartridge', 'ink', 'printing machine']
  },
  {
    code: 'HSN 8504',
    type: 'product',
    category: 'Electronics & Hardware',
    description: 'Power supplies, chargers, power adapters, UPS & electrical transformers',
    defaultTaxRate: 18,
    keywords: ['charger', 'adapter', 'power supply', 'ups', 'battery backup', 'inverter', 'transformer', 'power bank']
  },
  {
    code: 'HSN 8523',
    type: 'product',
    category: 'Electronics & Storage',
    description: 'Solid-state drives (SSD), hard disks (HDD), USB flash drives & memory cards',
    defaultTaxRate: 18,
    keywords: ['ssd', 'hard disk', 'hdd', 'usb', 'pen drive', 'flash drive', 'sd card', 'memory card', 'storage disk']
  },
  {
    code: 'HSN 8518',
    type: 'product',
    category: 'Audio & Peripherals',
    description: 'Microphones, headphones, earphones, speakers & audio amplifiers',
    defaultTaxRate: 18,
    keywords: ['microphone', 'mic', 'headphone', 'headset', 'earphone', 'airpods', 'speaker', 'audio', 'soundbar']
  },
  {
    code: 'HSN 8544',
    type: 'product',
    category: 'Cables & Wiring',
    description: 'Insulated cables, HDMI cables, USB-C cords, patch cords & wires',
    defaultTaxRate: 18,
    keywords: ['cable', 'hdmi', 'usb cable', 'type c', 'lan cable', 'ethernet cable', 'wire', 'cord', 'connector']
  },
  {
    code: 'HSN 9403',
    type: 'product',
    category: 'Furniture & Workspace',
    description: 'Office furniture, ergonomic chairs, standing desks & workstations',
    defaultTaxRate: 18,
    keywords: ['chair', 'desk', 'table', 'furniture', 'ergonomic chair', 'standing desk', 'cabinet', 'bookshelf', 'workstation']
  },
  {
    code: 'HSN 4820',
    type: 'product',
    category: 'Stationery & Office',
    description: 'Registers, notebooks, paper stationery, binders & office files',
    defaultTaxRate: 12,
    keywords: ['notebook', 'diary', 'register', 'stationery', 'paper', 'binder', 'file', 'folder', 'pen', 'pad']
  },
  {
    code: 'HSN 4901',
    type: 'product',
    category: 'Books & Publications',
    description: 'Printed books, manuals, brochures, journals & leaflets',
    defaultTaxRate: 0,
    keywords: ['book', 'manual', 'handbook', 'guide', 'brochure', 'leaflet', 'publication', 'catalogue']
  },
  {
    code: 'HSN 6109',
    type: 'product',
    category: 'Apparel & Clothing',
    description: 'T-shirts, polo shirts, singlets, merchandise & knitted clothing',
    defaultTaxRate: 5,
    keywords: ['tshirt', 't-shirt', 'shirt', 'polo', 'apparel', 'clothing', 'jersey', 'merchandise', 'uniform']
  },
  {
    code: 'HSN 6203',
    type: 'product',
    category: 'Apparel & Clothing',
    description: "Men's suits, blazers, trousers, jackets & formal garments",
    defaultTaxRate: 12,
    keywords: ['suit', 'blazer', 'jacket', 'trousers', 'pants', 'formal wear']
  },
  {
    code: 'HSN 3004',
    type: 'product',
    category: 'Healthcare & Pharma',
    description: 'Medicaments, healthcare products and pharmaceutical supplies',
    defaultTaxRate: 12,
    keywords: ['medicine', 'pharma', 'health', 'medical', 'tablet', 'syrup', 'bandage', 'first aid']
  },
  {
    code: 'HSN 2106',
    type: 'product',
    category: 'Food & Nutrition',
    description: 'Food preparations, nutritional supplements, snacks & beverages',
    defaultTaxRate: 18,
    keywords: ['food', 'snack', 'supplement', 'coffee', 'tea', 'protein', 'nutrition', 'edible']
  },
  {
    code: 'HSN 3926',
    type: 'product',
    category: 'Packaging & Plastics',
    description: 'Plastic articles, packaging materials, acrylic stands & protective covers',
    defaultTaxRate: 18,
    keywords: ['plastic', 'cover', 'case', 'acrylic', 'packaging', 'box plastic', 'protective sleeve']
  }
];

export function detectHsnSacCode(
  name: string,
  category?: string,
  type?: 'product' | 'service'
): HsnSacEntry | null {
  const cleanName = (name || '').toLowerCase().trim();
  const cleanCat = (category || '').toLowerCase().trim();
  const combined = `${cleanName} ${cleanCat}`;

  if (!combined.trim()) {
    if (type === 'service') {
      return HSN_SAC_DATABASE.find(e => e.code === 'SAC 998314') || null;
    }
    return HSN_SAC_DATABASE.find(e => e.code === 'HSN 8471') || null;
  }

  const pool = type ? HSN_SAC_DATABASE.filter(e => e.type === type) : HSN_SAC_DATABASE;

  let bestMatch: HsnSacEntry | null = null;
  let highestScore = 0;

  for (const entry of pool) {
    let score = 0;

    for (const kw of entry.keywords) {
      if (combined.includes(kw)) {
        score += kw.length >= 5 ? 3 : 2;
      }
    }

    if (cleanCat && entry.category.toLowerCase().includes(cleanCat)) {
      score += 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && highestScore > 0) {
    return bestMatch;
  }

  if (type === 'service') {
    return HSN_SAC_DATABASE.find(e => e.code === 'SAC 998314') || null;
  }
  return HSN_SAC_DATABASE.find(e => e.code === 'HSN 8471') || null;
}

export function searchHsnSacCodes(query: string, type?: 'product' | 'service'): HsnSacEntry[] {
  const q = (query || '').toLowerCase().trim();
  const pool = type ? HSN_SAC_DATABASE.filter(e => e.type === type) : HSN_SAC_DATABASE;

  if (!q) return pool;

  return pool.filter(entry => {
    return (
      entry.code.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q) ||
      entry.keywords.some(k => k.toLowerCase().includes(q))
    );
  });
}

export function generateSku(
  name: string,
  category?: string,
  type: 'product' | 'service' = 'product'
): string {
  let prefix = type === 'product' ? 'PRD' : 'SRV';

  if (category && category.trim()) {
    const cleanCat = category.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanCat.length >= 3) {
      prefix = cleanCat.substring(0, 3);
    }
  }

  let nameCode = 'ITM';
  if (name && name.trim()) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const initials = words.map(w => w.replace(/[^a-zA-Z0-9]/g, '')[0]).filter(Boolean).join('').toUpperCase();
      nameCode = initials.padEnd(3, 'X').substring(0, 4);
    } else {
      const single = words[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      nameCode = single.substring(0, 3).padEnd(3, '0');
    }
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${nameCode}-${randomNum}`;
}

export function calculateProfitStats(sellingPrice: number, costPrice: number, taxRate: number = 0) {
  const sp = Number(sellingPrice) || 0;
  const cp = Number(costPrice) || 0;
  const tax = Number(taxRate) || 0;

  const grossProfit = Math.max(0, sp - cp);
  const profitMarginPercent = sp > 0 ? ((grossProfit / sp) * 100) : 0;
  const markupPercent = cp > 0 ? ((grossProfit / cp) * 100) : 0;
  const taxAmount = (sp * tax) / 100;
  const finalPriceWithTax = sp + taxAmount;

  return {
    sellingPrice: sp,
    costPrice: cp,
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    markupPercent: Math.round(markupPercent * 10) / 10,
    taxAmount: Math.round(taxAmount * 100) / 100,
    finalPriceWithTax: Math.round(finalPriceWithTax * 100) / 100
  };
}
