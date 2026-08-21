require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function migrate() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:dfukhdfsdhdhf@db.uklrlkpkmuxnvkmpxyzg.supabase.co:5432/postgres';
  const supabaseUrl = process.env.SUPABASE_URL || 'https://uklrlkpkmuxnvkmpxyzg.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHJsa3BrbXV4bnZrbXB4eXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMwMzM3NCwiZXhwIjoyMTAyODc5Mzc0fQ.t8WSdjf_tVYts-1kDrOA2QRkHo51dCAjGGI1qXCuNPo';

  console.log('Connecting to PostgreSQL to run schema migration...');
  const client = new Client({ 
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const sqlPath = path.join(__dirname, 'postgres_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Database schema migrated successfully! All tables created.');
  } catch (error) {
    console.error('❌ Error executing schema migration:', error.message || error);
  } finally {
    await client.end();
  }

  console.log('Connecting to Supabase Storage...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.storage.createBucket('billingflow-logos', {
    public: true,
    fileSizeLimit: 10485760 // 10MB
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      console.log('✅ Storage Bucket "billingflow-logos" already exists.');
    } else {
      console.error('⚠️ Storage Bucket creation note:', error.message || error);
    }
  } else {
    console.log('✅ Storage Bucket "billingflow-logos" created successfully:', data);
  }
}

migrate();
