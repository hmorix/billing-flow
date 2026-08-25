-- 1. Organizations (Multi-tenant company profiles)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'none' NOT NULL,
  subscription_plan TEXT DEFAULT 'free' NOT NULL,
  address TEXT,
  tax_id TEXT,
  phone TEXT,
  logo_url TEXT,
  invoice_template TEXT DEFAULT 'modern_purple' NOT NULL,
  email_template TEXT DEFAULT 'professional' NOT NULL,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_pass TEXT,
  smtp_from TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Tenants can have multiple users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL,
  is_verified INTEGER DEFAULT 0 NOT NULL,
  verification_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 3. Clients (Scoped by organization)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  tax_id TEXT,
  address TEXT NOT NULL,
  phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);

-- 4. Invoices (Scoped by organization)
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  tax_rate REAL DEFAULT 0.00 NOT NULL,
  discount REAL DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE (organization_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

-- 5. Invoice Items (Individual rows on an invoice)
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items(invoice_id);

-- 6. Payments (Record payments made towards invoices)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- 7. Simulated/Mock Email Log (for viewing invoice reminder logs)
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_email_logs_org ON email_logs(organization_id);

-- 8. Custom visual invoice templates designed by users
CREATE TABLE IF NOT EXISTS custom_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  config TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_templates_org ON custom_templates(organization_id);

-- 9. Catalog Items (Products & Services with inventory and GST support)
CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'product', -- 'product' or 'service'
  sku TEXT,
  hsn_sac TEXT,
  description TEXT,
  unit_price REAL NOT NULL DEFAULT 0.00,
  cost_price REAL DEFAULT 0.00,
  tax_rate REAL DEFAULT 0.00, -- GST rate e.g. 0, 5, 12, 18, 28
  unit TEXT DEFAULT 'unit', -- 'pcs', 'hrs', 'month', 'kg', 'set', etc.
  track_inventory INTEGER DEFAULT 0, -- 1 for products with stock tracking, 0 for services
  stock_quantity REAL DEFAULT 0,
  low_stock_threshold REAL DEFAULT 5,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_catalog_items_org ON catalog_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON catalog_items(organization_id, type);

-- 10. Packages / Bundles
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  package_type TEXT DEFAULT 'hybrid', -- 'product', 'service', 'hybrid'
  original_price REAL DEFAULT 0.00,
  package_price REAL NOT NULL DEFAULT 0.00,
  discount_rate REAL DEFAULT 0.00,
  discount_type TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
  tax_mode TEXT DEFAULT 'item_wise', -- 'item_wise' or 'flat'
  custom_tax_rate REAL DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_packages_org ON packages(organization_id);

-- 11. Package Items (Items bundled within a package)
CREATE TABLE IF NOT EXISTS package_items (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  catalog_item_id TEXT,
  item_type TEXT NOT NULL DEFAULT 'service',
  name TEXT NOT NULL,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0.00,
  tax_rate REAL DEFAULT 0.00,
  discount_rate REAL DEFAULT 0.00,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_package_items_pkg ON package_items(package_id);

-- 12. Inventory Logs (Audit trail for stock movement)
CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  catalog_item_id TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'sale', 'restock', 'adjustment', 'return'
  quantity_change REAL NOT NULL,
  quantity_after REAL NOT NULL,
  reference_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_org ON inventory_logs(organization_id, catalog_item_id);

