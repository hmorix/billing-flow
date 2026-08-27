export interface PresetPackageItem {
  catalog_item_id?: string | null;
  item_type: 'product' | 'service';
  name: string;
  sku_hsn?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
}

export interface PresetPackage {
  id?: string;
  name: string;
  code: string;
  description: string;
  category: string;
  iconName?: string;
  package_type: 'service' | 'product' | 'hybrid';
  original_price: number;
  package_price: number;
  discount_rate: number;
  discount_type: 'percentage' | 'fixed';
  tax_mode: 'item_wise' | 'flat';
  custom_tax_rate: number;
  badge?: string;
  items: PresetPackageItem[];
}

export interface PresetCatalogItem {
  name: string;
  type: 'product' | 'service';
  sku: string;
  hsn_sac: string;
  description: string;
  unit_price: number;
  cost_price: number;
  tax_rate: number;
  unit: string;
  track_inventory: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string;
}

// =========================================================================
// 1. STANDALONE DIGITAL AGENCY, SAAS, SEO & TECH CATALOG ITEMS
// =========================================================================
export const PRESET_CATALOG_ITEMS: PresetCatalogItem[] = [
  // --- Web Development & Engineering ---
  {
    name: 'Custom Business Website Development (Next.js / React)',
    type: 'service',
    sku: 'DEV-WEB-CUST',
    hsn_sac: 'SAC 998314',
    description: 'High-speed custom responsive business website built with modern Next.js/React framework, responsive UI, CMS integration, SEO optimization, and SSL setup.',
    unit_price: 35000,
    cost_price: 12000,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Web Development'
  },
  {
    name: 'E-Commerce Online Store (Custom / Shopify / WooCommerce)',
    type: 'service',
    sku: 'DEV-ECOM-STORE',
    hsn_sac: 'SAC 998314',
    description: 'Full-featured online store with payment gateway integration, product catalog, inventory tracking, cart recovery, order dispatch notifications, and admin dashboard.',
    unit_price: 48000,
    cost_price: 18000,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Web Development'
  },
  {
    name: 'High-Converting Landing Page & Funnel Design',
    type: 'service',
    sku: 'DEV-LND-PAGE',
    hsn_sac: 'SAC 998314',
    description: 'Single-page conversion-focused landing page with copywriting, A/B testing setup, lead capture forms, CRM webhooks, and sub-second load times.',
    unit_price: 15000,
    cost_price: 5000,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Web Development'
  },
  {
    name: 'Annual Website Maintenance & Security SLA',
    type: 'service',
    sku: 'DEV-MAINT-ANN',
    hsn_sac: 'SAC 998313',
    description: 'Year-round technical maintenance, automated daily cloud backups, core updates, uptime monitoring, bug fixes, and SSL renewal support.',
    unit_price: 18000,
    cost_price: 4000,
    tax_rate: 18,
    unit: 'month',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Web Development'
  },

  // --- Hosting & Domains ---
  {
    name: 'Custom Domain Registration (.com / .in / .org / .io)',
    type: 'product',
    sku: 'DOM-REG-1YR',
    hsn_sac: 'SAC 998315',
    description: '1-Year Top-Level Domain Name registration with DNS management, WHOIS privacy protection, and DNSSEC security configuration.',
    unit_price: 1499,
    cost_price: 899,
    tax_rate: 18,
    unit: 'units',
    track_inventory: 1,
    stock_quantity: 100,
    low_stock_threshold: 10,
    category: 'Hosting & Domains'
  },
  {
    name: 'High-Speed Cloud VPS & Managed Hosting (Annual)',
    type: 'product',
    sku: 'HOST-VPS-ANN',
    hsn_sac: 'SAC 998315',
    description: 'Dedicated high-performance NVMe cloud server with 99.99% SLA uptime, LiteSpeed cache, free SSL certificates, Cloudflare CDN, and automated daily backups.',
    unit_price: 12000,
    cost_price: 4500,
    tax_rate: 18,
    unit: 'units',
    track_inventory: 1,
    stock_quantity: 50,
    low_stock_threshold: 5,
    category: 'Hosting & Domains'
  },
  {
    name: 'Managed WordPress Hosting & Security Suite',
    type: 'service',
    sku: 'HOST-WP-MGD',
    hsn_sac: 'SAC 998315',
    description: 'Ultra-fast WordPress environment optimized for WooCommerce & Elementor, malware scanning, automatic database optimization, and staging sandbox.',
    unit_price: 8500,
    cost_price: 2500,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Hosting & Domains'
  },

  // --- SEO & Search Marketing ---
  {
    name: 'Comprehensive Technical & On-Page SEO Audit',
    type: 'service',
    sku: 'SEO-AUDIT-DEEP',
    hsn_sac: 'SAC 998361',
    description: '100+ point full technical SEO audit covering Core Web Vitals, indexability, crawl errors, schema markup, content cannibalization, and competitor keyword gap matrix.',
    unit_price: 12000,
    cost_price: 3000,
    tax_rate: 18,
    unit: 'service',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Search Engine Optimization'
  },
  {
    name: '3-Month SEO Growth & Keyword Ranking Retainer',
    type: 'service',
    sku: 'SEO-3M-GROWTH',
    hsn_sac: 'SAC 998361',
    description: '3-Month dedicated SEO support package: on-page fixes, meta tags, targeted high-intent keyword optimization, monthly 15+ authority backlinks, and bi-weekly ranking reports.',
    unit_price: 36000,
    cost_price: 12000,
    tax_rate: 18,
    unit: 'service',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Search Engine Optimization'
  },
  {
    name: '6-Month Advanced Organic Traffic & Domain Authority Push',
    type: 'service',
    sku: 'SEO-6M-DOMINATE',
    hsn_sac: 'SAC 998361',
    description: '6-Month deep enterprise SEO execution: programmatic content silos, guest posts on DA 60+ domains, technical CWV speed tuning, and guaranteed first-page keyword visibility.',
    unit_price: 65000,
    cost_price: 22000,
    tax_rate: 18,
    unit: 'service',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Search Engine Optimization'
  },
  {
    name: 'Local SEO & Google Business Profile (GBP) 3-Pack Optimization',
    type: 'service',
    sku: 'SEO-LOC-GBP',
    hsn_sac: 'SAC 998361',
    description: 'Hyper-local map rank booster: Google Business Profile verification, geo-tagged photo uploads, local NAP citations, review generation funnel, and local schema markup.',
    unit_price: 9500,
    cost_price: 2500,
    tax_rate: 18,
    unit: 'service',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Search Engine Optimization'
  },
  {
    name: 'High-DA Authority Backlink & Digital PR Outreach',
    type: 'service',
    sku: 'SEO-BACKLINKS',
    hsn_sac: 'SAC 998361',
    description: 'Manual outreach for 10+ high DA 50+ do-follow contextual editorial backlinks from niche relevant industry blogs and news publications.',
    unit_price: 16000,
    cost_price: 6000,
    tax_rate: 18,
    unit: 'service',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Search Engine Optimization'
  },

  // --- Paid Advertising & Monetization ---
  {
    name: 'Meta Ads Management (Facebook & Instagram High ROAS)',
    type: 'service',
    sku: 'ADS-META-MGT',
    hsn_sac: 'SAC 998361',
    description: 'Full-funnel Facebook and Instagram ad campaign setup, Conversions API (CAPI) tracking, dynamic creative testing, retargeting custom audiences, and weekly ROAS optimization.',
    unit_price: 20000,
    cost_price: 6000,
    tax_rate: 18,
    unit: 'month',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Paid Advertising'
  },
  {
    name: 'Google Ads & YouTube PPC Campaign Setup & Optimization',
    type: 'service',
    sku: 'ADS-GOOG-PPC',
    hsn_sac: 'SAC 998361',
    description: 'Google Search, Performance Max, Display, and YouTube PPC management with negative keyword pruning, enhanced conversions tracking, and ad copy split testing.',
    unit_price: 22000,
    cost_price: 7000,
    tax_rate: 18,
    unit: 'month',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Paid Advertising'
  },
  {
    name: 'Google AdSense Setup, Approval & Monetization Advisory',
    type: 'service',
    sku: 'ADS-SENSE-ADV',
    hsn_sac: 'SAC 998361',
    description: 'AdSense policy compliance audit, website layout optimization for maximum RPM/CTR, high CPC ad unit placement, header bidding integration, and fast account approval strategy.',
    unit_price: 14000,
    cost_price: 3500,
    tax_rate: 18,
    unit: 'service',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Paid Advertising'
  },
  {
    name: '1-on-1 Growth & Digital Marketing Strategy Consultation',
    type: 'service',
    sku: 'CONS-MKT-STRAT',
    hsn_sac: 'SAC 998311',
    description: 'Private 1-on-1 strategic growth consultation with senior marketing director covering customer acquisition funnels, CAC reduction, unit economics, and 90-day execution roadmap.',
    unit_price: 15000,
    cost_price: 2000,
    tax_rate: 18,
    unit: 'session',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Consultant Services'
  },

  // --- Digital Software Products & SaaS ---
  {
    name: 'BillingFlow Invoicing & Financial CRM License (Annual/Lifetime)',
    type: 'product',
    sku: 'SFT-BILLINGFLOW',
    hsn_sac: 'SAC 998314',
    description: 'Complete multi-tenant billing, automated PDF GST invoice engine, recurring subscriptions, client portal, agreements generator, and live payment gateway reconciliation.',
    unit_price: 24999,
    cost_price: 5000,
    tax_rate: 18,
    unit: 'units',
    track_inventory: 1,
    stock_quantity: 999,
    low_stock_threshold: 5,
    category: 'Software Products & SaaS'
  },
  {
    name: 'Omnichannel Enterprise CRM Software Setup & Deployment',
    type: 'product',
    sku: 'SFT-ENT-CRM',
    hsn_sac: 'SAC 998314',
    description: 'Custom self-hosted or cloud CRM system with lead capture pipelines, deal stages, automated email sequences, telephony integration, and sales team role permissions.',
    unit_price: 38000,
    cost_price: 10000,
    tax_rate: 18,
    unit: 'units',
    track_inventory: 1,
    stock_quantity: 100,
    low_stock_threshold: 5,
    category: 'Software Products & SaaS'
  },
  {
    name: 'HRM & Payroll Management Cloud Suite',
    type: 'product',
    sku: 'SFT-HRM-SUITE',
    hsn_sac: 'SAC 998314',
    description: 'Full employee life-cycle management software: biometric/remote attendance, leave approvals, salary slip generation, compliance filing, and performance appraisal tracking.',
    unit_price: 32000,
    cost_price: 8000,
    tax_rate: 18,
    unit: 'units',
    track_inventory: 1,
    stock_quantity: 100,
    low_stock_threshold: 5,
    category: 'Software Products & SaaS'
  },
  {
    name: 'AI Workflow Automation (n8n / Make / Custom Webhooks)',
    type: 'service',
    sku: 'SFT-AI-WORKFLOW',
    hsn_sac: 'SAC 998314',
    description: 'Custom multi-step business logic automation connecting CRM, billing, email, Google Sheets, databases, and AI webhooks for hands-free 24/7 operations.',
    unit_price: 25000,
    cost_price: 6000,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'AI & Automation'
  },
  {
    name: 'Custom AI Customer Support & Sales Agent (LLM-Powered)',
    type: 'service',
    sku: 'SFT-AI-AGENT',
    hsn_sac: 'SAC 998314',
    description: 'Trained RAG-based AI voice/chat agent integrated into website and WhatsApp, trained on proprietary company knowledge docs, FAQs, and product catalogs to close leads 24/7.',
    unit_price: 45000,
    cost_price: 12000,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'AI & Automation'
  },
  {
    name: 'Cold & Bulk Email Marketing System (SMTP / Klaviyo / Warmup)',
    type: 'service',
    sku: 'MKT-EMAIL-AUTO',
    hsn_sac: 'SAC 998361',
    description: 'Dedicated high-deliverability cold email infrastructure: custom sending domains, SPF/DKIM/DMARC/BIMI configuration, automated inbox warmup, and high-converting copy sequences.',
    unit_price: 18000,
    cost_price: 4000,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Marketing Automation'
  },
  {
    name: 'WhatsApp Business Cloud API & Marketing Automation System',
    type: 'service',
    sku: 'MKT-WA-AUTOMATE',
    hsn_sac: 'SAC 998361',
    description: 'Official Meta WhatsApp Cloud API setup, green tick verification guidance, automated broadcast campaigns, interactive catalog buttons, and automated invoice sending.',
    unit_price: 22000,
    cost_price: 5000,
    tax_rate: 18,
    unit: 'project',
    track_inventory: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    category: 'Marketing Automation'
  }
];

