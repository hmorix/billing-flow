const fs = require('fs');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function migrate() {
  const dbUrl = 'postgresql://postgres.zhaosocqgqdhpaghgvyz:1962%23%241234569888@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
  const supabaseUrl = 'https://zhaosocqgqdhpaghgvyz.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYW9zb2NxZ3FkaHBhZ2hndnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDcxNDUwOSwiZXhwIjoyMTAwMjkwNTA5fQ.jWfx2VRThLbKRSnYbCJdZ9cYthRMljA0fIA3x12RsO4';

  console.log('Connecting to PostgreSQL to run schema...');
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const sql = fs.readFileSync('postgres_schema.sql', 'utf8');
    await client.query(sql);
    console.log('Database schema executed successfully.');
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await client.end();
  }

  console.log('Creating storage bucket in Supabase...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.storage.createBucket('billingflow-logos', {
    public: true,
    fileSizeLimit: 10485760 // 10MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket created successfully:', data);
  }
}

migrate();
