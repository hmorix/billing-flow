import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('No DATABASE_URL found in environment variables.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully.');

    // 1. Create catalog_items
    console.log('Creating catalog_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalog_items (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'product',
        sku TEXT,
        hsn_sac TEXT,
        description TEXT,
        unit_price REAL NOT NULL DEFAULT 0.00,
        cost_price REAL DEFAULT 0.00,
        tax_rate REAL DEFAULT 0.00,
        unit TEXT DEFAULT 'unit',
        track_inventory INTEGER DEFAULT 0,
        stock_quantity REAL DEFAULT 0,
        low_stock_threshold REAL DEFAULT 5,
        category TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_catalog_items_org ON catalog_items(organization_id);
      CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON catalog_items(organization_id, type);
    `);
    console.log('✅ catalog_items table created.');

    // 2. Create packages
    console.log('Creating packages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        package_type TEXT DEFAULT 'hybrid',
        original_price REAL DEFAULT 0.00,
        package_price REAL NOT NULL DEFAULT 0.00,
        discount_rate REAL DEFAULT 0.00,
        discount_type TEXT DEFAULT 'percentage',
        tax_mode TEXT DEFAULT 'item_wise',
        custom_tax_rate REAL DEFAULT 0.00,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_packages_org ON packages(organization_id);
    `);
    console.log('✅ packages table created.');

    // 3. Create package_items
    console.log('Creating package_items table...');
    await client.query(`
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_package_items_pkg ON package_items(package_id);
    `);
    console.log('✅ package_items table created.');

    // 4. Create inventory_logs
    console.log('Creating inventory_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        catalog_item_id TEXT NOT NULL,
        change_type TEXT NOT NULL,
        quantity_change REAL NOT NULL,
        quantity_after REAL NOT NULL,
        reference_id TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_logs_org ON inventory_logs(organization_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_logs_item ON inventory_logs(catalog_item_id);
    `);
    console.log('✅ inventory_logs table created.');

    // 5. Add columns to organizations, invoices, invoice_items
    console.log('Adding extra columns if missing...');
    await client.query(`
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'hybrid';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS auto_deduct_inventory INTEGER DEFAULT 1;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_calculation_type TEXT DEFAULT 'invoice_level';
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'custom';
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sku_hsn TEXT;
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_rate REAL DEFAULT 0;
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount_rate REAL DEFAULT 0;
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS catalog_item_id TEXT;
    `);
    console.log('✅ Columns added successfully.');

    client.release();
    await pool.end();
    console.log('🎉 Migration completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  }
}

main();
