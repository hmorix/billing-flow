import nodemailer from 'nodemailer';
import { renderEmailTemplate } from '../templates/email';
import { calculateTaxBreakdown } from '../templates/pdf/types';
import { generateInvoicePDF } from './pdfService';

export async function sendReminderEmail(invoiceId: string, organizationId: string, env: any) {
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND organization_id = ?")
    .bind(invoiceId, organizationId)
    .first();

  if (!invoice) throw new Error('Invoice not found');

  const client = await env.DB.prepare("SELECT * FROM clients WHERE id = ? AND organization_id = ?")
    .bind(invoice.client_id, organizationId)
    .first();

  if (!client) throw new Error('Client not found');

  const org = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?")
    .bind(organizationId)
    .first();

  if (!org) throw new Error('Organization not found');

  const { results: items } = await env.DB.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
    .bind(invoiceId)
    .all();

  let subtotal = 0;
  items.forEach((item: any) => {
    subtotal += Number(item.quantity) * Number(item.unit_price);
  });

  const taxInfo = calculateTaxBreakdown(invoice, subtotal);
  const total = taxInfo.grandTotal;

  const appUrl = (typeof process !== 'undefined' && process.env?.APP_URL) ? process.env.APP_URL : 'http://localhost:5173';
  const publicBillUrl = `${appUrl}/view/invoice/${invoice.view_token || invoice.id}`;

  const subject = `Tax Invoice #${invoice.invoice_number} from ${org.name}`;
  const body = `Dear ${client.name},\n\nThis is a payment notice regarding Invoice ${invoice.invoice_number} issued by ${org.name}.\n\nTotal Due: ${invoice.currency || 'INR'} ${total.toFixed(2)}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nYou can view and download your invoice privately here:\n${publicBillUrl}\n\nThank you,\n${org.name}`;

  const emailTemplateKey = org.email_template || 'professional';

  const htmlBody = renderEmailTemplate(emailTemplateKey, {
    orgName: org.name,
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    issueDate: new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    dueDate: new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    currency: invoice.currency || 'INR',
    subtotal: subtotal.toFixed(2),
    discount: taxInfo.discount > 0 ? taxInfo.discount.toFixed(2) : undefined,
    hasCgstSgst: taxInfo.hasCgstSgst,
    cgstRate: taxInfo.cgstRate,
    cgstAmount: taxInfo.cgstAmount.toFixed(2),
    sgstRate: taxInfo.sgstRate,
    sgstAmount: taxInfo.sgstAmount.toFixed(2),
    hasIgst: taxInfo.hasIgst,
    igstRate: taxInfo.igstRate,
    igstAmount: taxInfo.igstAmount.toFixed(2),
    hasFlatTax: taxInfo.hasFlatTax,
    taxRate: taxInfo.taxRate,
    taxAmount: taxInfo.taxAmount.toFixed(2),
    total: total.toFixed(2),
    publicBillUrl,
    logoUrl: org.logo_url || null,
    bankName: org.bank_name || null,
    bankAccountNo: org.bank_account_no || null,
    bankIfsc: org.bank_ifsc || null,
    bankUpiId: org.bank_upi_id || null,
    contactPhone: org.contact_phone || org.phone || null,
    contactEmail: org.contact_email || null,
    termsConditions: invoice.terms_conditions || org.terms_conditions || null,
    thanksMessage: invoice.thanks_message || org.thanks_message || null,
  });

  let sentReal = false;

  if (org.smtp_host && org.smtp_port && org.smtp_user && org.smtp_pass && org.smtp_from) {
    try {
      const transporter = nodemailer.createTransport({
        host: org.smtp_host,
        port: Number(org.smtp_port),
        secure: Number(org.smtp_port) === 465,
        auth: { user: org.smtp_user, pass: org.smtp_pass },
        tls: { rejectUnauthorized: false }
      });

      let attachments: any[] = [];
      try {
        const pdfBuffer = await generateInvoicePDF(invoiceId, organizationId, env);
        if (pdfBuffer) {
          attachments.push({
            filename: `Invoice_${invoice.invoice_number || invoiceId}.pdf`,
            content: Buffer.from(pdfBuffer),
            contentType: 'application/pdf',
          });
        }
      } catch (pdfErr) {
        console.warn('Could not generate PDF attachment for email:', pdfErr);
      }

      await transporter.sendMail({
        from: `"${org.name}" <${org.smtp_from}>`,
        to: client.email,
        subject,
        text: body,
        html: htmlBody,
        attachments,
      });

      sentReal = true;
      console.log(`[SMTP EMAIL SENT] Real email sent to ${client.email} via ${org.smtp_host}`);
    } catch (smtpErr) {
      console.error('SMTP sending failed. Virtual log stored:', smtpErr);
    }
  }

  await env.DB.prepare("INSERT INTO email_logs (id, organization_id, invoice_id, to_email, subject, body) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), organizationId, invoiceId, client.email, subject, body)
    .run();

  return { to_email: client.email, subject, body, sentReal, publicBillUrl };
}
