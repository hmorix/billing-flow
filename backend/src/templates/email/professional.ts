import { EmailTemplateData, getLogoHeader } from './types';

export function renderProfessionalEmail(data: EmailTemplateData): string {
  const {
    orgName,
    clientName,
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    subtotal,
    discount,
    hasCgstSgst,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    hasIgst,
    igstRate,
    igstAmount,
    hasFlatTax,
    taxRate,
    taxAmount,
    total,
    publicBillUrl,
    logoUrl,
    bankName,
    bankAccountNo,
    bankIfsc,
    bankUpiId,
    contactPhone,
    contactEmail,
    thanksMessage
  } = data;
  const logoHeader = getLogoHeader(logoUrl, orgName).light;

  let taxRows = '';
  if (hasCgstSgst) {
    taxRows += `
      <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem;">CGST (${cgstRate}%)</td><td style="padding:6px 0;color:#334155;text-align:right;font-size:0.85rem;">${currency} ${cgstAmount}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem;">SGST (${sgstRate}%)</td><td style="padding:6px 0;color:#334155;text-align:right;font-size:0.85rem;">${currency} ${sgstAmount}</td></tr>
    `;
  } else if (hasIgst) {
    taxRows += `
      <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem;">IGST (${igstRate}%)</td><td style="padding:6px 0;color:#334155;text-align:right;font-size:0.85rem;">${currency} ${igstAmount}</td></tr>
    `;
  } else if (hasFlatTax) {
    taxRows += `
      <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem;">Tax (${taxRate}%)</td><td style="padding:6px 0;color:#334155;text-align:right;font-size:0.85rem;">${currency} ${taxAmount}</td></tr>
    `;
  }

  let bankSection = '';
  if (bankName || bankAccountNo || bankIfsc || bankUpiId || contactPhone) {
    bankSection = `
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:24px;">
        <h4 style="margin:0 0 10px;color:#1e3a8a;font-size:0.9rem;font-weight:700;">Payment & Bank Details</h4>
        <table style="width:100%;font-size:0.85rem;color:#334155;">
          ${bankName ? `<tr><td style="padding:3px 0;color:#64748b;width:120px;">Bank Name:</td><td style="font-weight:600;">${bankName}</td></tr>` : ''}
          ${bankAccountNo ? `<tr><td style="padding:3px 0;color:#64748b;">Account No:</td><td style="font-weight:600;">${bankAccountNo}</td></tr>` : ''}
          ${bankIfsc ? `<tr><td style="padding:3px 0;color:#64748b;">IFSC / SWIFT:</td><td style="font-weight:600;">${bankIfsc}</td></tr>` : ''}
          ${bankUpiId ? `<tr><td style="padding:3px 0;color:#64748b;">UPI ID:</td><td style="font-weight:600;">${bankUpiId}</td></tr>` : ''}
          ${contactPhone ? `<tr><td style="padding:3px 0;color:#64748b;">Pay Contact:</td><td style="font-weight:600;">${contactPhone}</td></tr>` : ''}
        </table>
      </div>
    `;
  }

  return `
  <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#f0f4f8;padding:40px 16px;min-height:100vh;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:36px 40px;text-align:center;">
        ${logoHeader}
        <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:700;letter-spacing:-0.3px;">${orgName}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.85rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Official Tax Invoice & Payment Notice</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#1e293b;font-size:1.05rem;line-height:1.6;margin:0 0 10px;">Dear <strong>${clientName}</strong>,</p>
        <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 24px;">Please find below the billing summary for Invoice <strong style="color:#1e293b;">${invoiceNumber}</strong> issued by <strong>${orgName}</strong>.</p>
        
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:22px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#64748b;font-size:0.9rem;">Invoice Number</td><td style="padding:6px 0;color:#0f172a;font-weight:700;text-align:right;">${invoiceNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:0.9rem;">Issue Date</td><td style="padding:6px 0;color:#334155;text-align:right;">${issueDate}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:0.9rem;">Due Date</td><td style="padding:6px 0;color:#dc2626;font-weight:700;text-align:right;">${dueDate}</td></tr>
            <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 0 4px;color:#64748b;font-size:0.85rem;">Subtotal</td><td style="padding:8px 0 4px;color:#334155;text-align:right;font-size:0.85rem;">${currency} ${subtotal}</td></tr>
            ${discount && Number(discount) > 0 ? `<tr><td style="padding:4px 0;color:#64748b;font-size:0.85rem;">Discount</td><td style="padding:4px 0;color:#ef4444;text-align:right;font-size:0.85rem;">-${currency} ${discount}</td></tr>` : ''}
            ${taxRows}
            <tr style="border-top:2px solid #cbd5e1;"><td style="padding:14px 0 0;color:#0f172a;font-size:1.05rem;font-weight:700;">Total Amount Due</td><td style="padding:14px 0 0;color:#2563eb;font-size:1.35rem;font-weight:800;text-align:right;">${currency} ${total}</td></tr>
          </table>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="${publicBillUrl}" target="_blank" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:0.95rem;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
            📄 View & Download Bill Online
          </a>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:0.75rem;">Access private invoice without logging in</p>
        </div>

        ${bankSection}

        <p style="color:#475569;font-size:0.9rem;line-height:1.6;margin:0 0 20px;">
          ${thanksMessage || 'Thank you for your business! We appreciate your prompt payment.'}
        </p>

        <p style="color:#334155;font-size:0.9rem;margin:0;">Warm regards,<br><strong style="color:#0f172a;">${orgName}</strong></p>
      </div>
      
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center;">
        <p style="color:#64748b;font-size:0.75rem;margin:0;">Official notification issued by ${orgName}.</p>
        <p style="color:#4338ca;font-size:0.75rem;font-weight:700;margin:4px 0 0;">BillingFlow • Powered by HMorix</p>
      </div>
    </div>
  </div>`;
}
