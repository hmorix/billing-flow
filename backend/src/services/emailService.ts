import nodemailer from 'nodemailer';
import { renderEmailTemplate } from '../templates/email';

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

  const discount = Number(invoice.discount || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (Number(invoice.tax_rate || 0) / 100);
  const total = taxableAmount + tax;

  const subject = `Reminder: Invoice ${invoice.invoice_number} from ${org.name}`;
  const body = `Dear ${client.name},\n\nThis is a payment reminder regarding Invoice ${invoice.invoice_number} issued by ${org.name}.\n\nTotal Due: ${invoice.currency || 'USD'} ${total.toFixed(2)}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nThank you,\n${org.name}`;

  const emailTemplateKey = org.email_template || 'professional';

  const htmlBody = renderEmailTemplate(emailTemplateKey, {
    orgName: org.name,
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    issueDate: new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    dueDate: new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    currency: invoice.currency || 'USD',
    total: total.toFixed(2),
    logoUrl: org.logo_url || null,
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

      await transporter.sendMail({
        from: `"${org.name}" <${org.smtp_from}>`,
        to: client.email,
        subject,
        text: body,
        html: htmlBody,
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

  return { to_email: client.email, subject, body, sentReal };
}