// =========================================================================
// 2. READY-MADE COMBO PACKAGES FOR DIGITAL AGENCIES, TECH & MARKETING
// =========================================================================
export const PRESET_PACKAGES: PresetPackage[] = [
  {
    name: '3-Month SEO Growth & Keyword Ranking Retainer',
    code: 'PKG-SEO-3M',
    description: 'Complete 3-Month Search Engine Optimization package including deep technical SEO audit, 3 months of hands-on keyword ranking work, and high-authority backlink campaigns.',
    category: 'Search Engine Optimization',
    package_type: 'service',
    badge: 'Popular SEO',
    original_price: 64000,
    package_price: 49999,
    discount_rate: 22,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'service',
        name: 'Comprehensive Technical & On-Page SEO Audit',
        sku_hsn: 'SAC 998361',
        description: '100+ point full technical SEO audit and site health remediation blueprint',
        quantity: 1,
        unit_price: 12000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: '3-Month SEO Growth & Keyword Ranking Retainer',
        sku_hsn: 'SAC 998361',
        description: '3-Month dedicated SEO support with on-page fixes & bi-weekly tracking',
        quantity: 1,
        unit_price: 36000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'High-DA Authority Backlink & Digital PR Outreach',
        sku_hsn: 'SAC 998361',
        description: 'High authority niche backlinks building push',
        quantity: 1,
        unit_price: 16000,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  },
  {
    name: 'Complete Web Development & Cloud Hosting Suite',
    code: 'PKG-WEB-HOST',
    description: 'Turnkey online business launch: Modern custom Next.js/React website, 1-year custom domain, high-speed NVMe cloud VPS hosting, and 1-year maintenance SLA.',
    category: 'Web Development',
    package_type: 'hybrid',
    badge: 'Best Seller',
    original_price: 66499,
    package_price: 52999,
    discount_rate: 20,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'service',
        name: 'Custom Business Website Development (Next.js / React)',
        sku_hsn: 'SAC 998314',
        description: 'Modern responsive custom business website with CMS and speed optimization',
        quantity: 1,
        unit_price: 35000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'product',
        name: 'Custom Domain Registration (.com / .in / .org / .io)',
        sku_hsn: 'SAC 998315',
        description: '1-Year Top Level Domain with WHOIS privacy protection',
        quantity: 1,
        unit_price: 1499,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'product',
        name: 'High-Speed Cloud VPS & Managed Hosting (Annual)',
        sku_hsn: 'SAC 998315',
        description: 'Annual NVMe cloud server hosting with 99.99% uptime and CDN',
        quantity: 1,
        unit_price: 12000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Annual Website Maintenance & Security SLA',
        sku_hsn: 'SAC 998313',
        description: 'Year-round technical updates, daily backups, and security monitoring',
        quantity: 1,
        unit_price: 18000,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  },
  {
    name: 'Performance Ads & Funnel Conversion Machine',
    code: 'PKG-ADS-CONV',
    description: 'High-converting customer acquisition engine: Meta (FB/IG) ads management, Google PPC campaigns, custom landing page, and strategy advisory.',
    category: 'Paid Advertising',
    package_type: 'service',
    badge: 'High ROAS',
    original_price: 72000,
    package_price: 54999,
    discount_rate: 24,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'service',
        name: 'High-Converting Landing Page & Funnel Design',
        sku_hsn: 'SAC 998314',
        description: 'Conversion-optimized landing page with copywriting & lead capture forms',
        quantity: 1,
        unit_price: 15000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Meta Ads Management (Facebook & Instagram High ROAS)',
        sku_hsn: 'SAC 998361',
        description: 'Facebook & Instagram ad setup, creative testing, and retargeting',
        quantity: 1,
        unit_price: 20000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Google Ads & YouTube PPC Campaign Setup & Optimization',
        sku_hsn: 'SAC 998361',
        description: 'Google Search & YouTube PPC management with conversion tracking',
        quantity: 1,
        unit_price: 22000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: '1-on-1 Growth & Digital Marketing Strategy Consultation',
        sku_hsn: 'SAC 998311',
        description: 'Strategic growth advisory & 90-day execution roadmap',
        quantity: 1,
        unit_price: 15000,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  },
  {
    name: 'AI Workflow & WhatsApp Marketing Automation Suite',
    code: 'PKG-AI-WHATSAPP',
    description: 'Cutting-edge AI operations: 24/7 LLM customer support agent, n8n automated backend workflows, official Meta WhatsApp API broadcast engine, and email automation.',
    category: 'AI & Automation',
    package_type: 'service',
    badge: 'AI Powered',
    original_price: 110000,
    package_price: 79999,
    discount_rate: 27,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'service',
        name: 'Custom AI Customer Support & Sales Agent (LLM-Powered)',
        sku_hsn: 'SAC 998314',
        description: 'Proprietary knowledge-trained RAG AI agent on website and WhatsApp',
        quantity: 1,
        unit_price: 45000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'AI Workflow Automation (n8n / Make / Custom Webhooks)',
        sku_hsn: 'SAC 998314',
        description: 'Cross-platform automation linking CRM, billing, and databases',
        quantity: 1,
        unit_price: 25000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'WhatsApp Business Cloud API & Marketing Automation System',
        sku_hsn: 'SAC 998361',
        description: 'Official WhatsApp Cloud API bot and broadcast automation',
        quantity: 1,
        unit_price: 22000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Cold & Bulk Email Marketing System (SMTP / Klaviyo / Warmup)',
        sku_hsn: 'SAC 998361',
        description: 'Cold email deliverability infrastructure and warmup',
        quantity: 1,
        unit_price: 18000,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  },
  {
    name: 'Enterprise Digital SaaS Suite (CRM + HRM + BillingFlow)',
    code: 'PKG-SAAS-CORP',
    description: 'Complete all-in-one business software backbone: BillingFlow Financial CRM, Enterprise Omnichannel CRM, and HRM & Payroll Cloud Suite.',
    category: 'Software Products & SaaS',
    package_type: 'product',
    badge: 'Enterprise',
    original_price: 94999,
    package_price: 69999,
    discount_rate: 26,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'product',
        name: 'BillingFlow Invoicing & Financial CRM License (Annual/Lifetime)',
        sku_hsn: 'SAC 998314',
        description: 'Multi-tenant billing, GST invoicing, subscriptions and client portal',
        quantity: 1,
        unit_price: 24999,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'product',
        name: 'Omnichannel Enterprise CRM Software Setup & Deployment',
        sku_hsn: 'SAC 998314',
        description: 'Sales pipelines, deal tracking, and automated lead capture system',
        quantity: 1,
        unit_price: 38000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'product',
        name: 'HRM & Payroll Management Cloud Suite',
        sku_hsn: 'SAC 998314',
        description: 'Attendance tracking, salary slips, and compliance filing suite',
        quantity: 1,
        unit_price: 32000,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  },
  {
    name: 'Google AdSense & SEO Monetization Package',
    code: 'PKG-ADSENSE-SEO',
    description: 'Maximize website revenue: Full site SEO audit, AdSense policy optimization, high RPM ad unit placement, and local organic traffic boost.',
    category: 'Paid Advertising',
    package_type: 'service',
    badge: 'Monetization',
    original_price: 35500,
    package_price: 27999,
    discount_rate: 21,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'service',
        name: 'Google AdSense Setup, Approval & Monetization Advisory',
        sku_hsn: 'SAC 998361',
        description: 'AdSense approval audit, high-CTR ad layout and header bidding',
        quantity: 1,
        unit_price: 14000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Comprehensive Technical & On-Page SEO Audit',
        sku_hsn: 'SAC 998361',
        description: 'Technical site health and content gap audit',
        quantity: 1,
        unit_price: 12000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Local SEO & Google Business Profile (GBP) 3-Pack Optimization',
        sku_hsn: 'SAC 998361',
        description: 'Local presence and Google 3-Pack rank booster',
        quantity: 1,
        unit_price: 9500,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  },
  {
    name: 'Omnichannel Email & WhatsApp Lead Outreach Machine',
    code: 'PKG-OUTREACH-MAX',
    description: 'Cold outreach system combining high-deliverability cold email sending domains with WhatsApp Cloud API automation and CRM integration.',
    category: 'Marketing Automation',
    package_type: 'service',
    badge: 'Lead Gen',
    original_price: 40000,
    package_price: 31999,
    discount_rate: 20,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'service',
        name: 'Cold & Bulk Email Marketing System (SMTP / Klaviyo / Warmup)',
        sku_hsn: 'SAC 998361',
        description: 'Cold email sending domains, DKIM/DMARC and warmup sequences',
        quantity: 1,
        unit_price: 18000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'WhatsApp Business Cloud API & Marketing Automation System',
        sku_hsn: 'SAC 998361',
        description: 'Official WhatsApp bot, broadcast triggers, and interactive messaging',
        quantity: 1,
        unit_price: 22000,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  },
  {
    name: 'E-Commerce Growth Master Package',
    code: 'PKG-ECOM-GROWTH',
    description: 'All-inclusive e-commerce scale setup: Custom online store, Meta Ads, Google Shopping PPC, and automated WhatsApp cart recovery bot.',
    category: 'Web Development',
    package_type: 'hybrid',
    badge: 'E-Commerce',
    original_price: 112000,
    package_price: 84999,
    discount_rate: 24,
    discount_type: 'percentage',
    tax_mode: 'item_wise',
    custom_tax_rate: 18,
    items: [
      {
        item_type: 'service',
        name: 'E-Commerce Online Store (Custom / Shopify / WooCommerce)',
        sku_hsn: 'SAC 998314',
        description: 'Full store setup with payment gateway, catalog, and checkout',
        quantity: 1,
        unit_price: 48000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Meta Ads Management (Facebook & Instagram High ROAS)',
        sku_hsn: 'SAC 998361',
        description: 'Targeted e-commerce conversion ads and catalog sales',
        quantity: 1,
        unit_price: 20000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'Google Ads & YouTube PPC Campaign Setup & Optimization',
        sku_hsn: 'SAC 998361',
        description: 'Google Shopping and Performance Max product ads',
        quantity: 1,
        unit_price: 22000,
        tax_rate: 18,
        discount_rate: 0
      },
      {
        item_type: 'service',
        name: 'WhatsApp Business Cloud API & Marketing Automation System',
        sku_hsn: 'SAC 998361',
        description: 'Automated abandoned cart recovery and order shipment updates',
        quantity: 1,
        unit_price: 22000,
        tax_rate: 18,
        discount_rate: 0
      }
    ]
  }
];

