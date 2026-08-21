import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { drawPdfTemplate } from '../templates/pdf';

async function resolveLogoUri(logoUrl: string | null | undefined, env: any): Promise<string | null> {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('data:image/')) return logoUrl;

  try {
    let key = logoUrl;
    if (logoUrl.includes('/billingflow-logos/')) {
      key = logoUrl.split('/billingflow-logos/').pop() || logoUrl;
    } else if (logoUrl.startsWith('/uploads/')) {
      key = logoUrl.replace('/uploads/', '');
    }

    if (env?.BUCKET?.get) {
      try {
        const logoObject = await env.BUCKET.get(key);
        if (logoObject) {
          const logoArrayBuffer = await logoObject.arrayBuffer();
          const logoBytes = new Uint8Array(logoArrayBuffer);
          let binary = '';
          for (let i = 0; i < logoBytes.byteLength; i++) {
            binary += String.fromCharCode(logoBytes[i]);
          }
          const base64 = btoa(binary);
          const ext = key.split('.').pop()?.toLowerCase() ?? 'png';
          const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
          return `data:${mime};base64,${base64}`;
        }
      } catch (e) {
        // Fallback to fetch below
      }
    }

    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const contentType = res.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${base64}`;
      }
    }
  } catch (err) {
    console.warn('Failed to resolve logo image for PDF:', err);
  }
  return null;
}

async function resolveQrCodeUri(paymentLink: string | null | undefined): Promise<string | null> {
  if (!paymentLink || !paymentLink.trim()) return null;
  try {
    return await QRCode.toDataURL(paymentLink.trim(), {
      margin: 1,
      width: 250,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch (e) {
    console.error('Failed to generate QR code Data URI:', e);
    return null;
  }
}

export async function generateInvoicePDF(invoiceId: string, organizationId: string, env: any): Promise<Buffer> {
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND organization_id = ?")
    .bind(invoiceId, organizationId)
    .first();
  if (!invoice) throw new Error('Invoice not found');

  const client = await env.DB.prepare("SELECT * FROM clients WHERE id = ? AND organization_id = ?")
    .bind(invoice.client_id, organizationId)
    .first();
  if (!client) throw new Error('Client not found');

  const organization = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?")
    .bind(organizationId)
    .first();
  if (!organization) throw new Error('Organization not found');

  const { results: items } = await env.DB.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
    .bind(invoiceId)
    .all();

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const logoUri: string | null = await resolveLogoUri(organization.logo_url, env);
      const qrCodeUri: string | null = await resolveQrCodeUri(organization.payment_qr_link);

      const template = organization.invoice_template || 'modern_purple';
      
      drawPdfTemplate(template, {
        doc,
        invoice,
        client,
        organization,
        items,
        logoUri,
        qrCodeUri
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
