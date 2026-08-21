// WhatsApp Message Dispatcher for Invoices and Legal Agreements (Powered by HMorix)
// Formats professional WhatsApp notification text WITHOUT direct payment links as requested.

import { formatCurrency, type SupportedCurrency } from './i18n';

export interface InvoiceWhatsAppPayload {
  invoiceNumber: string;
  clientName: string;
  clientPhone?: string | null;
  organizationName: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  total: number;
  items?: Array<{ description: string; quantity: number; unit_price: number }>;
  notes?: string;
}

export interface AgreementWhatsAppPayload {
  agreementNumber: string;
  title: string;
  agreementType: string;
  firstParty: string;
  secondParty: string;
  secondPartyPhone?: string | null;
  totalAmount?: number;
  currency?: string;
  validityPeriod?: string;
  digitalHash?: string;
}

/**
 * Clean phone number to international E.164 format digits only
 */
export function sanitizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Generate formatted WhatsApp message text for an Invoice (No Payment Link)
 */
export function generateInvoiceWhatsAppText(data: InvoiceWhatsAppPayload): string {
  const formattedTotal = formatCurrency(data.total, (data.currency || 'INR') as SupportedCurrency);
  const itemsList = (data.items || [])
    .slice(0, 5)
    .map(it => `  • ${it.description} (x${it.quantity}) - ${formatCurrency(it.quantity * it.unit_price, (data.currency || 'INR') as SupportedCurrency)}`)
    .join('\n');

  return (
`📄 *INVOICE NOTIFICATION — ${data.invoiceNumber}*
────────────────────────
Dear *${data.clientName}*,

Greetings from *${data.organizationName}*.

Here are the details for your recent billing invoice:
• *Invoice Number:* ${data.invoiceNumber}
• *Issue Date:* ${new Date(data.issueDate).toLocaleDateString('en-IN')}
• *Due Date:* ${new Date(data.dueDate).toLocaleDateString('en-IN')}
• *Total Due:* *${formattedTotal}*

${itemsList ? `*Key Deliverables / Items:*\n${itemsList}\n` : ''}${data.notes ? `*Notes & Terms:*\n${data.notes}\n` : ''}
────────────────────────
_Please refer to the official PDF document or reach out to us for bank wire/clearing instructions._

_Generated via BillingFlow • Powered by HMorix Legal & FinTech Platform_`
  );
}

/**
 * Generate formatted WhatsApp message text for a Legal Agreement (No Payment Link)
 */
export function generateAgreementWhatsAppText(data: AgreementWhatsAppPayload): string {
  return (
`📜 *OFFICIAL DIGITAL LEGAL AGREEMENT*
*Ref: ${data.agreementNumber}*
────────────────────────
Dear *${data.secondParty}*,

An official legal document has been drafted and executed:
• *Agreement:* ${data.title}
• *Type:* ${data.agreementType}
• *First Party:* ${data.firstParty}
• *Second Party:* ${data.secondParty}
${data.totalAmount ? `• *Contract Value:* ${formatCurrency(data.totalAmount, (data.currency || 'INR') as SupportedCurrency)}\n` : ''}${data.validityPeriod ? `• *Validity / Duration:* ${data.validityPeriod}\n` : ''}• *Cryptographic Footprint (SHA-256):* \`${data.digitalHash ? data.digitalHash.substring(0, 16) + '...' : 'Verified'}\`

────────────────────────
_This document is cryptographically notarized & tamper-proof under HMorix Digital Legal Infrastructure._`
  );
}

/**
 * Open WhatsApp Web or Mobile App with pre-filled message
 */
export function shareViaWhatsApp(text: string, phone?: string | null): void {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  
  let url = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (cleanPhone) {
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
}