// =========================================================================
// 3. EXPORT / IMPORT & BROWSER STORAGE HELPER FUNCTIONS
// =========================================================================

/**
 * Downloads a data object as a formatted JSON file in the browser.
 */
export function downloadJsonFile(filename: string, data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an uploaded package JSON file content.
 */
export function validateAndParsePackageJson(jsonString: string): { valid: boolean; packages?: any[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    let pkgsArray: any[] = [];

    if (Array.isArray(parsed)) {
      pkgsArray = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.packages)) {
        pkgsArray = parsed.packages;
      } else if (parsed.name && (parsed.items || parsed.package_price !== undefined)) {
        pkgsArray = [parsed];
      } else {
        return { valid: false, error: 'JSON format not recognized. Expected package object or array of packages.' };
      }
    } else {
      return { valid: false, error: 'Invalid JSON structure.' };
    }

    // Clean and normalize packages
    const cleanedPackages = pkgsArray.map((p, index) => {
      const items = Array.isArray(p.items) ? p.items.map((it: any) => ({
        item_type: it.item_type || it.itemType || 'service',
        name: it.name || it.description || `Item ${index + 1}`,
        description: it.description || '',
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price || it.unitPrice) || 0,
        tax_rate: Number(it.tax_rate || it.taxRate) || 0,
        discount_rate: Number(it.discount_rate || it.discountRate) || 0,
        catalog_item_id: it.catalog_item_id || it.catalogItemId || null
      })) : [];

      const origPrice = Number(p.original_price || p.originalPrice) || 
        items.reduce((sum: number, it: any) => sum + (it.quantity * it.unit_price), 0);

      const pkgPrice = Number(p.package_price || p.packagePrice) || origPrice;
      const discountRate = Number(p.discount_rate || p.discountRate) || 
        (origPrice > 0 ? Math.round(((origPrice - pkgPrice) / origPrice) * 100) : 0);

      return {
        id: p.id || undefined,
        name: p.name || `Imported Package ${index + 1}`,
        code: p.code || `PKG-IMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        description: p.description || '',
        package_type: p.package_type || p.packageType || 'hybrid',
        original_price: origPrice,
        package_price: pkgPrice,
        discount_rate: Math.max(0, discountRate),
        discount_type: p.discount_type || 'percentage',
        tax_mode: p.tax_mode || 'item_wise',
        custom_tax_rate: Number(p.custom_tax_rate || p.customTaxRate) || 18,
        status: p.status || 'active',
        items
      };
    });

    if (cleanedPackages.length === 0) {
      return { valid: false, error: 'No valid packages found in JSON file.' };
    }

    return { valid: true, packages: cleanedPackages };
  } catch (err: any) {
    return { valid: false, error: `JSON Parse Error: ${err.message || 'Malformed JSON'}` };
  }
}
