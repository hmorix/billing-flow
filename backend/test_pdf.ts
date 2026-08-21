import { generateInvoicePDF } from './src/services/pdfService';
import { D1DatabaseAdapter, R2ToSupabaseStorageAdapter } from './src/adapters';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const dbUrl = 'postgresql://postgres.zhaosocqgqdhpaghgvyz:1962%23%241234569888@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
    const env = {
      DB: new D1DatabaseAdapter(dbUrl),
      BUCKET: new R2ToSupabaseStorageAdapter(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, 'billingflow-logos')
    };

    // Grab first invoice
    const invoice = await env.DB.prepare("SELECT * FROM invoices LIMIT 1").first();
    if (!invoice) {
      console.log("No invoices found in the database. Cannot test.");
      process.exit(0);
    }

    console.log("Testing PDF generation for Invoice:", invoice.id, "Org:", invoice.organization_id);
    const pdfBuffer = await generateInvoicePDF(invoice.id, invoice.organization_id, env);
    console.log("Success! PDF Buffer size:", pdfBuffer.length);
    require('fs').writeFileSync('test.pdf', pdfBuffer);
    process.exit(0);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    process.exit(1);
  }
}

run();
